const ZoiConfig = require('../config');
const DBManager = require('../dal/DBManager');
const moment = require('moment-timezone');
const MyLog = require('../interfaces/MyLog');
const GeneralLogic = require('./Intents/GeneralLogic');
const ClientLogic = require('./Intents/ClientLogic');

class BackgroundLogic {

	/**
	 * start all background intervals
	 * @param bot
	 */
	static startAll(bot) {
		BackgroundLogic.startMorningBriefInterval(bot);
		BackgroundLogic.startCleaningOldConvosInterval(bot);
		BackgroundLogic.startOldCustomersInterval(bot);
	}

	/**
	 * start morning brief interval
	 * @param bot
	 */
	static startMorningBriefInterval(bot) {

		setInterval(async () => {
			try {
				//get users that should get morning brief
				let morningBriefUsers = await DBManager.getUsers({
					$and: [{
						$or: [{
							nextMorningBriefDate: {//the date is less than now
								$lt: new Date().valueOf()
							}
						}, {
							nextMorningBriefDate: {//there is no date
								$eq: null
							}
						}]
					}, {
						conversationData: {
							$eq: null
						}
					}]
				});

				BackgroundLogic.sendMorningBriefs(bot, morningBriefUsers);

			} catch (err) {
				MyLog.error(err);
				MyLog.error("Error on startMorningBriefInterval");
			}
		}, ZoiConfig.times.morningBriefIntervalTime);
	}

	/**
	 * send morning brief to list of users
	 * @param bot
	 * @param morningBriefUsers
	 */
	static sendMorningBriefs(bot, morningBriefUsers) {

		let counter = 0;
		//iterate the users
		morningBriefUsers.forEach(async (user) => {

			//morning brief only for Acuity users for now
			if (user.integrations && user.integrations.Acuity) {
				counter++;

				//get hours, minutes and seconds from the notification date
				let currentMorningBriefDate = moment(user.nextMorningBriefDate).tz(user.timezone);
				let hours = currentMorningBriefDate.get('hour');
				let minutes = currentMorningBriefDate.get('minute');
				let nextMorningBriefDate = moment().tz(user.timezone);
				nextMorningBriefDate.set('hour', hours);
				nextMorningBriefDate.set('minute', minutes);
				nextMorningBriefDate.set('second', 0);
				nextMorningBriefDate = nextMorningBriefDate.add(1, 'days');

				//set next time of morning brief for this user
				user.nextMorningBriefDate = nextMorningBriefDate.valueOf();
				//save the last message time
				user.lastMessageTime = new Date().valueOf();
				//save the user
				await DBManager.saveUser(user);

				//start the conversation in the GeneralLogic class
				let generalLogic = new GeneralLogic(user);
				let conversationData = {
					intent: "general morning brief",
					context: "GENERAL",
					isAutomated: true
				};

				let replyFunction = BackgroundLogic.getBotReplyFunction(bot, user);
				let botWritingFunction = BackgroundLogic.getBotWritingFunction(bot, user);

				//start convo
				generalLogic.processIntent(conversationData, botWritingFunction, null, replyFunction);
			}
		});

		MyLog.debug("Morning briefs sent: " + counter);
	}

	/**
	 * clean old convos
	 */
	static startCleaningOldConvosInterval() {

		setInterval(async () => {
			try {
				//get user with opened conversation more than hour
				let usersWithOldConversation = await DBManager.getUsers({
					$and: [{
						conversationData: {
							$ne: null
						}
					}, {
						$or: [{
							lastMessageTime: {
								$lt: new Date().valueOf() - ZoiConfig.times.clearOldConversationRange
							}
						}, {
							lastMessageTime: {
								$eq: null
							}
						}]
					}]
				});

				//clear them
				BackgroundLogic.clearOldConversations(usersWithOldConversation);

				MyLog.debug("Conversation cleared: " + usersWithOldConversation.length);
			} catch (err) {
				MyLog.error(err);
				MyLog.error("Error on startCleaningOldConvosInterval");
			}
		}, ZoiConfig.times.morningBriefIntervalTime);
	}

	/**
	 * clear customers with old conversation
	 * @param usersWithOldConvos
	 */
	static clearOldConversations(usersWithOldConvos) {
		//iterate the users
		usersWithOldConvos.forEach(async (user) => {
			BackgroundLogic.clearUserConversation(user);
		});
	}

	/**
	 * start old customers interval
	 * @param bot
	 */
	static startOldCustomersInterval(bot) {

		setInterval(async () => {
			try {
				//get all users for old customers scenario
				let oldCustomersUsers = await DBManager.getUsers({
					$and: [{
						$or: [{
							nextOldCustomersDate: {//the date is less than now
								$lt: new Date().valueOf()
							}
						}, {
							nextOldCustomersDate: {//there is no date
								$eq: null
							}
						}]
					}, {
						conversationData: {
							$eq: null
						}
					}]
				});

				BackgroundLogic.sendOldCustomersConvo(bot, oldCustomersUsers);

			} catch (err) {
				MyLog.error(err);
				MyLog.error("Error on startOldCustomersInterval");
			}
		}, ZoiConfig.times.oldCustomersIntervalTime);
	}

	/**
	 * send old customers convo
	 * @param bot
	 * @param oldCustomersUsers
	 */
	static sendOldCustomersConvo(bot, oldCustomersUsers) {

		let counter = 0;
		//iterate the users
		oldCustomersUsers.forEach(async (user) => {

			if (user.integrations && user.integrations.Acuity) {
				counter++;
				//get hours, minutes and seconds from the notification date
				let currentOldCustomerDate = moment(user.nextOldCustomersDate).tz(user.timezone);
				let hours = currentOldCustomerDate.get('hour');
				let minutes = currentOldCustomerDate.get('minute');
				let nextOldCustomerDate = moment().tz(user.timezone);
				nextOldCustomerDate.set('hour', hours);
				nextOldCustomerDate.set('minute', minutes);
				nextOldCustomerDate.set('second', 0);
				nextOldCustomerDate = nextOldCustomerDate.add(1, 'days');

				//set next time of morning brief for this user
				user.nextOldCustomersDate = nextOldCustomerDate.valueOf();
				//save the last message time
				user.lastMessageTime = new Date().valueOf();
				//save the user
				await DBManager.saveUser(user);

				//start the conversation in the GeneralLogic class
				let clientLogic = new ClientLogic(user);
				let conversationData = {
					intent: "client old customers",
					context: "CLIENT",
					automated: true
				};

				let replyFunction = BackgroundLogic.getBotReplyFunction(bot, user);
				let botWritingFunction = BackgroundLogic.getBotWritingFunction(bot, user);

				//start convo
				clientLogic.processIntent(conversationData, botWritingFunction, null, replyFunction);

			}
		});

		MyLog.debug("Old customers notifications sent: " + counter);
	}

	/**
	 * clear user conversation data
	 * @param user
	 */
	static clearUserConversation(user) {
		//clear conversation data
		user.conversationData = null;
		user.session = null;
		DBManager.saveUser(user);
	}

	/**
	 * get bot reply function
	 * @param bot - the singleton bot object
	 * @param user - the user that is going to get Zoi message
	 * @returns {Function}
	 */
	static getBotReplyFunction(bot, user) {
		//@param rep - the facebook json message
		//@param isBotTyping - boolean, decide if the bot typing after the message
		//@param delay - delay in ms to send the message
		return function (rep, isBotTyping, delay) {
			return new Promise(function (resolve, reject) {
				delay = delay || 0;
				setTimeout(() => {
					//send reply
					bot.sendMessage(user._id, rep, (err) => {
						if (err) {
							reject(err);
							return;
						}
						if (isBotTyping) {
							bot.sendSenderAction(user._id, "typing_on", () => {
								resolve();
							});
						} else {
							resolve();
						}
						MyLog.info(`Message returned ${user._id}] -> ${rep.text}`);
					});
				}, delay);
			});
		};
	}

	/**
	 * get bot writing function
	 * @param bot
	 * @param user
	 * @returns {Function}
	 */
	static getBotWritingFunction(bot, user) {
		return function () {
			return new Promise(function (resolve, reject) {
				bot.sendSenderAction(user._id, "typing_on", () => {
					resolve();
				});
			});
		};
	}
}

module.exports = BackgroundLogic;