var ZohoLogic = require('./ZohoLogic');
var requestify = require('requestify');
var Util = require('util');

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

    requestify.request('http://52.174.244.154:8080/zoi/getIntent?text=' + input, {
        method: 'GET'
    }).then(function (response) {

        var nlpResponse = response.getBody();

        Util.log("Zoi got input: " + input);
        Util.log("Zoi understood: " + nlpResponse);

        if (nlpResponse.includes('leads')) {

            self.zohoLogic.getRecords('leads', function (status, data) {
                callback(status, self.generateFacebookResponse(data, 'Leads'));
            });

        } else if (nlpResponse.includes('contacts')) {

            self.zohoLogic.getRecords('contacts', function (status, data) {
                callback(status, self.generateFacebookResponse(data, 'Contacts'));
            });

        } else if (nlpResponse.includes('tasks')) {

            self.zohoLogic.getRecords('tasks', function (status, data) {
                callback(status, self.generateFacebookResponse(data, 'Tasks'));
            });

        } else if (nlpResponse.includes('free slot')) {

            callback(200, {"text": "It's zoho..there are no slots here.."});

        } else {
            callback(200, {"text": 'No data found'});
        }

    }).catch(function (err) {
        callback(200, {"text": 'server error'});
        Util.log(err);
    });
};

/**
 * generate the data we got from zoho to text response
 */
ListenLogic.prototype.generateFacebookResponse = function (data, type) {
    if (data && data.data && data.data[type] && data.data[type].row) {
        if (data.data[type].row instanceof Array) {
            var rowData = data.data[type].row;
            var result = "No data";
            if (rowData) {
                result = "";
                rowData.forEach(function (row) {
                    result += row.FL[3].content + " " + row.FL[4].content + "\n";
                });
            }
            return {"text": result};
        } else {
            var rowData = data.data[type].row.FL;
            var result = "No data";
            if (rowData) {
                result = "";
                result += rowData[3].content + " - " + rowData[4].content;
            }
            return {"text": result};
        }
    } else {
        //no data
        return {"text": "No data founded"};
    }
};

module.exports = ListenLogic;