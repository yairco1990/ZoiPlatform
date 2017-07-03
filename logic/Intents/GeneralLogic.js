/**
 * Created by Yair on 6/20/2017.
 */

const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');

const delayTime = 3000;

function GeneralLogic() {
    this.DBManager = require('../../dal/DBManager');
}

/**
 * process the user input
 */
GeneralLogic.prototype.processIntent = function (conversationData, user, setBotTyping, requestObj, callback) {
    let self = this;

    switch (conversationData.intent) {
        case "general hi zoi":
	  self.sayHey(conversationData.entities, callback);
	  break;
        case "general no thanks":
	  user.conversationData = null;
	  user.session = null;
	  self.DBManager.saveUser(user).then(function () {
	      callback(facebookResponse.getTextMessage("OK boss"));
	  });
	  break;
        case "general bye zoi":
	  user.conversationData = null;
	  user.session = null;
	  self.DBManager.saveUser(user).then(function () {
	      callback(facebookResponse.getTextMessage("Bye boss"));
	  });
	  break;
    }
};

/**
 * say hey
 * @param entities
 * @param callback
 */
GeneralLogic.prototype.sayHey = function (entities, callback) {
    let self = this;

    let randomNumber = Math.random();
    if (randomNumber < 0.5) {
        callback(facebookResponse.getTextMessage("Hey boss! What can I do for you?"));
    } else {
        callback(facebookResponse.getTextMessage("Hey Chief! What can I do for you?"));
    }
};

module.exports = GeneralLogic;