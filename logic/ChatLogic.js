const MyLog = require('../interfaces/MyLog');
const MyUtils = require('../interfaces/utils');
const DBManager = require('../dal/DBManager');
const GeneralLogic = require('./Intents/GeneralLogic');
const AppointmentLogic = require('./Intents/AppointmentLogic');

class ChatLogic {

	/**
	 * post content on facebook page
	 * @param userId
	 * @param link
	 * @param title
	 */
	static async postFacebookContent({userId, link, title, toPost}) {

		const user = await DBManager.getUserById(userId);
		const conversationData = {
			context: "GENERAL",
			intent: "general suggest to post article",
			payload: {
				link,
				title,
				toPost
			}
		};
		const generalLogic = new GeneralLogic(user, conversationData);
		await generalLogic.processIntent();

		return MyUtils.SUCCESS;
	}

	/**
	 * post promotion on facebook page
	 * @param userId
	 * @param link
	 * @param imageUrl
	 * @param toPost
	 * @param title
	 */
	static async postFacebookPromotion({userId, title, imageUrl, link, toPost}) {

		const user = await DBManager.getUserById(userId);
		const conversationData = {
			context: "APPOINTMENT",
			intent: "appointment send promotions",
			payload: {
				title,
				imageUrl,
				link,
				answer: toPost === "true" ? "yes" : "no"
			}
		};
		const appointmentLogic = new AppointmentLogic(user, conversationData);
		await appointmentLogic.processIntent();

		return MyUtils.SUCCESS;
	}

}

module.exports = ChatLogic;