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
				return await self.welcomeConvoManager(senderId);
				break;
			case "welcome acuity integrated":
				this.botTyping();
				return await self.proceedWelcomeConvoManager();
				break;
			default:
				this.botTyping();
				return await self.welcomeConvoManager(senderId);
				break;
		}
	};


	/**
	 * welcome dialog - first dialog
	 */
	async welcomeConvoManager(senderId) {

		const self = this;
		const {user, reply, conversationData} = self;

		try {

			const nextState = this.getNextState();

			//if the user not created yet or wants to be reset
			if (!user || conversationData.input.toLowerCase() === "resetzoi") {
				return await self.initNewUser(senderId);
			} else if (nextState === "askForShareContent") {
				return await self.askForShareContent();
			} else if (nextState === "shareContent") {
				return await self.startShareContentConversation();
			}

		} catch (err) {
			MyLog.error(err);
			(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I am on a break right now, please send me message later..Thank's! :)"), false))();
		}
	};


	/**
	 * init user when this is his first conversation
	 * @param senderId
	 */
	async initNewUser(senderId) {

		const {conversationData} = this;

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
				try {
					newUser = await this.DBManager.getUserByFacebookId(userFacebookId, false);
					newUser.pageUserId = senderId;
					newUser.lastMessageTime = new Date().valueOf();
				}
				catch (err) {
					//create default user with default parameters
					newUser = deepCopy(DefaultUserModel);
					newUser._id = MyUtils.generateUUID();
					newUser.pageUserId = senderId;
				}
			}

			//set user details
			newUser.fullname = displayName;
			newUser.conversationData = conversationData;
			newUser.isOnBoarded = false;

			//set user and conversation data to super class
			this.setUser(newUser);
			this.setConversationData(conversationData);

			//set current question
			this.setNextAnswerState("qr");

			await this.sendMessagesV2([
				[facebookResponse.getTextMessage("Hi there my new boss! 😁")],
				[facebookResponse.getTextMessage("My name is Zoi, your own AI marketer for your business.")],
				[facebookResponse.getTextMessage("From now on, I'll be your marketer. I will send promotions to fill your openings and boost your activity in social media.")],
				[facebookResponse.getQRElement("Set me up will only take a minute, are you ready?", [
					facebookResponse.getQRButton("text", "Yes, lets go!", {nextState: "askForShareContent"})
				])],
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
	async askForShareContent() {

		const self = this;

		this.setNextAnswerState("qr");

		const qrQuestion = self.setLastQRResponse(facebookResponse.getQRElement("Awesome! Now, let's share some cool content on your facebook page!", [
			facebookResponse.getQRButton('text', "Share content!", {nextState: "shareContent"}),
			facebookResponse.getQRButton('text', "Not now", {nextState: "stopConvo"})
		]));

		//send video and integration
		await self.sendMessagesV2([
			[facebookResponse.getTextMessage("First, to learn how I'm about to boost the marketing of your business, watch a quick video:")],
			[facebookResponse.getGenericTemplate([
				facebookResponse.getGenericElement("Zoi's Video", "https://res.cloudinary.com/gotime-systems/image/upload/v1506522804/videoImage_v0hdzv.png", "", [
					facebookResponse.getGenericButton("web_url", "Play", null, `${ZoiConfig.clientUrl}/welcome-video`, null)
				])
			])],
			[qrQuestion, delayTime * 2]
		]);

		return "gotIntegrationButton";
	}

	/**
	 * proceed with welcome conversation - usually, after the user integrated with Acuity
	 */
	async proceedWelcomeConvoManager() {

		const {user} = this;

		try {
			const nextState = this.getNextState();

			if (!user.conversationData) {
				return await this.askForProceedAfterIntegration();
			} else if (nextState === "askForFirstPromotion") {
				return await this.askForFirstPromotion();
			} else if (nextState === "startFirstPromotion") {
				return await this.startFirstPromotion();
			} else if (nextState === "skipFirstPromotion") {
				return await this.skipFirstPromotion();
			} else if (nextState === "returnNoProblem") {//user said no problem or wrote something
				return await this.askForShareZoi();
			}
		} catch (err) {
			MyLog.error(err);
		}
	};


	/**
	 * start share content conversation
	 */
	async startShareContentConversation() {

		const self = this;
		const {user} = self;

		const generalLogic = new GeneralLogic(user, {
			context: "GENERAL",
			intent: "general suggest to post article",
			nextState: "suggestToPostArticle"
		});
		await generalLogic.processIntent();

		return "shareContentConvoStarted";
	}

	/**
	 * ask for proceed after integration with Acuity
	 */
	async askForProceedAfterIntegration() {

		this.setNextAnswerState("qr");

		const qrQuestion = this.user.setLastQRResponse(facebookResponse.getQRElement("Awesome! Now I have access to your calendar 👏 Can we proceed to fill your openings?", [
			facebookResponse.getQRButton('text', "Yes we can!", {nextState: "askForFirstPromotion"})
		]));

		//wait a little bit before continue with the conversation
		await this.sendMessagesV2([
			[qrQuestion, ZoiConfig.times.firstIntegratedDelay]
		]);

		return "userMadeAcuityIntegration";
	}

	/**
	 * ask for promotion
	 */
	async askForFirstPromotion() {

		this.setNextAnswerState("qr");

		//save the response
		const lastQRResponse = this.setLastQRResponse(facebookResponse.getQRElement("Now that I'm able to access your Acuity account we can send our first promotion.", [
			facebookResponse.getQRButton('text', "Let's make money", {nextState: "startFirstPromotion"}),
			facebookResponse.getQRButton('text', 'Maybe tomorrow', {nextState: "skipFirstPromotion"})
		]));

		await this.sendMessagesV2([
			[facebookResponse.getTextMessage("So far, you are the best human I've ever worked with! 😉")],
			[lastQRResponse],
		]);

		return "userAskedForFirstPromotion";
	}

	/**
	 * ask the user if he wants to make first promotion
	 */
	async skipFirstPromotion() {

		this.setNextAnswerState("qr");

		//save the response
		const lastQRResponse = this.setLastQRResponse(facebookResponse.getQRElement("We are going to bring a lot of customers to our business together! 💪", [
			facebookResponse.getQRButton('text', "Thank's, Zoi.", {nextState: "returnNoProblem"}),
		]));

		const messages = [];

		//check if the user quit the first step or finished it
		if (conversationData.userFinishedFirstStep) {
			messages.push(facebookResponse.getTextMessage("Good job boss 👍"), delayTime * 2);
		} else {
			messages.push(facebookResponse.getTextMessage("Ok boss!"));
		}
		messages.push(facebookResponse.getTextMessage("Remember, You can always press the menu button below (☰) to see my preset actions and settings."));
		messages.push(lastQRResponse);

		//set user onboarded
		await this.setUserOnBoarded();

		await this.sendMessagesV2(messages);

		return "userRefuseToFirstPromotion";
	}

	/**
	 * start first promotion
	 * @returns {Promise.<string>}
	 */
	async startFirstPromotion() {

		//clean the user conversation
		this.user.conversationData = null;

		//start send promotions dialog
		const appointmentLogic = new AppointmentLogic(user, {
			intent: "appointment send promotions",
			context: "APPOINTMENT",
			firstPromotion: true
		});
		await appointmentLogic.processIntent();

		return "userAcceptFirstPromotion";
	}

	/**
	 * share the new hiring of Zoi
	 */
	async askForShareZoi() {

		//clear the conversation
		await this.clearConversation();

		await this.sendMessagesV2("No problem boss :)");

		return "userAskedForShareZoi";
	}
}

module.exports = WelcomeLogic;