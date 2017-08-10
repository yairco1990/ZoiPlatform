const ZoiConfig = require('../config');
const DBManager = require('../dal/DBManager');
const moment = require('moment');
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

		//decide if to start this noon or tomorrow noon
		let noonTime = moment().hour(12).minute(0).second(0);
		//if the noon is before now - get tomorrow noon
		if (noonTime.isBefore(moment())) {
			noonTime = moment().add(1, 'days').hour(12).minute(0).second(0);
		}
		let gapToNoon = moment.duration(noonTime.diff(moment())).valueOf();

		setTimeout(() => {
			BackgroundLogic.startOldCustomersInterval(bot);
		}, gapToNoon);
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
		}, ZoiConfig.morningBriefIntervalTime);
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
								$lt: new Date().valueOf() - 1000 * 60 * 60 * 24 * 3
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

				MyLog.info("Conversation cleared: " + usersWithOldConversation.length);
			} catch (err) {
				MyLog.error(err);
				MyLog.error("Error on startCleaningOldConvosInterval");
			}
		}, ZoiConfig.morningBriefIntervalTime);
	}

	/**
	 * start old customers interval
	 * @param bot
	 */
	static startOldCustomersInterval(bot) {

		let intervalFunction = async () => {
			//get all users for old customers scenario
			let oldCustomersUsers = await DBManager.getUsers({
				conversationData: {
					$eq: null
				}
			});

			BackgroundLogic.sendOldCustomersConvo(bot, oldCustomersUsers);
		};

		try {
			//execute the function once, and then let the interval handle it.
			intervalFunction();
			setInterval(intervalFunction, ZoiConfig.oldCustomersIntervalTime);
		} catch (err) {
			MyLog.error(err);
			MyLog.error("Error on startOldCustomersInterval");
		}
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
				//save the last message time
				user.lastMessageTime = new Date().valueOf();
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

		MyLog.info("Old customers notifications sent: " + counter);
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
				//set next time of morning brief for this user
				user.nextMorningBriefDate = new Date().valueOf() + ZoiConfig.oneDay;
				//save the last message time
				user.lastMessageTime = new Date().valueOf();
				//save the user
				await DBManager.saveUser(user);

				//start the conversation in the GeneralLogic class
				let generalLogic = new GeneralLogic(user);
				let conversationData = {
					intent: "general morning brief",
					context: "GENERAL",
					automated: true
				};

				let replyFunction = BackgroundLogic.getBotReplyFunction(bot, user);
				let botWritingFunction = BackgroundLogic.getBotWritingFunction(bot, user);

				//start convo
				generalLogic.processIntent(conversationData, botWritingFunction, null, replyFunction);
			}
		});

		MyLog.info("Morning briefs sent: " + counter);
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
						MyLog.debug(`Message returned ${user._id}] -> ${rep.text}`);
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