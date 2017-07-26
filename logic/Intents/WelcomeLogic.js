/**
 * In this class we process the user intent after we realized
 * that the intent was about the welcome conversation
 */
const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const ZoiConfig = require('../../config');
const async = require('async');

const delayTime = ZoiConfig.delayTime || 3000;

function WelcomeLogic(user) {
	this.user = user;
	//get the single instance of DBManager
	this.DBManager = require('../../dal/DBManager');
}

/**
 * process the user intent
 */
WelcomeLogic.prototype.processIntent = function (conversationData, setBotTyping, requestObj, callback) {

	let self = this;
	let user = self.user;

	let senderId = requestObj ? requestObj.sender.id : user._id;

	switch (conversationData.intent) {
		case "welcome acuity integrated":
			self.proceedWelcomeConversation(conversationData, senderId, callback);
			break;
		default:
			self.sendWelcomeDialog(conversationData, senderId, callback);
			break;
	}
};

const welcomeQuestions = {
	nameQuestion: {
		id: 1,
		text: "What is your full name?",
		field: "fullname"
	},
	emailQuestion: {
		id: 2,
		text: "What is your Email address?",
		field: "email"
	},
	sawIntegrations: {
		id: 3,
		text: "Shell we proceed?"
	},
	sawAbilities: {
		id: 4,
		text: "Shell we proceed?"
	}
};

/**
 * welcome dialog - first dialog
 */
WelcomeLogic.prototype.sendWelcomeDialog = function (conversationData, senderId, reply) {

	let self = this;
	let user = self.user;

	//if the user not created yet or wants to be reset
	if (!user || conversationData.input.toLowerCase() == "reset") {

		self.DBManager.deleteUser({_id: senderId}).then(function () {

			//save the user
			return self.DBManager.saveUser({
				_id: senderId,
				conversationData: conversationData,
				startedAt: moment().format('lll'),
				profile: {},
				integrations: {},
				metadata: {}
			});

		}).then(function () {

			async.series([
				MyUtils.onResolve(reply, facebookResponse.getTextMessage("Hi there my new boss! 😁"), true),
				MyUtils.onResolve(reply, facebookResponse.getTextMessage("My Name is Zoi, Your own AI personal assistant."), true, delayTime),
				MyUtils.onResolve(reply, facebookResponse.getQRElement("May I ask you some questions before we start our journey?", [
					facebookResponse.getQRButton("text", "Yes, lets start!", {id: 1}),
					facebookResponse.getQRButton("text", "Not now", {id: 2}),
				]), false, delayTime)
			], MyUtils.getErrorMsg());

		}).catch(function (err) {
			Util.log(err);
			(MyUtils.onResolve(reply, facebookResponse.getTextMessage("I am on a break right now, please send me message later..Thank's! :)"), false))();
		});
	} else {

		if (!user.conversationData.lastQuestion) {

			let currentQuestion = welcomeQuestions.nameQuestion;
			user.conversationData = conversationData;
			user.conversationData.lastQuestion = currentQuestion;

			//save the name question to the user
			self.DBManager.saveUser(user).then(function () {

				async.series([
					MyUtils.onResolve(reply, facebookResponse.getTextMessage("WEEEPI! Let's start! 😍"), true),
					MyUtils.onResolve(reply, facebookResponse.getTextMessage(currentQuestion.text), false, delayTime)
				], MyUtils.getErrorMsg());

			}).catch(function (err) {
				Util.log(err);
			});

		} else if (user.conversationData.lastQuestion.id == welcomeQuestions.nameQuestion.id) {

			//save the data to the user object
			user[user.conversationData.lastQuestion.field] = conversationData.input;

			//ask for the user email
			let currentQuestion = welcomeQuestions.emailQuestion;
			user.conversationData.lastQuestion = currentQuestion;

			//save user with the email message
			self.DBManager.saveUser(user).then(function () {
				async.series([

					MyUtils.onResolve(reply, facebookResponse.getTextMessage("Hi " + conversationData.input + " :)"), true),
					MyUtils.onResolve(reply, facebookResponse.getTextMessage(currentQuestion.text), false, delayTime)

				], MyUtils.getErrorMsg());
			}).catch(function (err) {
				Util.log(err);
			});


		} else if (user.conversationData.lastQuestion.id == welcomeQuestions.emailQuestion.id) {

			//check email is valid
			if (!MyUtils.validateEmail(conversationData.input)) {
				async.series([

					MyUtils.onResolve(reply, facebookResponse.getTextMessage("Lol..This is not an email..:D"), true),
					MyUtils.onResolve(reply, facebookResponse.getTextMessage("Try again"), false, delayTime),

				], MyUtils.getErrorMsg());
			} else {

				//save the data to the user object
				user[user.conversationData.lastQuestion.field] = conversationData.input;

				//clear conversation data for this user
				user.conversationData = null;
				self.DBManager.saveUser(user).then(function () {

					async.series([

						MyUtils.onResolve(reply, facebookResponse.getTextMessage("OK! That's all I need for now."), true),
						MyUtils.onResolve(reply, facebookResponse.getButtonMessage("The best way to use my abilities is to let me integrate with other tools you use:", [
							facebookResponse.getGenericButton("web_url", "Zoi Integrations", null, ZoiConfig.clientUrl + "/integrations?userId=" + user._id, "full")
						]), false, delayTime),

					], MyUtils.getErrorMsg());
				});
			}
		}
	}
};

/**
 * proceed with welcome conversation - usually, after the user integrated with Acuity
 * @param conversationData
 * @param senderId
 * @param reply
 */
WelcomeLogic.prototype.proceedWelcomeConversation = function (conversationData, senderId, reply) {

	let self = this;
	let user = self.user;

	if (!user.conversationData) {
		//ask if he wants to proceed
		let currentQuestion = welcomeQuestions.sawAbilities;
		//save conversation to the user
		user.conversationData = conversationData;
		//save the service question
		user.conversationData.lastQuestion = currentQuestion;

		//save the response
		let lastQRResponse = facebookResponse.getQRElement(currentQuestion.text,
			[
				facebookResponse.getQRButton('text', 'Ok', {id: 1})
			]
		);
		user.conversationData.lastQRResponse = lastQRResponse;

		self.DBManager.saveUser(user).then(function () {
			async.series([

				MyUtils.onResolve(reply, facebookResponse.getTextMessage("Awesome! You made your first integration! 👏"), true),
				MyUtils.onResolve(reply, facebookResponse.getTextMessage("So far, you are the best human I ever worked with! 😉"), true, delayTime),
				MyUtils.onResolve(reply, facebookResponse.getButtonMessage("You are probably wondering what I can do for you. Well, take a look:", [
					facebookResponse.getGenericButton("web_url", "Zoi Abilities", null, ZoiConfig.clientUrl + "/abilities", "full")
				]), true, delayTime),
				MyUtils.onResolve(reply, lastQRResponse, false, delayTime),

			], MyUtils.getErrorMsg());
		});

	} else if (user.conversationData.lastQuestion.id == welcomeQuestions.sawAbilities.id) {

		if (conversationData.payload && conversationData.payload.id == 1) {
			async.series([
				MyUtils.onResolve(reply, facebookResponse.getTextMessage("I'll ping you tomorrow with the morning brief. You can always press the menu button below (☰) to see my preset actions and settings."), true),
				MyUtils.onResolve(reply, facebookResponse.getTextMessage("Can't wait to start getting more action to your business!  💪"), false, delayTime),

			], MyUtils.getErrorMsg());
		} else {
			reply(user.conversationData.lastQRResponse);
		}
	}
};

module.exports = WelcomeLogic;