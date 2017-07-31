/**
 * Created by Yair on 6/20/2017.
 */

const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const EmailLib = require('../../interfaces/EmailLib');
const EmailConfig = require('../../interfaces/assets/EmailsConfig');
const AcuityLogic = require('../ApiHandlers/AcuitySchedulingLogic');
const _ = require('underscore');
const async = require('async');
const ZoiConfig = require('../../config');
const deepcopy = require('deepcopy');

const delayTime = ZoiConfig.delayTime || 3000;
const fallbackText = "I don't know what that means 😕, Please try to say it again in a different way. You can also try to use my preset actions in the menu.";

function GenericLogic(user) {
	this.user = user;
	//get the single instance of DBManager
	this.DBManager = require('../../dal/DBManager');
}

/**
 * process the user input
 */
GenericLogic.prototype.processIntent = function (conversationData, setBotTyping, requestObj, reply) {

	let self = this;

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
		default:
			//if we didn't find response for this intent - send fallback.
			if (!responseText) {
				responseText = fallbackText;
			}
			reply(facebookResponse.getTextMessage(responseText));
			break;
	}
};