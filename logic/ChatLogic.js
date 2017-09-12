const MyLog = require('../interfaces/MyLog');
const MyUtils = require('../interfaces/utils');
const DBManager = require('../dal/DBManager');
const GeneralLogic = require('./Intents/GeneralLogic');

class ChatLogic {

	/**
	 * post content on facebook page
	 * @param userId
	 * @param link
	 * @param title
	 */
	static async postFacebookContent({userId, link, title}) {

		const user = await DBManager.getUserById(userId);
		const conversationData = {
			context: "GENERAL",
			intent: "general suggest to post article",
			payload: {
				link,
				title
			}
		};
		const generalLogic = new GeneralLogic(user, conversationData);
		await generalLogic.processIntent();

		return MyUtils.SUCCESS;
	}

}

module.exports = ChatLogic;