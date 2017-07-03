//Start conversation by http request

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

function RequestLogic() {
}

const delayTime = 3000;

RequestLogic.prototype.processMock = function (bot, payload, senderId) {

    if (payload.id == 1) {
        setTimeout(function () {
	  bot.sendMessage(senderId, facebookResponse.getTextMessage(Mocks.HEY_BOSS_NOTICED_4_OPENING_THIS_WEEK));

	  setTimeout(function () {
	      bot.sendMessage(senderId, facebookResponse.getTextMessage(Mocks.LETS_FEEL_THOSE_UP));

	      setTimeout(function () {
		bot.sendMessage(senderId, facebookResponse.getQRElement("What do you want me to do?",
		    [
		        facebookResponse.getQRButton('text', 'Email Promotion', JSON.stringify({id: 2})),
		        facebookResponse.getQRButton('text', 'Post on Facebook', JSON.stringify({id: 2})),
		        facebookResponse.getQRButton('text', 'No Thank\'s', JSON.stringify({id: 2}))
		    ]
		));
	      }, delayTime);
	  }, delayTime);
        }, delayTime);
    }
};

module.exports = RequestLogic;