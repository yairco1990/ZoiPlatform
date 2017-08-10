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
	this.DBManager = require('../../dal/DBManager');
}

//for now, if the user sent ACTION - listen logic class will handle it and decide if its valid request.
//for MENU buttons - we do the logic here and check if the request is valid.
//TODO: change it!
/**
 * process action and return response
 */
PostbackLogic.prototype.processAction = async function (input, payload, setBotTyping, bot, reply) {
	let self = this;

	let userId = payload.sender.id;

	if (input.includes("ACTION")) {
		//action buttons
		if (input === "ACTION_BRIEF") {
			self.listenLogic.processInput("morning brief", payload, setBotTyping, bot, reply);
		} else if (input === "ACTION_PROMOTIONS") {
			self.listenLogic.processInput("send promotions", payload, setBotTyping, bot, reply);
		} else if (input === "ACTION_OLD_CUSTOMERS") {
			self.listenLogic.processInput("old customers", payload, setBotTyping, bot, reply);
		} else if (input === "ACTION_LEARN") {
			self.listenLogic.processInput("I want to leave review", payload, setBotTyping, bot, reply);
		} else if (input === "ACTION_GET_STARTED") {
			self.listenLogic.processInput("reset", payload, setBotTyping, bot, reply);
		} else if (input === "ACTION_AGENDA") {
			self.listenLogic.processInput("what is my schedule for today?", payload, setBotTyping, bot, reply);
		} else if (input === "ACTION_MAILS") {
			self.listenLogic.processInput("Fetch unread emails", payload, setBotTyping, bot, reply);
		}
	} else if (input.includes("MENU")) {

		//check that the user made first integration with acuity
		let user = await self.DBManager.getUser({_id: userId});
		if (!user.integrations || !user.integrations.Acuity) {
			reply(facebookResponse.getButtonMessage("To start working together, I'll have to work with the tools you work with to run your business. Press on the link to help me integrate with Acuity Scheduling and Gmail.", [
				facebookResponse.getGenericButton("web_url", "My Integrations", null, ZoiConfig.clientUrl + "/integrations?userId=" + user._id, "full")
			]));
			return;
		}

		//menu buttons options
		if (input === "MENU_PROFILE") {
			reply(facebookResponse.getButtonMessage("Take a look at your profile", [
				facebookResponse.getGenericButton("web_url", "My Profile", null, ZoiConfig.clientUrl + "/profile?userId=" + userId, "full")
			]));
		} else if (input === "MENU_ACCOUNT") {
			reply(facebookResponse.getButtonMessage("Take a look at your account:", [
				facebookResponse.getGenericButton("web_url", "My Account", null, ZoiConfig.clientUrl + "/account?userId=" + userId, "full")
			]));
		} else if (input === "MENU_INTEGRATIONS") {
			reply(facebookResponse.getButtonMessage("Take a look at your integrations:", [
				facebookResponse.getGenericButton("web_url", "My Integrations", null, ZoiConfig.clientUrl + "/integrations?userId=" + userId, "full")
			]));
		} else if (input === "MENU_SETTINGS") {
			reply(facebookResponse.getButtonMessage("Take a look at your settings:", [
				facebookResponse.getGenericButton("web_url", "My Settings", null, ZoiConfig.clientUrl + "/settings?userId=" + userId, "full")
			]));
		}
	}
};

module.exports = PostbackLogic;