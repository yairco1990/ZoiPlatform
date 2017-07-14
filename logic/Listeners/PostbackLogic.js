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

/**
 * PostbackLogic constructor
 * @constructor
 */
function PostbackLogic() {
	this.listenLogic = new (require('./ListenLogic'));
}

/**
 * process action and return response
 * @param setBotTyping - function, launch it if you want to send to the user that the bot is typing
 * @param bot - the bot object
 * @param requestObj - request object, contains sender details, message and other staff
 * @param payload - the button payload
 * @param callback - what to send to the user
 */
PostbackLogic.prototype.processAction = function (setBotTyping, bot, requestObj, payload, callback) {
	let self = this;

	if (payload.type == "WELCOME_CONVERSATION") {
		self.listenLogic.processInput(setBotTyping, bot, requestObj, "reset", callback);
	}
};

/**
 * process action and return mock response
 * @param setBotTyping - function, launch it if you want to send to the user that the bot is typing
 * @param bot - the bot object
 * @param requestObj - request object, contains sender details, message and other staff
 * @param payload - the button payload
 * @param callback - what to send to the user
 */
PostbackLogic.prototype.processMockAction = function (setBotTyping, bot, requestObj, payload, callback) {
	let self = this;


	let delayTime = 3000;

	if (payload.id == 3) {
		callback(facebookResponse.getTextMessage("Great! I will send this email to your customers right now."));

		setTimeout(function () {
			callback(facebookResponse.getTextMessage("Done! I sent the promotion to 67 customers. 🙂"));

			setTimeout(function () {
				callback(facebookResponse.getTextMessage("Your calendar is going to be full in no time"));
			}, delayTime * 2);
		}, delayTime * 2);
	}
	else if (payload.type == Mocks.MENU_BUTTON_REVENUE_REPORTER) {

		callback(facebookResponse.getTextMessage("Hi boss"));

	}
	else if (payload.type == Mocks.MENU_BUTTON_VALENTINES_DAY) {

		callback(facebookResponse.getTextMessage(Mocks.VALENTINES_DAY_THIS_WEEKEND), true);

		setTimeout(function () {
			callback(facebookResponse.getQRElement(Mocks.WANT_TO_POST_ON_FB_PAGE, [
				facebookResponse.getQRButton("text", Mocks.YES_POST),
				facebookResponse.getQRButton("text", Mocks.DONT_POST)
			]));
		}, delayTime);

	}
	else {

		callback(facebookResponse.getTextMessage(Mocks.I_HAVE_NOTHING_TO_SAY));

	}
};

module.exports = PostbackLogic;