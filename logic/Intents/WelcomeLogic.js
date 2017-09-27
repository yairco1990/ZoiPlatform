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
const GeneralLogic = require('./GeneralLogic');
const zoiBot = require('../../bot/ZoiBot');
const deepCopy = require('deepcopy');
const DefaultUserModel = require('../../interfaces/DefaultModels/DefaultUser');

const delayTime = ZoiConfig.delayTime;

//QUESTIONS
const welcomeQuestions = {
	initUser: {
		id: "initUser"
	},
	canWeProceed: {
		id: 3
	},
	firstPromotion: {
		id: 4
	},
	noProblem: {
		id: 5
	},
	integrateWithAcuity: {
		id: "integrateWithAcuity"
	},
	shareContent: {
		id: "shareContentQuestion"
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
			case "welcome get started":
				this.botTyping();
				return await self.welcomeConvo(senderId);
				break;
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

		const lastQuestionId = this.getLastQuestionId();

		try {

			//if the user not created yet or wants to be reset
			if (!user || conversationData.input.toLowerCase() === "resetzoi") {
				return await self.initNewUser(senderId);
			} else if (lastQuestionId === welcomeQuestions.initUser.id) {
				return await self.askUserForIntegration();
			} else if (lastQuestionId === welcomeQuestions.shareContent.id) {
				if (await this.isValidQR()) {
					if (MyUtils.nestedValue(conversationData, "payload.id") === "shareContent") {
						return await self.startShareContentConversation();
					} else {
						return await self.sayGoodbye();
					}
				}
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

		try {

			//delete the user if exist
			//await self.DBManager.deleteUser({pageUserId: senderId});

			//get user profile
			const {first_name, last_name} = await zoiBot.getProfile(senderId);
			const displayName = `${first_name} ${last_name}`;

			let newUser;

			//try to get the existing user from the 'login with facebook step'
			const userFacebookData = await ConversationLogic.getFacebookUserIdByPageUserId(senderId);
			const userFacebookId = MyUtils.nestedValue(userFacebookData, "data[0].id");

			//check for integrated user
			if (userFacebookId) {
				newUser = await self.DBManager.getUserByFacebookId(userFacebookId, false);
				newUser.pageUserId = senderId;
			}

			//if the user doesn't exist
			if (!newUser) {
				//create default user with default parameters
				newUser = deepCopy(DefaultUserModel);
				newUser._id = MyUtils.generateUUID();
				newUser.pageUserId = senderId;
			}

			//set user details
			newUser.fullname = displayName;
			newUser.conversationData = conversationData;
			newUser.isOnBoarded = false;

			//set user and conversation data to super class
			self.setUser(newUser);
			self.setConversationData(conversationData);

			//KEEP IT HERE!
			const {reply} = self;

			//set current question
			self.setCurrentQuestion(welcomeQuestions.initUser);

			//save the user
			await self.DBManager.saveUser(newUser);

			await self.sendMessagesV2([
				[facebookResponse.getTextMessage("Hi there my new boss! 😁"), true],
				[facebookResponse.getTextMessage("My name is Zoi, your own AI marketer for your business."), true, delayTime],
				[facebookResponse.getTextMessage("From now on, I'll be your marketer. I will send promotions to fill your openings and boost your activity in social media."), true, delayTime],
				[facebookResponse.getQRElement("Set me up will only take a minute, are you ready?", [
					facebookResponse.getQRButton("text", "Yes, lets go!", {id: "yesLetsGo"})
				]), false, delayTime],
			]);

			return "initNewUserSuccess";
		} catch (err) {
			MyLog.error("Failed to set new user", err);
			return err;
		}
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

			this.setCurrentQuestion(welcomeQuestions.shareContent);

			const qrQuestion = self.setLastQRResponse(facebookResponse.getQRElement("Awesome! Now, let's share some cool content on your facebook page!", [
				facebookResponse.getQRButton('text', "Share content!", {id: "shareContent"}),
				facebookResponse.getQRButton('text', "Not now", {id: "dontShare"})
			]));

			await this.saveUser();

			//send video and integration
			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("First, to learn how I'm about to boost the marketing of your business, watch a quick video:"), true, delayTime),
				MyUtils.resolveMessage(reply, facebookResponse.getGenericTemplate([
					facebookResponse.getGenericElement("Zoi's Video", "https://res.cloudinary.com/gotime-systems/image/upload/v1506522804/videoImage_v0hdzv.png", "", [
						facebookResponse.getGenericButton("web_url", "Play", null, `${ZoiConfig.clientUrl}/welcome-video`, null)
					])
				]), false, delayTime),
				MyUtils.resolveMessage(reply, qrQuestion, false, delayTime * 2)
			]);

			return "gotIntegrationButton";
		}
		//on "Not now" option
		else {

			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("OK! see you later... :)"), false)
			]);

			return "refuseToIntegrate";
		}
	}


	/**
	 * start share content conversation
	 */
	async startShareContentConversation() {

		const self = this;
		const {user} = self;

		//set the position in the 'suggest article' convo
		user.conversationData = {
			lastQuestion: {
				id: "suggestToPostArticle"
			}
		};

		const generalLogic = new GeneralLogic(user, {
			context: "GENERAL",
			intent: "general suggest to post article"
		});
		await generalLogic.processIntent();

		return "shareContentConvoStarted";
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

			//check if the user quit the first step or finished it
			if (conversationData.userFinishedFirstStep) {
				messages.push(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Good job boss 👍"), true, delayTime * 2));
			} else {
				messages.push(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Ok boss!"), true, delayTime));
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
			MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("No problem boss :)"), false),
			// MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I will really appreciate if you will share my new hiring on facebook :)"), true, delayTime),
			// MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("Share me:", [
			// 	facebookResponse.getGenericButton("web_url", "Share Zoi", null, shareUrl, "tall", false)
			// ]), false, delayTime)
		]);

		return "userAskedForShareZoi";
	}
}

module.exports = WelcomeLogic;