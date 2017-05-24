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

        self.zohoLogic.getRecords('leads', function (status, data) {
            callback(status, self.generateFacebookResponse(data, 'Leads'));
        });

    } else if (input.includes('get contacts')) {

        self.zohoLogic.getRecords('contacts', function (status, data) {
            callback(status, self.generateFacebookResponse(data, 'Contacts'));
        });

    } else if (input.includes('get tasks')) {

        self.zohoLogic.getRecords('tasks', function (status, data) {
            callback(status, self.generateFacebookResponse(data, 'Tasks'));
        });

    } else {
        callback(200, {"text": 'No data found'});
    }
};

/**
 * generate the data we got from zoho to text response
 */
ListenLogic.prototype.generateFacebookResponse = function (data, type) {
    var rowData = data.data[type].row.FL;
    var result = "";
    rowData.forEach(function (item) {
        result += item.val + ": " + item.content;
    });
    return {"text": result};
};

module.exports = ListenLogic;