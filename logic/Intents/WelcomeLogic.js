/**
 * In this class we process the user intent after we realized
 * that the intent was about the welcome conversation
 */
const MyLog = require('../../interfaces/MyLog');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment-timezone');
const facebookResponse = require('../../interfaces/FacebookResponse');
const ZoiConfig = require('../../config');
const ConversationLogic = require('../ConversationLogic');
const Acuity = require('acuityscheduling');
const AppointmentLogic = require('./AppointmentLogic');

const delayTime = ZoiConfig.delayTime;

//QUESTIONS
const welcomeQuestions = {
	canWeProceed: {
		id: 3
	},
	firstPromotion: {
		id: 4 //DONT CHANGE IT!
	},
	noProblem: {
		id: 5
	},
	integrateWithAcuity: {
		id: "integrateWithAcuity"
	}
};

class WelcomeLogic extends ConversationLogic {

	constructor(user, conversationData) {
		super(user, conversationData);
	}

	/**
	 * process the user intent
	 */
	async processIntent(requestObj) {

		const self = this;
		const {user, conversationData} = self;

		const senderId = requestObj ? requestObj.sender.id : user._id;

		switch (conversationData.intent) {
			case "welcome acuity integrated":
				this.botTyping();
				return await self.proceedWelcomeConvo();
				break;
			default:
				this.botTyping();
				return await self.welcomeConvo(senderId);
				break;
		}
	};


	/**
	 * welcome dialog - first dialog
	 */
	async welcomeConvo(senderId) {

		const self = this;
		const {user, reply, conversationData} = self;

		try {

			//if the user not created yet or wants to be reset
			if (!user || conversationData.input.toLowerCase() === "resetzoi") {
				return await self.initNewUser(senderId);
			} else {
				return await self.askUserForIntegration();
			}

		} catch (err) {
			MyLog.error(err);
			(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I am on a break right now, please send me message later..Thank's! :)"), false))();
		}
	};

	/**
	 * proceed with welcome conversation - usually, after the user integrated with Acuity
	 */
	async proceedWelcomeConvo() {

		const {user, conversationData} = this;

		const lastQuestionId = this.getLastQuestionId();

		try {
			if (!user.conversationData) {
				return await this.askForProceedAfterIntegration();
			} else if (lastQuestionId === welcomeQuestions.canWeProceed.id) {
				return await this.askForFirstPromotion();
			} else if (lastQuestionId === welcomeQuestions.firstPromotion.id) {
				return await this.onUserAnsweredOnFirstPromotion();
			} else {//user said no problem or wrote something
				return await this.askForShareZoi();
			}
		} catch (err) {
			MyLog.error(err);
		}
	};


	/**
	 * init user when this is his first conversation
	 * @param senderId
	 */
	async initNewUser(senderId) {

		const self = this;
		const {conversationData} = self;

		const zoiBot = require('../../bot/ZoiBot');
		//get user profile
		const profile = await zoiBot.getProfile(senderId);
		const displayName = profile.first_name + ' ' + profile.last_name;

		//delete the user if exist
		await self.DBManager.deleteUser({_id: senderId});

		//create default user with default parameters
		const newUser = require('../../interfaces/DefaultModels/DefaultUser');
		newUser._id = senderId;
		newUser.fullname = displayName;
		newUser.conversationData = conversationData;

		//set user and conversation data to super class
		self.setUser(newUser);
		self.setConversationData(conversationData);

		//KEEP IT HERE!
		const {reply} = self;

		//save the user
		await self.DBManager.saveUser(newUser);

		await self.sendMessages([
			MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Hi there my new boss! 😁"), true),
			MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("My name is Zoi, your own AI marketer for your business."), true, delayTime),
			MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("From now on, I'll be your marketer. I will send promotions to fill your openings and boost your activity in social media."), true, delayTime),
			MyUtils.resolveMessage(reply, facebookResponse.getQRElement("Set me up will only take a minute, are you ready?", [
				facebookResponse.getQRButton("text", "Yes, lets go!", {id: "yesLetsGo"}),
				facebookResponse.getQRButton("text", "Not now", {id: "notNow"}),
			]), false, delayTime)
		]);

		return "initNewUserSuccess";
	}

	/**
	 * on user chose between "let's go" and "Not now" options
	 * ask him for integration with Acuity
	 */
	async askUserForIntegration() {

		const self = this;
		const {user, reply, conversationData} = self;

		//on "lets go" option
		if (!conversationData.payload || conversationData.payload.id === "yesLetsGo") {

			//clear conversation data for this user
			await self.clearConversation();

			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("First, to learn how I'm about to boost the marketing of your business, watch a quick video:"), true),
				MyUtils.resolveMessage(reply, facebookResponse.getVideoMessage(ZoiConfig.ON_BOARDING_VIDEO_URL), false, delayTime),
				MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("Awesome :) Now I need you to integrate me with the other tools you use in order to run your business:", [
					facebookResponse.getGenericButton("web_url", "My Integration", null, `${ZoiConfig.clientUrl}/integrations?userId=${user._id}&skipExtension=true`, null, false)
				]), false, delayTime * 2)
			]);

			return "gotIntegrationButton";
		}
		//on "Not now" option
		else {

			//remove the user and next time start the conversation again
			await this.DBManager.deleteUser({_id: user._id});

			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("OK! see you later... :)"), false)
			]);

			return "refuseToIntegrate";
		}
	}

	/**
	 * ask for proceed after integration with Acuity
	 */
	async askForProceedAfterIntegration() {
		const self = this;
		const {user, reply, conversationData} = self;

		self.setCurrentQuestion(welcomeQuestions.canWeProceed, "qr");

		//save the user
		await self.DBManager.saveUser(user);

		//wait a little bit before continue with the conversation
		await self.sendMessages([
			MyUtils.resolveMessage(reply, facebookResponse.getQRElement("Awesome! Now I have access to your calendar 👏 Can we proceed to fill your openings?", [
				facebookResponse.getQRButton('text', "Yes we can!", {id: 1})
			]), false, ZoiConfig.times.firstIntegratedDelay)
		]);

		return "userMadeAcuityIntegration";
	}

	/**
	 * ask for promotion
	 */
	async askForFirstPromotion() {

		const self = this;
		const {user, reply, conversationData} = self;

		self.setCurrentQuestion(welcomeQuestions.firstPromotion, "qr");

		//save the response
		const lastQRResponse = self.setLastQRResponse(facebookResponse.getQRElement("Now that I'm able to access your Acuity account we can send our first promotion.",
			[
				facebookResponse.getQRButton('text', 'Let\'s make money', {id: 2}),
				facebookResponse.getQRButton('text', 'Maybe tomorrow', {id: 1})
			]
		));

		//save the user
		await self.DBManager.saveUser(user);

		await self.sendMessages([
			MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("So far, you are the best human I've ever worked with! 😉"), true, delayTime),
			MyUtils.resolveMessage(reply, lastQRResponse, false, delayTime),
		]);

		return "userAskedForFirstPromotion";
	}

	/**
	 * ask the user if he wants to make first promotion
	 */
	async onUserAnsweredOnFirstPromotion() {
		const self = this;
		const {user, reply, conversationData} = self;

		//if chose tomorrow
		if (!conversationData.payload || conversationData.payload.id === 1) {

			self.setCurrentQuestion(welcomeQuestions.noProblem);

			//save the response
			const lastQRResponse = self.setLastQRResponse(facebookResponse.getQRElement("We are going to bring a lot of customers to our business together! 💪",
				[
					facebookResponse.getQRButton('text', "Thank's, Zoi.", {id: 0}),
				]
			));

			await self.DBManager.saveUser(user);

			const messages = [];

			if (conversationData.userFinishedFirstPromotion) {
				messages.push(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Good job boss 👍"), true, delayTime * 2));
			} else {
				messages.push(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("No problem, boss!"), true));
			}

			messages.push(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I'll ping you tomorrow with your morning brief"), true, delayTime));
			messages.push(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Remember, You can always press the menu button below (☰) to see my preset actions and settings."), true, delayTime));
			messages.push(MyUtils.resolveMessage(reply, lastQRResponse, false, delayTime));

			//set user onboarded
			await self.setUserOnBoarded();

			await self.sendMessages(messages);

			return "userRefuseToFirstPromotion";
		}
		//if chose promotion
		else {
			//clean the user conversation
			user.conversationData = null;

			//start send promotions dialog
			const appointmentLogic = new AppointmentLogic(user, {
				intent: "appointment send promotions",
				context: "APPOINTMENT",
				firstPromotion: true
			});
			await appointmentLogic.processIntent();

			return "userAcceptFirstPromotion";
		}
	}

	/**
	 * ask the user if he likes to share the new hiring of Zoi
	 */
	async askForShareZoi() {
		const self = this;
		const {user, reply, conversationData} = self;

		//clear the conversation
		await self.clearConversation();

		//create the share url
		const shareUrl = `https://www.facebook.com/dialog/feed?app_id=${ZoiConfig.appId}&link=https%3A%2F%2Fzoi.ai&picture=https%3A%2F%2Fzoi.ai%2Fwp-content%2Fuploads%2F2015%2F12%2Fzoi-logo-white.png&name=I%20just%20hired%20Zoi%20AI&caption=%20&description=Share%20it%20too!&redirect_uri=http%3A%2F%2Fwww.facebook.com%2F`;

		await self.sendMessages([
			MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("No problem!"), true),
			MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I will really appreciate if you will share my new hiring on facebook :)"), true, delayTime),
			MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("Share me:", [
				facebookResponse.getGenericButton("web_url", "Share Zoi", null, shareUrl, "tall", false)
			]), false, delayTime)
		]);

		return "userAskedForShareZoi";
	}
}

module.exports = WelcomeLogic;