//utils library
var Utils = require('../interfaces/utils');
var ZohoCrm = require('zoho');

function ZohoLogic(authtoken) {
    this.authtoken = authtoken;
}

ZohoLogic.prototype.getRecords = function (type, callback) {

    var self = this;

    var crm = new ZohoCrm.CRM({
        authtoken: self.authtoken
    });

    //getRecords(<string> type, <function> callback):
    crm.getRecords(type, function (err, data) {
        if (!err) {
            callback(200, data);
        } else {
            callback(404, err);
        }
    });
};

// ZohoLogic.prototype.insertRecords = function (token, type, data, onSuccess) {
//
// };

module.exports = ZohoLogic;