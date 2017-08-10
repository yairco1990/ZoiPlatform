const moment = require('moment-timezone');

//show log in israel timezone
const logTimezone = "Asia/Jerusalem";

class MyLog {

	static log(text) {
		MyLog.info(text);
	}

	static info(text) {
		console.info(moment().tz(logTimezone).format("D MMM HH:mm:ss - ") + "Info: " + text);
	}

	static error(text) {
		console.error(moment().tz(logTimezone).format("D MMM HH:mm:ss - ") + "Error: " + text);
	}

	static debug(text) {
		console.debug(moment().tz(logTimezone).format("D MMM HH:mm:ss - ") + "Debug: " + text);
	}

}

module.exports = MyLog;

