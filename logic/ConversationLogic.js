const MyUtils = require('../interfaces/utils');
const MyLog = require('../interfaces/MyLog');
const FacebookResponse = require('../interfaces/FacebookResponse');
const moment = require('moment-timezone');
const ZoiConfig = require('../config');
const AcuityLogic = require('./ApiHandlers/AcuitySchedulingLogic');
const async = require('async');
const zoiBot = require('../bot/ZoiBot');
const CryptoJS = require('crypto-js');

const delayTime = ZoiConfig.delayTime;

class ConversationLogic {

	/**
	 * constructor
	 * @param user - represent the user object
	 * @param conversationData - represent the current conversation data by the last input
	 */
	constructor(user, conversationData) {
		this.user = user;
		this.conversationData = conversationData;
		this.reply = zoiBot.getBotReplyFunction(user);
		this.botTyping = zoiBot.getBotWritingFunction(user);
		this.DBManager = require('../dal/DBManager');
		if (user.integrations && user.integrations.Acuity) {
			this.acuityLogic = new AcuityLogic(user.integrations.Acuity.accessToken);
		}
	}

	/**
	 * set user
	 * @param user
	 */
	setUser(user) {
		this.user = user;
		this.reply = zoiBot.getBotReplyFunction(user);
		this.botTyping = zoiBot.getBotWritingFunction(user);
	}

	/**
	 * set conversation data
	 * @param conversationData
	 */
	setConversationData(conversationData) {
		this.conversationData = conversationData;
	}

	/**
	 * save next answer state -(payload, qr, webview or text)
	 * @param nextAnswerType
	 */
	setNextAnswerState(nextAnswerType) {
		//save conversation to the user
		this.user.conversationData = this.conversationData;
		//set next answer
		this.user.conversationData.nextAnswerState = nextAnswerType;
	}

	/**
	 * set user onboarded
	 * @returns {Promise.<void>}
	 */
	async setUserOnBoarded() {
		this.user.isOnBoarded = true;
		this.DBManager.saveUser(this.user);
		MyLog.log("User finished onboarding step. userId = " + this.user._id);
	}

	/**
	 * save last qr response
	 * @param qr
	 * @returns {*}
	 */
	setLastQRResponse(qr) {
		this.user.conversationData.lastQRResponse = qr;
		return qr;
	}

	/**
	 * save the user
	 * @returns {Promise.<void>}
	 */
	async saveUser() {
		await this.DBManager.saveUser(this.user);
	}


	/**
	 * send messages in order
	 * @param messages
	 */
	sendMessages(messages) {
		return new Promise((resolve, reject) => {
			async.series(messages, function (err) {
				if (err) {
					MyLog.error("Failed to send messages", err);
					reject(false);
				}
				resolve(true);
			});
		});
	}

	/**
	 * send single message
	 * @param text
	 * @returns {Promise.<void>}
	 */
	async sendSingleMessage(text) {
		await this.sendMessagesV2([[FacebookResponse.getTextMessage(text)]]);
	}

	/**
	 * send messages - new version
	 * @param messages
	 * @returns {Promise.<void>}
	 */
	async sendMessagesV2(messages) {

		//save the user before sending the messages
		await this.saveUser();

		//transfer to new messages format
		const newMessages = messages.map((message, index) => {

			//if this is the only message
			let shouldTyping = index !== messages.length - 1;
			let shouldDelayed = index !== 0;

			if (message[1]) {
				shouldDelayed = message[1];
			}

			return MyUtils.resolveMessage(this.reply, message[0], shouldTyping, shouldDelayed);
		});

		this.sendMessages(newMessages);
	}

	/**
	 * get facebook user id by page user id
	 * @param userId
	 * @returns {Promise}
	 */
	static getFacebookUserIdByPageUserId(userId) {
		return new Promise(async (resolve, reject) => {
			try {
				const result = await MyUtils.makeRequest("GET", MyUtils.addParamsToUrl(`https://graph.facebook.com/v2.8/${userId}/ids_for_apps`, {
					access_token: ZoiConfig.BOT_DETAILS.token,
					app: ZoiConfig.appId,
					appsecret_proof: CryptoJS.HmacSHA256(ZoiConfig.BOT_DETAILS.token, ZoiConfig.BOT_DETAILS.app_secret).toString(CryptoJS.enc.Hex)
				}));
				resolve(result);
			} catch (err) {
				reject(err);
			}
		});
	}

	/**
	 * check if the user is enable to make conversations related to facebook
	 * @returns {*}
	 */
	isValidFacebookRequest(nextState = null) {

		const {user} = this;

		//if there is an integration with facebook
		if (user.integrations.Facebook) {

			//if there are pages integrated
			if (MyUtils.nestedValue(user, "integrations.Facebook.pages.length")) {

				//if there are page selected to post on
				if (user.integrations.Facebook.pages.filter(page => page.isEnabled).length > 0) {
					return true;
				}
				//if there are no pages chosen from the settings
				else {
					this.clearConversation(false);
					this.askForSelectPageFromSettings();
					return false;
				}
			}
			//if there are no pages integrated
			else {
				this.clearConversation(false);
				this.askForPageIntegration();
				return false;
			}
		}
		//if there is no integration with facebook
		else {
			this.clearConversation(false);
			this.askForFacebookIntegration();
			return false;
		}
	}

	/**
	 * ask to integrate with Facebook
	 */
	async askForFacebookIntegration() {

		try {
			const {user} = this;

			await this.sendMessagesV2([
				[FacebookResponse.getButtonMessage("To post on Facebook page, you must integrate with Facebook platform. Let's do it! 💪", [
					FacebookResponse.getGenericButton("web_url", "My Integrations", null, `${ZoiConfig.clientUrl}/integrations?userId=${user._id}&skipExtension=true`, null, false)
				]), false]
			]);

			return MyUtils.SUCCESS;
		} catch (err) {
			await this.clearConversation();
			MyLog.error(err);
			return MyUtils.ERROR;
		}
	}

	/**
	 * ask to choose facebook pages from settings
	 */
	async askForSelectPageFromSettings() {

		try {
			const {user} = this;

			await this.sendMessagesV2([
				[FacebookResponse.getButtonMessage("Which Facebook page do you want me to WOW? 😊", [
					FacebookResponse.getGenericButton("web_url", "My Pages", null, ZoiConfig.clientUrl + "/facebook-pages?userId=" + user._id, "tall")
				]), false]
			]);

			return MyUtils.SUCCESS;
		} catch (err) {
			await this.clearConversation();
			MyLog.error("Failed on askForSelectPageFromSettings", err);
			return MyUtils.ERROR;
		}
	}

	/**
	 * ask to integrate facebook pages from facebook
	 */
	async askForPageIntegration() {

		try {

			await this.sendMessagesV2([
				[FacebookResponse.getTextMessage("To post on Facebook page, you must give me permissions for your pages. Don't worry, I promise that won't post anything without your permission! 😎"), true, delayTime],
				[FacebookResponse.getTextMessage("You can do it on your Facebook settings. Choose 'Settings', then 'Apps', look for Zoi application and approve it to manage your pages."), false]
			]);

			return MyUtils.SUCCESS;
		} catch (err) {
			await this.clearConversation();
			MyLog.error("Failed to ask for page integrations", err);
			return MyUtils.ERROR;
		}
	}

	/**
	 * clear user conversation
	 */
	async clearConversation(saveUser = true) {

		const self = this;
		const user = self.user;

		user.conversationData = null;
		user.session = null;
		user.nextState = null;

		if (saveUser) {
			await self.DBManager.saveUser(user);
		}
	};

	/**
	 * send stats message
	 * @returns {*}
	 */
	getStatsMessage() {

		const self = this;
		let user = self.user;

		let currentMonth = moment().tz(user.integrations.Acuity.userDetails.timezone).format("YYYY/MM");

		//get stats of current month
		let stats = user.profile[currentMonth];

		let relevantMessages = [];

		//if there are stats this month
		if (stats) {

			//if there are profits
			if (stats.numOfAppointments > 1) {
				relevantMessages.push("We are on the right track! 🏆 I booked " + stats.numOfAppointments + " meetings for you this month. Working with you is great 😍");
				relevantMessages.push("Yeah! Together we booked " + stats.numOfAppointments + " appointments this month! Big 👍,  boss!");
				relevantMessages.push("Guess what... We already booked " + stats.numOfAppointments + " this month! We are a great team 👊");
			}

			if (stats.profitFromAppointments) {
				let profit = stats.profitFromAppointments + " " + user.integrations.Acuity.userDetails.currency;
				relevantMessages.push("Dollar, Dollar Bills... 💵 We earned " + profit + " this month, amazing work boss");
				relevantMessages.push("Now that's progress, we earned " + profit + " from the beginning of the month!");
				relevantMessages.push("Boss, we made " + profit + " this month, I think it's just great! 🤗");
			}

			if (stats.numOfPromotions) {
				relevantMessages.push("Cool, I sent " + stats.numOfPromotions + " promotions for you this month! We will see results in no time 😀");
				relevantMessages.push("We built and sent " + stats.numOfPromotions + " promotions this month👌, I'm going to work on some more, talk to you soon...");
				relevantMessages.push("By now, we sent " + stats.numOfPromotions + " promotions, I knew we are going to hit it off 😘");
			}

		} else {//no stats
			relevantMessages.push("Hey, you know that I'm here if you need me 👋👋👋");
			relevantMessages.push("Boss, I'm here just for you, ping me if you need something!");
		}

		return MyUtils.getRandomValueFromArray(relevantMessages);
	}

	/**
	 * finish on boarding step
	 */
	async finishOnBoarding(userFinishedFirstStep) {
		const {user} = this;

		const conversationData = {
			userFinishedFirstStep,
			context: "WELCOME",
			intent: "welcome acuity integrated",
			lastQuestion: {id: 4},
			payload: {id: 1}
		};
		user.conversationData = conversationData;
		const WelcomeLogic = require('./Intents/WelcomeLogic');
		const welcomeLogic = new WelcomeLogic(user, conversationData);
		await welcomeLogic.processIntent();

		return MyUtils.SUCCESS;
	}

	/**
	 * get nextState if exist
	 * @returns {*}
	 */
	getNextState() {
		const {conversationData, user} = this;
		//check for nextState in the payload
		if (MyUtils.isJson(conversationData.input)) {
			const buttonPayload = JSON.parse(conversationData.input);
			if (buttonPayload.nextState) {
				return buttonPayload.nextState;
			}
		}
		if (MyUtils.nestedValue(conversationData, "payload.nextState")) {
			return MyUtils.nestedValue(conversationData, "payload.nextState");
		}
		if (conversationData.nextState) {
			return conversationData.nextState;
		}
		if (user.nextState) {
			return user.nextState;
		}
	}

	/**
	 * set user current state
	 * @param state
	 */
	setCurrentState(state) {
		if (this.user.conversationData) {
			this.user.conversationData.currentState = state;
		}
	}

	/**
	 * increase the promotions times when user makes a promotion
	 * @param user
	 */
	static setPromotionsTimesToUser(user) {
		const actionTime = moment().tz(user.integrations.Acuity.userDetails.timezone).format("YYYY/MM");
		if (user.profile[actionTime]) {
			user.profile[actionTime].numOfPromotions = (user.profile[actionTime].numOfPromotions || 0) + 1;
		} else {
			user.profile[actionTime] = {
				numOfPromotions: 1
			}
		}
	}

	/**
	 * save promotion object, and associate it to the user
	 * @param service
	 * @param template
	 * @param date
	 * @returns {Promise.<void>}
	 */
	async savePromotionToUser(service, template, date) {

	}

	/**
	 * say goodbye and clear convo
	 */
	async stopConvo() {
		await this.clearConversation(false);
		await this.sendSingleMessage("Ok boss! See you later :)");
		return "cleared";
	}
}

module.exports = ConversationLogic;