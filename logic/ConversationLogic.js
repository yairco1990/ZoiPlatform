const MyUtils = require('../interfaces/utils');
const MyLog = require('../interfaces/MyLog');
const FacebookResponse = require('../interfaces/FacebookResponse');
const moment = require('moment-timezone');
const ZoiConfig = require('../config');
const AcuityLogic = require('./ApiHandlers/AcuitySchedulingLogic');
const async = require('async');
const zoiBot = require('../bot/ZoiBot');
const CryptoJS = require('crypto-js');

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
	 * check if the response is qr - if not, send message to the user.
	 * @returns {Promise.<boolean>}
	 */
	async isValidQR() {
		if (this.conversationData.payload) {
			return true;
		} else {
			await this.sendLetsFinishWhatWeStarted();
			return false;
		}
	}

	/**
	 * set current question to the user object
	 * @param question
	 * @param nextAnswerType
	 * @returns {*}
	 */
	setCurrentQuestion(question, nextAnswerType) {
		//save conversation to the user
		this.user.conversationData = this.conversationData;
		//save the service question
		this.user.conversationData.lastQuestion = question;
		if (nextAnswerType) {
			//save next answer state
			this.user.conversationData.nextAnswerState = nextAnswerType;
		}
		//return the selected question
		return question;
	}

	/**
	 * say goodbye message to the user
	 * finish onboarding in case the user still didn't finish it
	 */
	async sayGoodbye() {
		if (this.user.isOnBoarded) {
			this.sendMessages([
				MyUtils.resolveMessage(this.reply, FacebookResponse.getTextMessage("I'll be right here if you need me ☺"), false)
			]);
		} else {
			await this.finishOnBoarding();
		}
	}

	/**
	 * say goodbye message to the user
	 */
	async sendLetsFinishWhatWeStarted() {
		return await this.sendMessages([
			MyUtils.resolveMessage(this.reply, FacebookResponse.getTextMessage("Let's finish what we started"), true),
			MyUtils.resolveMessage(this.reply, user.conversationData.lastQRResponse, false, ZoiConfig.delayTime),
		]);
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

	sendMessagesV2(messages) {
		const newMessages = messages.map(message => {
			return MyUtils.resolveMessage(this.reply, message[0], message[1], message[2]);
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
	 * clear user conversation
	 * @param reply
	 * @param sendLastMessage
	 */
	async clearConversation(reply, sendLastMessage) {
		const self = this;
		const user = self.user;

		user.conversationData = null;
		user.session = null;

		await self.DBManager.saveUser(user);

		if (sendLastMessage) {
			(MyUtils.resolveMessage(reply, FacebookResponse.getTextMessage("I'll be right here if you need me ☺"), false, ZoiConfig.delayTime))();
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
	 * get last question id
	 * @returns {*}
	 */
	getLastQuestionId() {
		const {user} = this;
		return user.conversationData && user.conversationData.lastQuestion ? user.conversationData.lastQuestion.id : null;
	}

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
}

module.exports = ConversationLogic;