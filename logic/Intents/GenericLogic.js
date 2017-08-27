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

	constructor(user) {
		super(user);
	}

	/**
	 * process the user input
	 */
	processIntent(conversationData, setBotTyping, requestObj, reply) {

		const self = this;

		//get response from small talk object
		let responseText = MyUtils.getResponseByIntent(conversationData.intent);

		switch (conversationData.intent) {
			case "generic stats":
				reply(facebookResponse.getButtonMessage(responseText, [
					facebookResponse.getGenericButton("web_url", "My Profile", null, ZoiConfig.clientUrl + "/profile?userId=" + self.user._id, "full")
				]));
				break;
			case "generic show abilities":
				reply(facebookResponse.getButtonMessage(responseText, [
					facebookResponse.getGenericButton("web_url", "Zoi Abilities", null, ZoiConfig.clientUrl + "/abilities", "full")
				]));
				break;
			case "generic unread emails":
				reply(facebookResponse.getButtonMessage("View your unread emails from your customers:", [
					facebookResponse.getGenericButton("web_url", "Unread Emails", null, ZoiConfig.clientUrl + "/mail?userId=" + self.user._id, "full")
				]));
				break;
			case "generic say goodbye":
				reply(facebookResponse.getTextMessage(responseText));
				self.clearConversation();
				break;
			default:
				//if we didn't find response for this intent - send fallback.
				if (!responseText) {
					responseText = fallbackText;
				}
				//TODO
				// reply(facebookResponse.getTextMessage(responseText));
				// const shareUrl = "https://www.facebook.com/sharer/sharer.php?u=" + "https://zoi.ai" + "&description=" + "My Description!!" + "&picture=" + "www.pic.com/a.png" + "&caption=" + "MyCaption";
				const shareUrl = `https://www.facebook.com/dialog/feed?app_id=${ZoiConfig.appId}&link=https%3A%2F%2Fzoi.ai&picture=https%3A%2F%2Fzoi.ai%2Fwp-content%2Fuploads%2F2015%2F12%2Fzoi-logo-white.png&name=I%20just%20hired%20Zoi%20AI&caption=%20&description=Share%20it%20too!&redirect_uri=http%3A%2F%2Fwww.facebook.com%2F`;
				reply(facebookResponse.getButtonMessage("Share me:", [
					facebookResponse.getGenericButton("web_url", "Share Zoi", null, shareUrl)
				]));
				break;
		}
	};
}

module.exports = GenericLogic;