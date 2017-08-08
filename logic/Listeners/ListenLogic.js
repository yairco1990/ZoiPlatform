const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const requestify = require('requestify');
const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const Mocks = require('../../interfaces/Mocks');
const request = require('request');
const SharedLogic = require('../SharedLogic');
const WelcomeLogic = require('../Intents/WelcomeLogic');
const AppointmentLogic = require('../Intents/AppointmentLogic');
const ClientLogic = require('../Intents/ClientLogic');
const GeneralLogic = require('../Intents/GeneralLogic');
const GenericLogic = require('../Intents/GenericLogic');
const ZoiConfig = require('../../config');

/**
 * ListenLogic constructor
 * @constructor
 */
function ListenLogic() {
	this.DBManager = require('../../dal/DBManager');
}

const delayTime = ZoiConfig.delayTime || 3000;
const fallbackText = "I don't know what that means 😕, Please try to say it again in a different way. You can also try to use my preset actions in the menu.";

/**
 * process intent with NLP and return response
 * @param setBotTyping - function, launch it if you want to send to the user that the bot is typing
 * @param bot - the bot object
 * @param payload - request object, contains sender details, message and other stuff
 * @param input - the user input
 * @param reply - send message to the user function
 */
ListenLogic.prototype.processInput = async function (input, payload, setBotTyping, bot, reply) {

	let self = this;

	Util.log("User input = " + input);

	try {

		//get the user
		let user = await self.DBManager.getUser({_id: payload.sender.id});

		//check if this is quick reply
		let isQuickReply = payload.message && payload.message.quick_reply && payload.message.quick_reply.payload;

		//check if the input is payload
		let isPayloadRequest = MyUtils.isJson(input);

		//TODO if the user entered text that resolved as bye zoi. what to do?
		//check if wait for text message
		// let isWaitForText = user.conversationData && user.conversationData.nextAnswerState === "text";

		//declare variables
		let intent, entities, intentScore;

		//if it's regular message
		if (!isQuickReply && !isPayloadRequest) {
			//check intent with NLP
			let nlpResponse = await requestify.request('http://52.177.185.253:5000/parse?q=' + input, {
				method: 'GET'
			});

			nlpResponse = nlpResponse.getBody();

			intent = MyUtils.replaceAll("-", " ", nlpResponse.intent.name);
			entities = nlpResponse.entities;
			intentScore = nlpResponse.intent.confidence;
		} else {
			intent = isQuickReply ? "Quick Reply" : isPayloadRequest ? "Payload Button" : "Error: What the intent?";
			entities = "No entities";
			intentScore = 0;
		}

		Util.log("Intent -> " + intent);
		Util.log("Entities -> " + entities);
		Util.log("Score -> " + intentScore);

		//save conversation data
		let conversationData = {
			input: input,
			intent: intent,
			entities: entities,
			score: intentScore,
			context: intent.split(' ')[0].toUpperCase()//the type is the first word in the intent
		};

		//check if this is a button of quick replay
		if (isQuickReply) {
			conversationData.payload = JSON.parse(payload.message.quick_reply.payload);
			conversationData.intent = input;
			conversationData.entities = {};
		}

		//add input and intention to DB(do it async)
		self.DBManager.addInput({
			userId: user._id,
			input: input || "Voice Recognition Error Probably",
			intent: intent,
			score: intentScore
		});

		//if the user have no email or full name - go the complete the "welcome conversation"
		if (!user || input.toLowerCase() === "reset") {
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
		//block user from proceed without integration with Acuity
		else if (!user.integrations || !user.integrations.Acuity) {
			reply(facebookResponse.getButtonMessage("To start working together, I'll have to work with the tools you work with to run your business. Press on the link to help me integrate with Acuity Scheduling and Gmail.", [
				facebookResponse.getGenericButton("web_url", "My Integrations", null, ZoiConfig.clientUrl + "/integrations?userId=" + user._id, "full")
			]));
			return;
		}


		//save the last message time
		user.lastMessageTime = new Date().valueOf();

		//check the intent
		switch (conversationData.context) {
			case "WELCOME":
				let welcomeLogic = new WelcomeLogic(user);
				welcomeLogic.processIntent(conversationData, setBotTyping, payload, reply);
				break;
			case "APPOINTMENT":
				let appointmentLogic = new AppointmentLogic(user);
				appointmentLogic.processIntent(conversationData, setBotTyping, payload, reply);
				break;
			case "CLIENT":
				let clientLogic = new ClientLogic(user);
				clientLogic.processIntent(conversationData, setBotTyping, payload, reply);
				break;
			case "GENERAL":
				let generalLogic = new GeneralLogic(user);
				generalLogic.processIntent(conversationData, setBotTyping, payload, reply);
				break;
			case "GENERIC":
				let genericLogic = new GenericLogic(user);
				genericLogic.processIntent(conversationData, setBotTyping, payload, reply);
				break;
			default:
				reply(facebookResponse.getTextMessage(fallbackText));
				break;
		}

	} catch (err) {

		Util.log(err);

		try {

			let user = await self.DBManager.getUser({_id: payload.sender.id});

			user.conversationData = null;
			await self.DBManager.saveUser(user).then(function () {
				Util.log("user session deleted after error. userId -> " + user._id);

				(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage(fallbackText), false))();
			});

		} catch (err2) {
			Util.log(err2);
			(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage(fallbackText), false))();
		}
	}
};

module.exports = ListenLogic;