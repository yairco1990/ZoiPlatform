/**
 * Created by Yair on 6/20/2017.
 */

const MyLog = require('../../interfaces/MyLog');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment-timezone');
const facebookResponse = require('../../interfaces/FacebookResponse');
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

		const {user, conversationData} = this;

		//get response from small talk object
		let responseText = MyUtils.getResponseByIntent(conversationData.intent);

		switch (conversationData.intent) {
			case "generic stats":
				await this.sendMessagesV2([
					[facebookResponse.getButtonMessage(responseText, [
						facebookResponse.getGenericButton("web_url", "My Profile", null, ZoiConfig.clientUrl + "/profile?userId=" + this.user._id, null)
					])]
				]);
				break;
			case "generic show abilities":
				await this.sendMessagesV2([facebookResponse.getButtonMessage(responseText, [
					facebookResponse.getGenericButton("web_url", "Zoi Abilities", null, ZoiConfig.clientUrl + "/abilities", null)
				])]);
				break;
			case "generic unread emails":
				await this.sendMessagesV2([
					[facebookResponse.getButtonMessage("View your unread emails from your customers:", [
						facebookResponse.getGenericButton("web_url", "Unread Emails", null, ZoiConfig.clientUrl + "/mail?userId=" + this.user._id, null)
					])]
				]);
				break;
			case "generic say goodbye":
				//if the user is onboarded - say goodbye and clear convo data
				if (user.isOnBoarded) {
					await this.clearConversation(false);
					await this.sendSingleMessage(responseText);
				}
				//if the user is not onboarded - finish the onboarding process
				else {
					await this.finishOnBoarding();
				}
				break;
			default:
				//if we didn't find response for this intent - send fallback.
				if (!responseText) {
					responseText = fallbackText;
				}
				await this.sendSingleMessage(responseText);
				break;
		}
	};
}

module.exports = GenericLogic;