const moment = require('moment-timezone');
const fs = require('fs');
const ZoiConfig = require('../config');

//show log in israel timezone
const logTimezone = "Asia/Jerusalem";
const timeFormat = "D MMM HH:mm:ss - ";

class MyLog {

	static debug(text) {

		const logText = `${MyLog.getCurrentTime()} Debug: ${text}`;

		console.debug(logText);

		ZoiConfig.writeDebug && MyLog.writeToFile(logText);
	}

	static info(text) {

		const logText = `${MyLog.getCurrentTime()} Info: ${text}`;

		console.info(logText);

		ZoiConfig.writeInfo && MyLog.writeToFile(logText);
	}

	static error(err) {

		let printError = (text) => {
			const logText = `${MyLog.getCurrentTime()} Error: ${text}`;
			console.error(logText);
			ZoiConfig.writeErrors && MyLog.writeToFile(logText);
		};

		if (err.message) {
			printError(err.message);
		}
		if (err.stack) {
			printError(err.stack);
		}
		if (typeof err === 'string') {
			printError(err);
		}
	}

	static getCurrentTime() {
		return moment().tz(logTimezone).format(timeFormat);
	}

	static getFileName() {
		return `logs/${moment().tz(logTimezone).format("DD-MM-YY")}-log.txt`
	}

	static writeToFile(logText) {

		const fileName = MyLog.getFileName();

		fs.appendFile(fileName, logText + "\n", function (err) {
			if (err) console.error(err);
		});

	}


	//just redirect
	static log(text) {
		MyLog.info(text);
	}
}

module.exports = MyLog;

