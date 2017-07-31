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
ListenLogic.prototype.processInput = function (input, payload, setBotTyping, bot, reply) {

	let self = this;

	Util.log("User input = " + input);

	//check intent with NLP
	// requestify.request('http://52.174.244.154:8080/zoi/getIntent?text=' + input, {
	requestify.request('http://52.177.185.253:5000/parse?q=' + input, {
		method: 'GET'
	}).then(function (response) {
		response = response.getBody();

		let intent = MyUtils.replaceAll("-", " ", response.intent.name);
		let entities = response.entities;

		Util.log("Intent -> " + intent);
		Util.log("Entities -> " + entities);

		//save conversation data
		let conversationData = {
			input: input,
			intent: intent.name,
			entities: entities,
			context: intent.split(' ')[0].toUpperCase()//the type is the first word in the intent
		};

		//check if this is a button of quick replay
		if (payload.message && payload.message.quick_reply && payload.message.quick_reply.payload) {
			conversationData.payload = JSON.parse(payload.message.quick_reply.payload);
			conversationData.intent = input;
			conversationData.entities = {};
		}

		//get the user
		self.DBManager.getUser({_id: payload.sender.id}).then(function (user) {//
			//if the user have no email or full name - go the complete the "welcome conversation"
			if (!user || input.toLowerCase() == "reset") {
				conversationData.context = "WELCOME";
				//ignore the zoi-brain, and return the intent to the original input
				conversationData.intent = input;
				conversationData.entities = {};
			}
			//if the user in the middle of a conversation - get the context.
			//if the user want to leave the conversation - don't use the context, and delete the conversation data from the user
			else if (user && user.conversationData && conversationData.intent != "general bye zoi" && conversationData.intent != "general no thanks") {
				conversationData.context = user.conversationData.context;
				conversationData.intent = user.conversationData.intent;
			} else if (!user.integrations || !user.integrations.Acuity) {//block user from proceed without integration with Acuity
				reply(facebookResponse.getButtonMessage("To start working together, I'll have to work with the tools you work with to run your business. Press on the link to help me integrate with Acuity Scheduling and Gmail.", [
					facebookResponse.getGenericButton("web_url", "My Integrations", null, ZoiConfig.clientUrl + "/integrations?userId=" + user._id, "full")
				]));
				return;
			}
			reply(facebookResponse.getTextMessage(conversationData.intent));
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
					//get response from small talk object
					let responseText = MyUtils.getResponseByIntent(conversationData.intent);
					//if found response for this intent - send it.
					if (responseText) {
						reply(facebookResponse.getTextMessage(responseText));
					} else {//if it didn't find response - send default response.
						// reply(facebookResponse.getTextMessage(fallbackText));
					}
					break;
				default:
					reply(facebookResponse.getTextMessage(fallbackText));
					break;
			}
		}).catch(function (err) {

			self.DBManager.getUser({_id: payload.sender.id}).then(function (user) {

				user.conversationData = null;
				self.DBManager.saveUser(user).then(function () {
					Util.log("user session deleted after error. userId -> " + user._id);

					(MyUtils.onResolve(reply, facebookResponse.getTextMessage(fallbackText), false))();
				});

			}).catch(function () {
				(MyUtils.onResolve(reply, facebookResponse.getTextMessage(fallbackText), false))();
			});

			Util.log(err);
		});
	}).catch(function (err) {
		Util.log(err);
	});
};

/**
 * process inputs and return mock response
 * @param setBotTyping - function, launch it if you want to send to the user that the bot is typing
 * @param bot - the bot object
 * @param payload - request object, contains sender details, message and other staff
 * @param input - the user input
 * @param callback - what to send to the user
 */
ListenLogic.prototype.processMock = function (input, payload, setBotTyping, bot, callback) {

	let self = this;

	input = input.toLowerCase();

	//get message payload if exist
	let messagePayload = null;
	try {
		messagePayload = JSON.parse(payload.message.quick_reply.payload);
	} catch (err) {
	}

	if (messagePayload && messagePayload.id == 2) {

		callback(facebookResponse.getTextMessage(Mocks.GREAT_SOME_OPTIONS));

		setTimeout(function () {
			callback(facebookResponse.getGenericTemplate([
				facebookResponse.getGenericElement("A day in a spa for 100$", "http://alluredayspavi.com/portals/_default/Skins/Vaspan/images/BoxImgB1.jpg", "Book now for a whole day in our spa for just 100$. Don\'t miss it!", [
					facebookResponse.getGenericButton("postback", "I like it", {id: 3}),
					facebookResponse.getGenericButton("postback", "Edit", {id: 3}),
				]),
				facebookResponse.getGenericElement("20% off massage treatments", "https://preview.ibb.co/fX8mhv/spa1.jpg", "Book a massage now and get 20% off", [
					facebookResponse.getGenericButton("postback", "I like it", {id: 3}),
					facebookResponse.getGenericButton("postback", "Edit", {id: 3}),
				]),
				facebookResponse.getGenericElement("1 + 1 on face treatments", "https://image.ibb.co/fv5XNv/spa3.jpg", "Get 2 treatments for the price of one. Book now to claim your reward", [
					facebookResponse.getGenericButton("postback", "I like it", {id: 3}),
					facebookResponse.getGenericButton("postback", "Edit", {id: 3}),
				])
			]));
		}, delayTime);

	} else {

		//check similarity of input
		if (!(input.includes("book".toLowerCase()) && input.includes("for this slot".toLowerCase()))) {
			input = MyUtils.getSimilarityFromMocks(input, Mocks).toLowerCase();
		}

		if (input == Mocks.HI_ZOI.toLowerCase() || input == Mocks.HEY_ZOI.toLowerCase()) {//he said hi zoi - we send revenue reporter

			setBotTyping();

			setTimeout(function () {
				callback(facebookResponse.getTextMessage(Mocks.I_NOTICED_SOMETHING), true);

				setTimeout(function () {

					callback(facebookResponse.getButtonMessage(Mocks.REVENUE_DOWN, [
						facebookResponse.getGenericButton("web_url", "Watch the graph", null, "http://dice.beezee.be/test.html", "full")
					]), true);

					setTimeout(function () {

						callback(facebookResponse.getTextMessage(Mocks.I_THINK_ITS_BECAUSE_PRIVATE_SESSIONS), true);

						setTimeout(function () {

							callback(facebookResponse.getTextMessage(Mocks.LETS_OFFER_PROMOTIONS), true);

							setTimeout(function () {

								callback(facebookResponse.getQRElement(Mocks.DO_YOU_WANT_TO_SEND_PROMOTION, [
									facebookResponse.getQRButton("text", Mocks.SEND_PROMOTION),
									facebookResponse.getQRButton("text", Mocks.DONT_SEND_PROMOTION)
								]));

							}, delayTime);

						}, delayTime);

					}, delayTime + 1500);

				}, delayTime);

			}, delayTime);


		} else if (input == Mocks.SEND_PROMOTION.toLowerCase()) { //send promotion

			setBotTyping();

			callback(facebookResponse.getTextMessage(Mocks.I_AM_ON_IT), true);

			setTimeout(function () {

				callback(facebookResponse.getTextMessage(Mocks.DONE_I_SENT_EMAILS), true);

				setTimeout(function () {

					callback(facebookResponse.getTextMessage(Mocks.I_SEE_YOUR_CUSTOMERS_RESPOND));

				}, delayTime);

			}, delayTime);


		} else if (input == Mocks.DONT_SEND_PROMOTION.toLowerCase()) { //don't send promotion

			callback(facebookResponse.getTextMessage(Mocks.OK_BOSS));


		} else if (input == Mocks.YES_POST.toLowerCase()) {//post on facebook

			setBotTyping();

			setTimeout(function () {

				callback(facebookResponse.getTextMessage(Mocks.THATS_SMART_MOVE), true);

				setTimeout(function () {

					callback(facebookResponse.getTextMessage(Mocks.THIS_IS_WHAT_I_WILL_POST), true);

					setTimeout(function () {

						callback(facebookResponse.getGenericTemplate(
							[
								facebookResponse.getGenericElement(Mocks.TWENTY_PRECENT_OFF, "http://media.gq.com/photos/575f0063c2433a86159c8d71/16:9/pass/summer-haircut-gq-0716-3.jpg", Mocks.DONT_MISS_IT)
							]
						), true);

						setTimeout(function () {

							callback(facebookResponse.getQRElement(Mocks.DO_I_SHARE_IT, [
								facebookResponse.getQRButton("text", Mocks.SHARE_IT),
								facebookResponse.getQRButton("text", Mocks.DONT_SHARE_IT)
							]));

						}, delayTime);

					}, 2000);

				}, delayTime);

			}, delayTime);

		} else if (input == Mocks.DONT_POST.toLowerCase()) {//don't post on facebook

			callback(facebookResponse.getTextMessage(Mocks.OK_BOSS));


		} else if (input == Mocks.SHARE_IT.toLowerCase()) {//share this template on facebook

			let shareItFlow = function () {
				setBotTyping();

				setTimeout(function () {

					callback(facebookResponse.getTextMessage(Mocks.I_SHARED_IT), true);

					setTimeout(function () {

						callback(facebookResponse.getTextMessage("www.goo.gl/Am2532"));

					}, delayTime);

				}, delayTime);
			};

			SharedLogic.postOnFacebook()
				.then(shareItFlow)
				.catch(shareItFlow);


		} else if (input == Mocks.DONT_SHARE_IT.toLowerCase()) {//don't this template it on facebook

			callback(facebookResponse.getTextMessage(Mocks.OK_BOSS));

		} else if (input == Mocks.HELLO_ZOI.toLowerCase()) {

			callback(facebookResponse.getTextMessage(Mocks.HEY_BOSS_WHAT_CAN_I_DO_FOR_YOU));


		} else if (input == Mocks.WHAT_IS_MY_SCHEDULE_TODAY.toLowerCase()) {//what is my schedule today question

			callback(facebookResponse.getTextMessage(Mocks.LET_ME_SEE), true);

			setTimeout(function () {

				callback(facebookResponse.getTextMessage(Mocks.HERE_IS_YOUR_SCHEDULE), true);
				callback(facebookResponse.getImageMessage(MyUtils.getImageByHtml("http://dice.beezee.be/scheduleList.html")));

				setTimeout(function () {

					callback(facebookResponse.getTextMessage(Mocks.ANYTHING_ELSE));

				}, delayTime * 2.5);

			}, delayTime);


		} else if (input == Mocks.ZOI_QUESTION.toLowerCase()) {//zoi?

			callback(facebookResponse.getTextMessage(Mocks.HEY_CHIEF));


		} else if (input == Mocks.WHEN_IS_MY_NEXT_FREE_SLOT.toLowerCase()) {//when is my next free slot?

			callback(facebookResponse.getTextMessage(Mocks.YOUR_NEXT_FREE_SLOT_AT));


		} else if (input.includes("book".toLowerCase()) && input.includes("for this slot".toLowerCase())) {//when is my next free slot?

			//cut the input and stay with the customer name
			input = input.replace("book", "");
			input = input.replace("for this slot", "");
			let customerName = MyUtils.setCapitalLetterForEveryWord(input.trim());

			setTimeout(function () {

				callback(facebookResponse.getTextMessage(Mocks.OKI_DOKI), true);

				setTimeout(function () {

					callback(facebookResponse.getTextMessage(Mocks.CUSTOMER_BOOKED.replace("{customer}", customerName)), true);

					setTimeout(function () {

						callback(facebookResponse.getTextMessage(Mocks.ANYTHING_ELSE));

					}, delayTime);

				}, delayTime);

			}, delayTime);

		} else if (input == Mocks.NO.toLowerCase()) {//user said NO

			callback(facebookResponse.getTextMessage(Mocks.OK_BOSS));


		} else if (input == Mocks.THANKS.toLowerCase()) {//user said NO

			callback(facebookResponse.getTextMessage("😎 You are welcome, boss!"));


		} else { //on case we didn't understood what the user want

			callback(facebookResponse.getTextMessage(Mocks.CAN_YOU_BE_MORE_EXPLICIT));

		}
	}
};

module.exports = ListenLogic;