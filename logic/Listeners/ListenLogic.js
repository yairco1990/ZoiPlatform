const requestify = require('requestify');
const MyLog = require('../../interfaces/MyLog');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment-timezone');
const facebookResponse = require('../../interfaces/FacebookResponse');
const request = require('request');
const SharedLogic = require('../SharedLogic');
const WelcomeLogic = require('../Intents/WelcomeLogic');
const AppointmentLogic = require('../Intents/AppointmentLogic');
const ClientLogic = require('../Intents/ClientLogic');
const GeneralLogic = require('../Intents/GeneralLogic');
const GenericLogic = require('../Intents/GenericLogic');
const ZoiConfig = require('../../config');
const IntegrationHelper = require('../Helpers/IntegrationHelper');
const DBManager = require('../../dal/DBManager');
const ConversationLogic = require('../ConversationLogic');

//fall back message
const fallbackText = "I don't know what that means 😕, Please try to say it again in a different way. You can also try to use my preset actions in the menu.";

/**
 * ListenLogic constructor
 * @constructor
 */
class ListenLogic {

	constructor() {
	}

	/**
	 * process intent with NLP and return response
	 * @param setBotTyping - function, launch it if you want to send to the user that the bot is typing
	 * @param requestPayload - request object, contains sender details, message and other stuff
	 * @param input - the user input
	 * @param reply - send message to the user function
	 */
	async processInput(input, requestPayload, setBotTyping, reply) {

		MyLog.info("User input = " + input);

		try {

			//get the user by the page user id
			let user = await DBManager.getUserByPageId(requestPayload.sender.id, false);

			let isNewUser = false;

			//if this is a new user
			if (!user || input.toLowerCase() === "resetzoi") {
				user = {};
				input = "resetzoi";
				isNewUser = true;
			}

			//check if its forced conversation
			const isForced = input.toLowerCase().startsWith("f:");

			//check if resume conversation
			const isResumedConversation = input === "resumedConvo";

			//IF ITS NOT VALID INPUT - SEND APPROPRIATE MESSAGE AND STOP THE CONVERSATION
			if (isResumedConversation || isForced || await ListenLogic.isValidInput(user, requestPayload, input)) {

				//check if this is quick reply
				let isQuickReply = MyUtils.nestedValue(requestPayload, "message.quick_reply.payload") || (MyUtils.nestedValue(user, "conversationData.nextAnswerState") === "qr");

				//check if the input is payload
				let isPayloadRequest = MyUtils.isJson(input);

				//check if wait for text message
				let isWaitForText = user.conversationData && user.conversationData.nextAnswerState === "text";

				//if forced - ignore quick reply or text answer.
				if (isForced) {
					isQuickReply = false;
					isWaitForText = false;
				}

				//declare variables
				let intent, entities, intentScore;

				//if it's not in the middle of conversation
				if (!isQuickReply && !isPayloadRequest && !isWaitForText && !isNewUser && !isForced && !isResumedConversation) {
					//check intent with NLP
					let nlpResponse = await requestify.get(ZoiConfig.NLP_URL + '/parse?q=' + input);

					nlpResponse = nlpResponse.getBody();

					intent = MyUtils.replaceAll("-", " ", nlpResponse.intent.name);
					entities = nlpResponse.entities;
					intentScore = nlpResponse.intent.confidence;

					//add input and intention to DB(do it async)
					DBManager.addInput({
						userId: user._id,
						input: input || "Voice Recognition Error Probably",
						intent: intent,
						score: intentScore
					});

				} else {
					intent = isQuickReply ? "Quick Reply" : isPayloadRequest ? "Payload Button" : isWaitForText ? "Text Answer" : "Text Answer";
					entities = "No entities";
					intentScore = 0;
				}

				MyLog.info("Intent -> " + intent);
				MyLog.info("Entities -> " + entities);
				MyLog.info("Score -> " + intentScore);

				//save conversation data
				let conversationData = {
					input: input,
					intent: intent,
					entities: entities,
					score: intentScore,
					context: intent.split(' ')[0].toUpperCase()//the type is the first word in the intent
				};

				//check if the user needed to send qr and this is a valid qr
				if (isQuickReply && MyUtils.isJson(MyUtils.nestedValue(requestPayload, "message.quick_reply.payload"))) {
					conversationData.payload = JSON.parse(requestPayload.message.quick_reply.payload);
					conversationData.intent = input;
					conversationData.entities = {};
					//case the user click on "Stop Conversation" button
					if (conversationData.payload.id === "LeaveConvo") {
						conversationData.context = "GENERIC";
						conversationData.intent = "generic say goodbye";
					} else if (conversationData.payload.id === "KeepConvo") {
						return;
					}
				}

				//if the user have no email or full name - go the complete the "welcome conversation"
				if (!user || input.toLowerCase() === "resetzoi") {
					conversationData.context = "WELCOME";
					//ignore the zoi-brain, and return the intent to the original input
					conversationData.intent = input;
					conversationData.entities = {};
				}
				//if the user in the middle of a conversation - get the context.
				//if the user want to leave the conversation - don't use the context, and delete the conversation data from the user
				else if (user && user.conversationData && conversationData.intent !== "generic say goodbye" && conversationData.intent !== "general no thanks") {
					conversationData.context = user.conversationData.context;
					conversationData.intent = user.conversationData.intent;
				}

				//save the last message time
				user.lastMessageTime = new Date().valueOf();

				//check if force conversation
				if (isForced) {
					user.conversationData = null;
					conversationData = ListenLogic.getForceConversationData(input);
				}

				//check that the user have no missing integrations
				if (!IntegrationHelper.areThereMissingIntegrations(user, conversationData.intent)) {
					//check the intent
					switch (conversationData.context) {
						case "WELCOME":
							const welcomeLogic = new WelcomeLogic(user, conversationData);
							return await welcomeLogic.processIntent(requestPayload);
							break;
						case "APPOINTMENT":
							const appointmentLogic = new AppointmentLogic(user, conversationData);
							return await appointmentLogic.processIntent();
							break;
						case "CLIENT":
							const clientLogic = new ClientLogic(user, conversationData);
							return await clientLogic.processIntent();
							break;
						case "GENERAL":
							const generalLogic = new GeneralLogic(user, conversationData);
							return await generalLogic.processIntent();
							break;
						case "GENERIC":
							const genericLogic = new GenericLogic(user, conversationData);
							return await genericLogic.processIntent();
							break;
						default:
							reply(facebookResponse.getTextMessage(fallbackText));
							break;
					}
				} else {

					const missingIntegrationsText = IntegrationHelper.getMissingIntegrationsText(user, conversationData.intent);

					MyLog.info("There are no minimum requirements for this intention -> " + conversationData.intent);

					//reply with the missing integrations
					reply(facebookResponse.getButtonMessage(`In order to make that happen, I need you to give me access to ${missingIntegrationsText}`, [
						facebookResponse.getGenericButton("web_url", "My Integrations", null, `${ZoiConfig.clientUrl}/integrations?userId=${user._id}&skipExtension=true`, null, false)
					]));
				}
			}
		} catch (err) {

			MyLog.error(err);

			try {

				const user = await DBManager.getUserByPageId(requestPayload.sender.id);

				user.conversationData = null;
				await DBManager.saveUser(user).then(function () {
					MyLog.info("user session deleted after error. userId -> " + user._id);

					(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage(fallbackText), false))();
				});

			} catch (err2) {
				MyLog.error(err2);
				(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage(fallbackText), false))();
			}
		}
	}

	/**
	 * @param input
	 */
	static getForceConversationData(input) {

		const selectedConvo = (input.substring(input.indexOf(":") + 1, input.length)).trim();

		const conversations = {
			"morning-brief": {
				context: "GENERAL",
				intent: "general morning brief",
			},
			"morning-brief-auto": {
				context: "GENERAL",
				intent: "general morning brief",
			},
			"rss": {
				context: "GENERAL",
				intent: "general suggest to post article"
			},
			"schedule": {
				context: "APPOINTMENT",
				intent: "appointment what is my schedule"
			},
			"promotions": {
				context: "APPOINTMENT",
				intent: "appointment send promotions"
			},
			"old-customers": {
				context: "CLIENT",
				intent: "client old customers"
			},
			"new-customer": {
				context: "CLIENT",
				intent: "client new customer join"
			},
			"show-emails": {
				context: "GENERIC",
				intent: "generic unread emails"
			},
			"get-started": {
				context: "WELCOME",
				intent: "welcome get started"
			}
		};

		const convoObj = conversations[selectedConvo];
		convoObj.input = input;

		return convoObj;
	}

	/**
	 * check valid input
	 * @param user
	 * @param payload
	 * @param input
	 * @returns {Promise.<boolean>}
	 */
	static async isValidInput(user, payload, input) {
		//check that there is a conversation
		if (user.conversationData) {
			const conversationLogic = new ConversationLogic(user, {});
			if (MyUtils.nestedValue(user, "conversationData.nextAnswerState") === "payload") {
				if (MyUtils.isJson(input)) {
					return true;
				} else {
					await conversationLogic.sendSingleMessage("Hey boss, please select one of the options. Don't worry, I'm not going to do anything without your permission.");
					return false;
				}
			}
			if (MyUtils.nestedValue(user, "conversationData.nextAnswerState") === "qr") {
				if (MyUtils.nestedValue(payload, "message.quick_reply.payload")) {
					return true;
				} else {
					await conversationLogic.sendMessagesV2([
						[facebookResponse.getTextMessage("Hey chief, please let's finish what we started."), true, ZoiConfig.delayTime],
						[user.conversationData.lastQRResponse]
					]);
					return false;
				}
			}
		}
		return true;
	}
}

module.exports = ListenLogic;