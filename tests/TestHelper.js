const MyLog = require('../interfaces/MyLog');
const ZoiConfig = require('../config');
const sinon = require('sinon');
const chai = require('chai');

//prepare before all the tests running
before(() => {
	console.log("Test is starting");

	//disable logs
	MyLog.log = () => {
	};
	MyLog.info = () => {
	};
	MyLog.debug = () => {
	};

	//connect to test db
	ZoiConfig.mongoUrl = 'mongodb://localhost:27017/zoitest_db';

});

after(() => {
	console.log("Test is finished");
});

module.exports = {
	fakeSendMessagesFunction: function (logicClass) {
		return sinon.stub(logicClass, "sendMessages").callsFake(function (messages) {
			MyLog.log(`${messages.length} messages sent`);
		});
	}
};