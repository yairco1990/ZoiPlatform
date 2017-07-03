/**
 * Created by Yair on 6/28/2017.
 */

const MindbodyApi = require('../logic/ApiHandlers/MindbodyLogic');

module.exports = {
    index: function (req, res) {
        let self = this;

        if (req.url.includes('getClasses')) {
	  self.getClasses(res);
        } else if (req.url.includes('getPrograms')) {
	  self.getPrograms(res);
        } else if (req.url.includes('getSessions')) {
	  self.getSessions(res);
        } else if (req.url.includes('freeSlot')) {
	  self.getBookableItems(res);
        }
    },

    getClasses: function (res) {
        let mindbodyApi = new MindbodyApi({});

        mindbodyApi.getClasses().then(function (result) {
	  res.end(JSON.stringify(result));
        });
    },

    getPrograms: function (res) {
        let mindbodyApi = new MindbodyApi({});

        mindbodyApi.getPrograms().then(function (result) {
	  res.end(JSON.stringify(result));
        });
    },

    getSessions: function (res) {
        let mindbodyApi = new MindbodyApi({});

        mindbodyApi.getSessionTypes().then(function (result) {
	  res.end(JSON.stringify(result));
        });
    },

    getBookableItems: function (res) {
        let mindbodyApi = new MindbodyApi({});

        mindbodyApi.getNextFreeSlot({sessionTypeId: 203}).then(function (result) {
	  res.end(JSON.stringify(result));
        });
    },
};