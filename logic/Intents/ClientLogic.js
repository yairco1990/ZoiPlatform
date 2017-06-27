/**
 * Created by Yair on 6/20/2017.
 */

const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');

function ClientLogic() {
    //get the single instance of DBManager
    this.DBManager = require('../../dal/DBManager');
    this.mindbodyLogic = new MindbodyLogic({});
}

/**
 * process the user input
 */
ClientLogic.prototype.processIntent = function (intentData, user, setBotTyping, requestObj, callback) {

    let self = this;

    setBotTyping();

    switch (intentData.intent) {
        case "client show customer card":
	  self.getCustomer(intentData.entities, callback);
	  break;
    }
};

/**
 * get customer
 */
ClientLogic.prototype.getCustomer = function (entities, callback) {

    let self = this;

    self.mindbodyLogic.getClients(entities).then(function (clients) {

        //choose the first one we found
        let customer = clients[0];

        callback(facebookResponse.getGenericTemplate([
	  facebookResponse.getGenericElement(customer.FirstName + " " + customer.LastName, customer.PhotoURL, "Status: " + customer.Status)
        ]));

    }).catch(function (err) {

        Util.log(err);
        callback(facebookResponse.getTextMessage("Error on getting clients"));
    });
};

module.exports = ClientLogic;