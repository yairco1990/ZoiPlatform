/**
 * Created by Yair on 6/20/2017.
 */

const MyLog = require('../../interfaces/MyLog');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment-timezone');
const facebookResponse = require('../../interfaces/FacebookResponse');
const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const EmailLib = require('../../interfaces/EmailLib');
const async = require('async');
const ZoiConfig = require('../../config');
const deepcopy = require('deepcopy');
const ConversationLogic = require('../ConversationLogic');

//fall back message
const fallbackText = "I don't know what that means 😕, Please try to say it again in a different way. You can also try to use my preset actions in the menu.";

class GenericLogic extends ConversationLogic {

	constructor(user, conversationData) {
		super(user, conversationData);
	}

	/**
	 * process the user input
	 */
	async processIntent() {

		const self = this;
		const {reply, user, conversationData} = self;

		//get response from small talk object
		let responseText = MyUtils.getResponseByIntent(conversationData.intent);

		switch (conversationData.intent) {
			case "generic stats":
				reply(facebookResponse.getButtonMessage(responseText, [
					facebookResponse.getGenericButton("web_url", "My Profile", null, ZoiConfig.clientUrl + "/profile?userId=" + self.user._id, null)
				]));
				break;
			case "generic show abilities":
				reply(facebookResponse.getButtonMessage(responseText, [
					facebookResponse.getGenericButton("web_url", "Zoi Abilities", null, ZoiConfig.clientUrl + "/abilities", null)
				]));
				break;
			case "generic unread emails":
				reply(facebookResponse.getButtonMessage("View your unread emails from your customers:", [
					facebookResponse.getGenericButton("web_url", "Unread Emails", null, ZoiConfig.clientUrl + "/mail?userId=" + self.user._id, null)
				]));
				break;
			case "generic say goodbye":
				//if the user is onboarded - say goodbye and clear convo data
				if (user.isOnBoarded) {
					await self.clearConversation();
					reply(facebookResponse.getTextMessage(responseText));
				}
				//if the user is not onboarded - finish the onboarding process
				else {
					await self.finishOnBoarding();
				}
				break;
			default:
				//if we didn't find response for this intent - send fallback.
				if (!responseText) {
					responseText = fallbackText;
				}
				reply(facebookResponse.getTextMessage(responseText));
				break;
		}
	};
}

module.exports = GenericLogic;