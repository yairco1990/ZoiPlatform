/**
 * In this class we process the user intent after we realized
 * that the intent was about the welcome conversation
 */
const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const ZoiConfig = require('../../config');

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
WelcomeLogic.prototype.sendWelcomeDialog = function (conversationData, senderId, callback) {

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
			callback(facebookResponse.getTextMessage("Hi there my new boss! 😁"), true);

			setTimeout(function () {
				callback(facebookResponse.getTextMessage("My Name is Zoi, Your own AI personal assistant."), true);

				setTimeout(function () {
					callback(facebookResponse.getQRElement("May I ask you some questions before we start our journey?", [
						facebookResponse.getQRButton("text", "Yes, lets start!", {id: 1}),
						facebookResponse.getQRButton("text", "Not now", {id: 2}),
					]));
				}, delayTime);

			}, delayTime);
		}).catch(function (err) {
			Util.log(err);
			callback(facebookResponse.getTextMessage("I am on a break right now, please send me message later..Thank's! :)(This is an error..yeah?)"));
		});
	} else {

		if (!user.conversationData.lastQuestion) {
			//ask about the full name
			callback(facebookResponse.getTextMessage("WEEEPI! Let's start! 😍"), true);

			let currentQuestion = welcomeQuestions.nameQuestion;
			user.conversationData = conversationData;
			user.conversationData.lastQuestion = currentQuestion;

			//save the name question to the user
			self.DBManager.saveUser(user).then(function () {

				setTimeout(function () {
					callback(facebookResponse.getTextMessage(currentQuestion.text));
				}, delayTime);

			}).catch(function (err) {
				Util.log(err);
			});

		} else if (user.conversationData.lastQuestion.id == welcomeQuestions.nameQuestion.id) {

			//save the data to the user object
			user[user.conversationData.lastQuestion.field] = conversationData.input;

			callback(facebookResponse.getTextMessage("Hi " + conversationData.input + " :)"), true);

			setTimeout(function () {

				//ask for the user email
				let currentQuestion = welcomeQuestions.emailQuestion;
				user.conversationData.lastQuestion = currentQuestion;

				//save user with the email message
				self.DBManager.saveUser(user).then(function () {
					callback(facebookResponse.getTextMessage(currentQuestion.text));
				}).catch(function (err) {
					callback(facebookResponse.getTextMessage("Zoi got an error - ask Yair what to do."));
					Util.log(err);
				});

			}, delayTime);

		} else if (user.conversationData.lastQuestion.id == welcomeQuestions.emailQuestion.id) {

			//check email is valid
			if (!MyUtils.validateEmail(conversationData.input)) {

				//message about email is not valid
				callback(facebookResponse.getTextMessage("Lol..This is not an email..:D"));
				setTimeout(function () {
					callback(facebookResponse.getTextMessage("Try again"));
				}, delayTime);
			} else {

				//save the data to the user object
				user[user.conversationData.lastQuestion.field] = conversationData.input;

				callback(facebookResponse.getTextMessage("OK! That's all I need for now."), true);

				setTimeout(function () {

					//clear conversation data for this user
					user.conversationData = null;
					self.DBManager.saveUser(user).then(function () {

						//send integration page
						callback(facebookResponse.getButtonMessage("The best way to use my abilities is to let me integrate with other tools you use:", [
							facebookResponse.getGenericButton("web_url", "Zoi Integrations", null, ZoiConfig.clientUrl + "/integrations?userId=" + user._id, "full")
						]));
					});

				}, delayTime);
			}
		}
	}
};

/**
 * proceed with welcome conversation - usually, after the user integrated with Acuity
 * @param conversationData
 * @param senderId
 * @param callback
 */
WelcomeLogic.prototype.proceedWelcomeConversation = function (conversationData, senderId, callback) {

	let self = this;
	let user = self.user;

	setTimeout(function () {

		callback(facebookResponse.getTextMessage("Awesome! You made your first integration! 👏"));

		setTimeout(function () {
			callback(facebookResponse.getTextMessage("So far, you are the best human I ever worked with! ( https://sc.mogicons.com/c/192.jpg)"));

			setTimeout(function () {
				//show abilities
				callback(facebookResponse.getButtonMessage("You are probably wondering what I can do for you. Well, take a look:", [
					facebookResponse.getGenericButton("web_url", "Zoi Abilities", null, ZoiConfig.clientUrl + "/abilities", "full")
				]));

				setTimeout(function () {
					//show abilities
					callback(facebookResponse.getTextMessage("I'll ping you tomorrow with the morning brief. You can always press the menu button to see  my preset actions and settings."));
					setTimeout(function () {

						//show abilities
						callback(facebookResponse.getTextMessage("Can't wait to start getting more action to your business!  https://sc.mogicons.com/c/180.jpg"));

					}, delayTime);
				}, delayTime);
			}, delayTime);
		}, delayTime);
	}, delayTime);
};

module.exports = WelcomeLogic;