const moment = require('moment');

class MyLog {

	static log(text) {
		MyLog.info(text);
	}

	static info(text) {
		console.info(moment().format("D MMM HH:mm:ss - ") + "Info: " + text);
	}

	static error(text) {
		console.error(moment().format("D MMM HH:mm:ss - ") + "Error: " + text);
	}

	static debug(text) {
		console.debug(moment().format("D MMM HH:mm:ss - ") + "Debug: " + text);
	}

}

module.exports = MyLog;

