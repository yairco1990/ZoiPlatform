const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const requestify = require('requestify');
const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const Mocks = require('../../interfaces/Mocks');
const request = require('request');
const SharedLogic = require('../SharedLogic');
const WelcomeLogic = require('../Intents/WelcomeLogic');
const AppointmentLogic = require('../Intents/AppointmentLogic');
const ZoiConfig = require('../../config');

/**
 * PostbackLogic constructor
 * @constructor
 */
function PostbackLogic() {
	this.listenLogic = new (require('./ListenLogic'));
}

/**
 * process action and return response
 */
PostbackLogic.prototype.processAction = function (input, payload, setBotTyping, bot, callback) {
	let self = this;

	let userId = payload.sender.id;

	//menu buttons options
	if (input === "POSTBACK_BRIEF") {
		self.listenLogic.processInput("morning brief", payload, setBotTyping, bot, callback);
	} else if (input === "POSTBACK_AGENDA") {
		callback(facebookResponse.getButtonMessage("This is your schedule for today:", [
			facebookResponse.getGenericButton("web_url", "Agenda", null, ZoiConfig.clientUrl + "/agenda?userId=" + userId, "full")
		]));
	} else if (input === "POSTBACK_MAILS") {
		callback(facebookResponse.getButtonMessage("Watch your unread customer emails:", [
			facebookResponse.getGenericButton("web_url", "Unread Emails", null, ZoiConfig.clientUrl + "/mail?userId=" + userId, "full")
		]));
	} else if (input === "POSTBACK_PROMOTIONS") {
		self.listenLogic.processInput("send promotions", payload, setBotTyping, bot, callback);
	} else if (input === "POSTBACK_OLD_CUSTOMERS") {
		self.listenLogic.processInput("old customers", payload, setBotTyping, bot, callback);
	} else if (input === "POSTBACK_PROFILE") {
		callback(facebookResponse.getButtonMessage("Take a look at your profile", [
			facebookResponse.getGenericButton("web_url", "My Profile", null, ZoiConfig.clientUrl + "/profile?userId=" + userId, "full")
		]));
	} else if (input === "POSTBACK_LEARN") {
		self.listenLogic.processInput("I want to leave review", payload, setBotTyping, bot, callback);
	} else if (input === "POSTBACK_ACCOUNT") {
		callback(facebookResponse.getButtonMessage("Take a look at your account:", [
			facebookResponse.getGenericButton("web_url", "My Account", null, ZoiConfig.clientUrl + "/account?userId=" + userId, "full")
		]));
	} else if (input === "POSTBACK_INTEGRATIONS") {
		callback(facebookResponse.getButtonMessage("Take a look at your integrations:", [
			facebookResponse.getGenericButton("web_url", "My Integrations", null, ZoiConfig.clientUrl + "/integrations?userId=" + userId, "full")
		]));
	} else if (input === "POSTBACK_SETTINGS") {
		callback(facebookResponse.getButtonMessage("Take a look at your settings:", [
			facebookResponse.getGenericButton("web_url", "My Settings", null, ZoiConfig.clientUrl + "/settings?userId=" + userId, "full")
		]));
	} else if (input === "POSTBACK_GET_STARTED") {
		self.listenLogic.processInput("reset", payload, setBotTyping, bot, callback);
	}
};

module.exports = PostbackLogic;