var ZohoLogic = require('./ZohoLogic');

/**
 * listen constructor
 * @constructor
 */
function ListenLogic() {
    this.authtoken = "4294f8146f2ccae058f4008aa73b98a1";
    this.zohoLogic = new ZohoLogic(this.authtoken);
}

/**
 * process the user input
 * @param input
 * @param callback
 */
ListenLogic.prototype.processInput = function (input, callback) {

    var self = this;

    if (input.includes('get leads')) {

        self.zohoLogic.getRecords('leads', callback);

    } else if (input.includes('get contacts')) {

        self.zohoLogic.getRecords('contacts', callback);

    } else if (input.includes('get tasks')) {

        self.zohoLogic.getRecords('tasks', callback);

    } else {
        callback(200, "NO_DATA");
    }
};


module.exports = ListenLogic;