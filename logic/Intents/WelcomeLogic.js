/**
 * In this class we process the user intent after we realized
 * that the intent was about the welcome conversation
 */
const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');

const delayTime = 3000;
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
	}
};

function WelcomeLogic() {
	//get the single instance of DBManager
	this.DBManager = require('../../dal/DBManager');
}

/**
 * process the user intent
 */
WelcomeLogic.prototype.processIntent = function (conversationData, user, setBotTyping, requestObj, callback) {

	let self = this;

	let senderId = requestObj.sender.id;

	//if the user not created yet or wants to be reset
	if (!user || conversationData.input == "reset") {
		self.sendWelcomeDialog(senderId, callback);
	}
	//in case that there is user
	else {
		//check the intent
		switch (conversationData.input.toLowerCase()) {
			//the user want to fill the welcome form
			case "Yes, lets start!".toLowerCase():
				//ask about the full name
				callback(facebookResponse.getTextMessage("Great! Let's start!"), true);

				setTimeout(function () {

					let currentQuestion = welcomeQuestions.nameQuestion;
					user.conversationData = conversationData;
					user.conversationData.lastQuestion = currentQuestion;

					//save the name question to the user
					self.DBManager.saveUser(user).then(function () {
						callback(facebookResponse.getTextMessage(currentQuestion.text));
					}).catch(function (err) {
						//TODO what to do with errors?
						callback(facebookResponse.getTextMessage("Zoi got an error - ask Yair what to do."));
						Util.log(err);
					});

				}, delayTime);
				break;
			//the user don't want to fill the form now
			case "Not now".toLowerCase():

				//delete the user for starting welcome conversation in the next time
				self.DBManager.deleteUser({_id: senderId}).then(function () {
					callback(facebookResponse.getTextMessage("OK! See you later! :)"));
				}).catch(function (err) {
					Util.log(err);
					callback(facebookResponse.getTextMessage("error"));
				});
				break;
			//in cases the user entered form data
			default:

				//just if there is a last question, proceed with the conversation
				if (user.conversationData.lastQuestion && user.conversationData.lastQuestion.field) {

					//if the field is email - check validity
					if (user.conversationData.lastQuestion.field == "email" && !MyUtils.validateEmail(conversationData.input)) {
						//message about email is not valid
						callback(facebookResponse.getTextMessage("Lol..This is not an email..:D"));
						setTimeout(function () {
							callback(facebookResponse.getTextMessage("Try again"));
						}, delayTime);
						return;
					}

					//save the data to the user object
					user[user.conversationData.lastQuestion.field] = conversationData.input;

					//save user to DB
					self.DBManager.saveUser(user).then(function () {
						//if the last question was about the name
						if (user.conversationData.lastQuestion.id == welcomeQuestions.nameQuestion.id) {

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

						}
						//if the last question was about the email
						else if (user.conversationData.lastQuestion.id == welcomeQuestions.emailQuestion.id) {

							callback(facebookResponse.getTextMessage("OK! That's all I need for now."), true);

							setTimeout(function () {

								//clear conversation data for this user
								user.conversationData = null;
								self.DBManager.saveUser(user).then(function () {
									//show abilities
									callback(facebookResponse.getButtonMessage("This is a list of my abilities, please take a look.", [
										facebookResponse.getGenericButton("web_url", "Zoi Abilities", null, "http://dice.beezee.be/abilities.html", "tall")
									]));

									setTimeout(function () {

										//send integration page
										callback(facebookResponse.getButtonMessage("This is your integration page.", [
											facebookResponse.getGenericButton("web_url", "Zoi Integrations", null, "http://zoiai.com/#/main?facebookId=" + user._id, "tall")
										]));

									}, delayTime);
								});

							}, delayTime);
						}
					}).catch(function (err) {
						callback(facebookResponse.getTextMessage("Zoi got an error - ask Yair what to do."));
						Util.log(err);
					});
				}
				//if there is no last question - just reset the user and start the conversation again
				else {

					self.DBManager.deleteUser({_id: senderId}).then(function () {
						self.processIntent(conversationData, user, setBotTyping, requestObj, callback);
					}).catch(function (err) {
						Util.log(err);
						callback(facebookResponse.getTextMessage("error"));
					});

				}
		}
	}
};

/**
 * welcome dialog - first dialog
 * @param senderId
 * @param callback
 */
WelcomeLogic.prototype.sendWelcomeDialog = function (senderId, callback) {

	let self = this;

	self.DBManager.deleteUser({_id: senderId}).then(function () {
		//save the user
		return self.DBManager.saveUser({
			_id: senderId
		});

	}).then(function () {
		callback(facebookResponse.getTextMessage("Hi there!"), true);

		setTimeout(function () {
			callback(facebookResponse.getTextMessage("I'm Zoi, your new personal assistant."), true);

			setTimeout(function () {
				callback(facebookResponse.getQRElement("Can I ask you some questions before we starting our great journey together?", [
					facebookResponse.getQRButton("text", "Yes, lets start!", JSON.stringify({
						type: "WELCOME_CONVERSATION"
					})),
					facebookResponse.getQRButton("text", "Not now", JSON.stringify({
						type: "WELCOME_CONVERSATION"
					})),
				]));

			}, delayTime);

		}, delayTime);
	}).catch(function (err) {
		Util.log(err);
		callback(facebookResponse.getTextMessage("I am on a break right now, please send me message later..Thank's! :)(This is an error..yeah?)"));
	});
};

module.exports = WelcomeLogic;