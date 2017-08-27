/**
 * In this class we process the user intent after we realized
 * that the intent was about the welcome conversation
 */
const ZoiBot = require('../../bot/ZoiBot');
const MyLog = require('../../interfaces/MyLog');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment-timezone');
const facebookResponse = require('../../interfaces/FacebookResponse');
const ZoiConfig = require('../../config');
const async = require('async');
const ConversationLogic = require('../ConversationLogic');
const Acuity = require('acuityscheduling');
const AppointmentLogic = require('./AppointmentLogic');

const delayTime = ZoiConfig.delayTime;

//QUESTIONS
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
		text: "Shall we proceed?"
	},
	sawAbilities: {
		id: 4,
		text: "Shall we proceed?"
	},
	noProblem: {
		id: 5,
	}
};

class WelcomeLogic extends ConversationLogic {

	constructor(user) {
		super(user);
	}

	/**
	 * process the user intent
	 */
	processIntent(conversationData, setBotTyping, requestObj, reply) {

		const self = this;
		const user = self.user;

		const senderId = requestObj ? requestObj.sender.id : user._id;

		switch (conversationData.intent) {
			case "welcome acuity integrated":
				//wait a little bit before continue with the conversation
				setTimeout(function () {
					self.proceedWelcomeConversation(conversationData, setBotTyping, requestObj, reply);
				}, conversationData.setDelay ? ZoiConfig.times.firstIntegratedDelay : 0);
				break;
			default:
				self.sendWelcomeDialog(conversationData, senderId, reply);
				break;
		}
	};


	/**
	 * welcome dialog - first dialog
	 */
	async sendWelcomeDialog(conversationData, senderId, reply) {

		const self = this;
		const user = self.user;

		//if the user not created yet or wants to be reset
		if (!user || conversationData.input.toLowerCase() === "resetzoi") {

			try {

				//get user profile
				const profile = await ZoiBot.getProfile(senderId);
				const displayName = profile.first_name + ' ' + profile.last_name;

				//delete the user if exist
				await self.DBManager.deleteUser({_id: senderId});

				//create default user with default parameters
				const newUser = require('../../interfaces/DefaultModels/DefaultUser');
				newUser._id = senderId;
				newUser.fullname = displayName;
				newUser.conversationData = conversationData;

				//save the user
				await self.DBManager.saveUser(newUser);

				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Hi there my new boss! 😁"), true),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("My name is Zoi, your own AI personal assistant."), true, delayTime),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("From now on, I'll be your marketer. I'll send promotions and fill your calendar."), true, delayTime),
					MyUtils.resolveMessage(reply, facebookResponse.getQRElement("Setting everything up will only take a minute, are you ready?", [
						facebookResponse.getQRButton("text", "Yes, lets go!", {id: 1}),
						facebookResponse.getQRButton("text", "Not now", {id: 2}),
					]), false, delayTime)
				], MyUtils.getErrorMsg());

			} catch (err) {
				MyLog.error(err);
				(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I am on a break right now, please send me message later..Thank's! :)"), false))();
			}

		} else {

			try {
				//if user said no
				if (conversationData.payload && conversationData.payload.id === 2) {
					(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("OK! see you later... :)"), false))();
					return;
				}

				//TODO why this if is here - check it.
				if (!user.conversationData.lastQuestion) {

					//create the redirect url
					const acuity = Acuity.oauth(ZoiConfig.ACUITY_OAUTH);
					const redirectUrl = acuity.getAuthorizeUrl({scope: 'api-v1', state: user._id});

					//clear conversation data for this user
					await self.clearConversation();

					async.series([
						MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("Awesome! Let's connect to your Acuity account so I'll be able to know your agenda and clients.", [
							facebookResponse.getGenericButton("web_url", "Acuity Integration", null, redirectUrl, "full")
						]), false, delayTime)
					], MyUtils.getErrorMsg());

				}
			} catch (err) {
				MyLog.error(err);
			}
		}
	};

	/**
	 * proceed with welcome conversation - usually, after the user integrated with Acuity
	 * @param conversationData
	 * @param setBotTyping
	 * @param requestObj
	 * @param reply
	 */
	async proceedWelcomeConversation(conversationData, setBotTyping, requestObj, reply) {

		const self = this;
		const user = self.user;

		try {
			if (!user.conversationData) {
				//ask if he wants to proceed
				const currentQuestion = welcomeQuestions.sawAbilities;
				//save conversation to the user
				user.conversationData = conversationData;
				//save the service question
				user.conversationData.lastQuestion = currentQuestion;
				//set next answer start
				user.conversationData.nextAnswerState = "qr";

				//save the response
				const lastQRResponse = facebookResponse.getQRElement("Now that I'm able to access your Acuity account we can send our first promotion.",
					[
						facebookResponse.getQRButton('text', 'Maybe tomorrow', {id: 1}),
						facebookResponse.getQRButton('text', 'Let\'s make money', {id: 2})
					]
				);

				user.conversationData.lastQRResponse = lastQRResponse;
				await self.DBManager.saveUser(user);

				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Awesome! You made your first integration! 👏"), true),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("So far, you are the best human I ever worked with! 😉"), true, delayTime),
					MyUtils.resolveMessage(reply, lastQRResponse, false, delayTime),
				], MyUtils.getErrorMsg());

			} else if (user.conversationData.lastQuestion.id === welcomeQuestions.sawAbilities.id) {

				//if chooses tomorrow
				if (!conversationData.payload || conversationData.payload.id === 1) {

					//ask if he wants to proceed
					const currentQuestion = welcomeQuestions.noProblem;
					//save conversation to the user
					user.conversationData = conversationData;
					//save the service question
					user.conversationData.lastQuestion = currentQuestion;

					//save the response
					const lastQRResponse = facebookResponse.getQRElement("Can't wait to start getting more action to your business!  💪",
						[
							facebookResponse.getQRButton('text', "Thank's, Zoi.", {id: 0}),
						]
					);

					user.conversationData.lastQRResponse = lastQRResponse;
					await self.DBManager.saveUser(user);

					async.series([

						MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("No problem, boss!"), true),
						MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I'll ping you tomorrow with your morning brief."), true, delayTime),
						MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Remember, You can always press the menu button below (☰) to see my preset actions and settings."), true, delayTime),
						MyUtils.resolveMessage(reply, lastQRResponse, false, delayTime),

					], MyUtils.getErrorMsg());

					MyLog.log("User finished onboarding step. userId = " + user._id);
				}
				else {

					//clean the user conversation
					user.conversationData = null;

					const appointmentLogic = new AppointmentLogic(user, conversationData);
					//start send promotions dialog
					appointmentLogic.processIntent({
						intent: "appointment send promotions",
						context: "APPOINTMENT",
						firstPromotion: true
					}, setBotTyping, requestObj, reply);
				}
			}
			//user said no problem or wrote something
			else {

				//clear the conversation
				await self.clearConversation();

				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("No problem!"), true),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I will really appreciate if you will share my new hiring on facebook :)"), true, delayTime),
					MyUtils.resolveMessage(reply, facebookResponse.getShareButton("Share Zoi", "Zoi Description", "http://qsf.ec.quoracdn.net/-3-images.logo.wordmark_default.svg-26-32753849bf197b54.svg"), false, delayTime)
				], MyUtils.getErrorMsg());
			}
		} catch (err) {
			MyLog.error(err);
		}
	};
}

module.exports = WelcomeLogic;