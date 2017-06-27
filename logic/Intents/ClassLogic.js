/**
 * Created by Yair on 6/20/2017.
 */

const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');

function ClassLogic() {
    //get the single instance of DBManager
    this.DBManager = require('../../dal/DBManager');
}

/**
 * process the user input
 */
ClassLogic.prototype.processIntent = function (user, setBotTyping, bot, requestObj, input, callback) {
    let self = this;

};

module.exports = ClassLogic;