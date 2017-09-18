const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const requestify = require('requestify');
const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const MyLog = require('../../interfaces/MyLog');
const moment = require('moment-timezone');
const facebookResponse = require('../../interfaces/FacebookResponse');
const Mocks = require('../../interfaces/Mocks');
const request = require('request');
const SharedLogic = require('../SharedLogic');
const WelcomeLogic = require('../Intents/WelcomeLogic');
const AppointmentLogic = require('../Intents/AppointmentLogic');
const ZoiConfig = require('../../config');
const Acuity = require('acuityscheduling');

/**
 * PostbackLogic constructor
 * @constructor
 */
function PostbackLogic() {
	this.listenLogic = new (require('./ListenLogic'));
	this.DBManager = require('../../dal/DBManager');
}

//for now, if the user sent ACTION - listen logic class will handle it and decide if it's a valid request.
//for MENU buttons - we do the logic here and check if it's a valid request.
/**
 * process action and return response
 */
PostbackLogic.prototype.processAction = async function (input, payload, setBotTyping, bot, reply) {
	const self = this;

	let userId = payload.sender.id;

	try {
		//action buttons
		if (input.includes("ACTION")) {

			if (input === "ACTION_BRIEF") {
				self.listenLogic.processInput("morning brief", payload, setBotTyping, reply);
			} else if (input === "ACTION_PROMOTIONS") {
				self.listenLogic.processInput("send promotions", payload, setBotTyping, reply);
			} else if (input === "ACTION_OLD_CUSTOMERS") {
				self.listenLogic.processInput("old customers", payload, setBotTyping, reply);
			} else if (input === "ACTION_LEARN") {
				self.listenLogic.processInput("I want to leave review", payload, setBotTyping, reply);
			} else if (input === "ACTION_GET_STARTED") {
				self.listenLogic.processInput("resetzoi", payload, setBotTyping, reply);
			} else if (input === "ACTION_AGENDA") {
				self.listenLogic.processInput("what is my schedule for today?", payload, setBotTyping, reply);
			} else if (input === "ACTION_LEARN") {
				self.listenLogic.processInput("I want to leave review", payload, setBotTyping, reply);
			} else if (input === "ACTION_MAILS") {
				//check that the user made first integration with gmail
				let user = await self.DBManager.getUser({_id: userId});
				if (user.integrations.Gmail) {
					self.listenLogic.processInput("Fetch unread emails", payload, setBotTyping, reply);
				} else {
					reply(facebookResponse.getButtonMessage("To see your unread emails, I need you to integrate with Gmail first... :)", [
						facebookResponse.getGenericButton("web_url", "My Integrations", null, ZoiConfig.clientUrl + "/integrations?userId=" + userId, null, false)
					]));
				}
			}
		} else if (input.includes("MENU")) {

			//menu buttons options
			if (input === "MENU_PROFILE") {
				reply(facebookResponse.getButtonMessage("Take a look at your achievements", [
					facebookResponse.getGenericButton("web_url", "My Achievements", null, ZoiConfig.clientUrl + "/profile?userId=" + userId, null)
				]));
			} else if (input === "MENU_ACCOUNT") {
				reply(facebookResponse.getButtonMessage("Take a look at your account:", [
					facebookResponse.getGenericButton("web_url", "My Account", null, ZoiConfig.clientUrl + "/account?userId=" + userId, null)
				]));
			} else if (input === "MENU_INTEGRATIONS") {
				reply(facebookResponse.getButtonMessage("Take a look at your integrations:", [
					facebookResponse.getGenericButton("web_url", "My Integrations", null, ZoiConfig.clientUrl + "/integrations?userId=" + userId, null, false)
				]));
			} else if (input === "MENU_SETTINGS") {
				reply(facebookResponse.getButtonMessage("Take a look at your settings:", [
					facebookResponse.getGenericButton("web_url", "My Settings", null, ZoiConfig.clientUrl + "/settings?userId=" + userId, null)
				]));
			}
		}
	} catch (err) {
		MyLog.error(err);
	}
};

module.exports = PostbackLogic;