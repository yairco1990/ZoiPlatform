const ZoiConfig = require('../config');
const DBManager = require('../dal/DBManager');
const moment = require('moment-timezone');
const MyLog = require('../interfaces/MyLog');
const GeneralLogic = require('./Intents/GeneralLogic');
const ClientLogic = require('./Intents/ClientLogic');
const ConversationLogic = require('./ConversationLogic');
const facebookResponse = require('../interfaces/FacebookResponse');

class BackgroundLogic {

	/**
	 * start all background intervals
	 * @param bot
	 */
	static startAll(bot) {
		BackgroundLogic.startMorningBriefInterval(bot);
		//start clean old convos with some delay
		setTimeout(() => {
			BackgroundLogic.startCleaningOldConvosInterval(bot);
		}, ZoiConfig.times.morningBriefIntervalTime / 3);
		//start the old customers interval after morning interval to prevent double messages at the same time
		setTimeout(() => {
			BackgroundLogic.startOldCustomersInterval(bot);
		}, ZoiConfig.times.morningBriefIntervalTime / 2);
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
				let generalLogic = new GeneralLogic(user, {
					intent: "general morning brief",
					context: "GENERAL",
					isAutomated: true
				});

				//start convo
				await generalLogic.processIntent();
			}
		});

		if (counter) {
			MyLog.debug("Morning briefs sent: " + counter);
		}
	}

	/**
	 * clean old convos
	 */
	static startCleaningOldConvosInterval(bot) {

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
				BackgroundLogic.clearOldConversations(bot, usersWithOldConversation);

				if (usersWithOldConversation.length) {
					MyLog.debug("Conversation cleared: " + usersWithOldConversation.length);
				}
			} catch (err) {
				MyLog.error(err);
				MyLog.error("Error on startCleaningOldConvosInterval");
			}
		}, ZoiConfig.times.oldConversationIntervalTime);
	}

	/**
	 * clear customers with old conversation
	 * @param usersWithOldConvos
	 * @param bot
	 */
	static clearOldConversations(bot, usersWithOldConvos) {
		//iterate the users
		usersWithOldConvos.forEach(async (user) => {
			const conversationLogic = new ConversationLogic(user);
			await conversationLogic.clearConversation(user);

			const replyFunction = bot.getBotReplyFunction(user);

			//send message to clean the last message(if there are some qr or buttons..)
			replyFunction(facebookResponse.getTextMessage("I took a short break. Tell me if you need anything! :)"));
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
				let clientLogic = new ClientLogic(user, {
					intent: "client old customers",
					context: "CLIENT",
					automated: true
				});

				//start convo
				await clientLogic.processIntent();

			}
		});

		if (counter) {
			MyLog.debug("Old customers notifications sent: " + counter);
		}
	}
}

module.exports = BackgroundLogic;