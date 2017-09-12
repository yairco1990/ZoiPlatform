const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
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
const Acuity = require('acuityscheduling');

//fall back message
const fallbackText = "I don't know what that means 😕, Please try to say it again in a different way. You can also try to use my preset actions in the menu.";

/**
 * ListenLogic constructor
 * @constructor
 */
class ListenLogic {

	constructor() {
		this.DBManager = require('../../dal/DBManager');
	}

	/**
	 * process intent with NLP and return response
	 * @param setBotTyping - function, launch it if you want to send to the user that the bot is typing
	 * @param payload - request object, contains sender details, message and other stuff
	 * @param input - the user input
	 * @param reply - send message to the user function
	 */
	async processInput(input, payload, setBotTyping, reply) {

		const self = this;

		MyLog.info("User input = " + input);

		try {

			//get the user
			let user = await self.DBManager.getUserById(payload.sender.id, false);

			let isNewUser = false;

			//if this is new user
			if (!user || input.toLowerCase() === "resetzoi") {
				user = {};
				input = "resetzoi";
				isNewUser = true;
			}

			//check if this is quick reply - or that he send qr, or that he must entered qr on the last question.
			const isQuickReply = MyUtils.nestedValue(payload, "message.quick_reply.payload") || (MyUtils.nestedValue(user, "conversationData.nextAnswerState") === "qr");

			//check if the input is payload
			const isPayloadRequest = MyUtils.isJson(input);

			//check if wait for text message
			const isWaitForText = user.conversationData && user.conversationData.nextAnswerState === "text";

			//check if its forced conversation
			const isForced = input.toLowerCase().startsWith("f:");

			//check if its forced but only if there is no conversation
			const isForcedIfThereIsNoConvo = input.toLowerCase().startsWith("zf:");

			//declare variables
			let intent, entities, intentScore;

			//if it's not in the middle of conversation
			if (!isQuickReply && !isPayloadRequest && !isWaitForText && !isNewUser && !isForced && !isForcedIfThereIsNoConvo) {
				//check intent with NLP
				let nlpResponse = await requestify.get(ZoiConfig.NLP_URL + '/parse?q=' + input);

				nlpResponse = nlpResponse.getBody();

				intent = MyUtils.replaceAll("-", " ", nlpResponse.intent.name);
				entities = nlpResponse.entities;
				intentScore = nlpResponse.intent.confidence;

				//add input and intention to DB(do it async)
				self.DBManager.addInput({
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
			if (isQuickReply && payload.message && payload.message.quick_reply && MyUtils.isJson(payload.message.quick_reply.payload)) {
				conversationData.payload = JSON.parse(payload.message.quick_reply.payload);
				conversationData.intent = input;
				conversationData.entities = {};
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
			//block user from proceed without integration with Acuity TODO think about remove this obligation
			// else if (!user.integrations.Acuity) {
			//
			// 	//create the redirect url
			// 	const acuity = Acuity.oauth(ZoiConfig.ACUITY_OAUTH);
			// 	const redirectUrl = acuity.getAuthorizeUrl({scope: 'api-v1', state: user._id});
			//
			// 	(MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("Hey boss! I noticed you forgot to integrate with your Acuity account. Click on this button for start working together! :)", [
			// 		facebookResponse.getGenericButton("web_url", "Acuity Integration", null, redirectUrl, "full", false)
			// 	]), false))();
			//
			// 	return;
			// }

			//save the last message time
			user.lastMessageTime = new Date().valueOf();

			//check if force conversation
			if (isForced || (isForcedIfThereIsNoConvo && !user.conversationData)) {
				//replace the zf with f
				input = input.replace("zf:", "f:");
				user.conversationData = null;
				conversationData = ListenLogic.getForceConversationData(input);
			}

			//check the intent
			switch (conversationData.context) {
				case "WELCOME":
					const welcomeLogic = new WelcomeLogic(user, conversationData);
					return await welcomeLogic.processIntent(payload);
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
					return await genericLogic.processIntent(conversationData, setBotTyping, payload, reply);
					break;
				default:
					reply(facebookResponse.getTextMessage(fallbackText));
					break;
			}

		} catch (err) {

			MyLog.error(err);

			try {

				const user = await self.DBManager.getUser({_id: payload.sender.id});

				user.conversationData = null;
				await self.DBManager.saveUser(user).then(function () {
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
			}
		};

		const convoObj = conversations[selectedConvo];
		convoObj.input = input;

		return convoObj;
	}
}

module.exports = ListenLogic;