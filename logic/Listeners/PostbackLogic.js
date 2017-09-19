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
				self.listenLogic.processInput("f:morning-brief", payload, setBotTyping, reply);
			} else if (input === "ACTION_PROMOTIONS") {
				self.listenLogic.processInput("f:promotions", payload, setBotTyping, reply);
			} else if (input === "ACTION_OLD_CUSTOMERS") {
				self.listenLogic.processInput("f:old-customers", payload, setBotTyping, reply);
			} else if (input === "ACTION_LEARN") {
				self.listenLogic.processInput("I want to leave review", payload, setBotTyping, reply);
			} else if (input === "ACTION_POST_CONTENT") {
				self.listenLogic.processInput("f:rss", payload, setBotTyping, reply);
			} else if (input === "ACTION_GET_STARTED") {
				self.listenLogic.processInput("resetzoi", payload, setBotTyping, reply);
			} else if (input === "ACTION_AGENDA") {
				self.listenLogic.processInput("f:schedule", payload, setBotTyping, reply);
			} else if (input === "ACTION_MAILS") {
				self.listenLogic.processInput("f:show-emails", payload, setBotTyping, reply);
			}
		} else if (input.includes("MENU")) {

			//menu buttons options
			if (input === "MENU_INTEGRATIONS") {
				reply(facebookResponse.getButtonMessage("Take a look at your integrations:", [
					facebookResponse.getGenericButton("web_url", "My Integrations", null, `${ZoiConfig.clientUrl}/integrations?userId=${userId}&skipExtension=true`, null, false)
				]));
			}
		}
	} catch (err) {
		MyLog.error(err);
	}
};

module.exports = PostbackLogic;