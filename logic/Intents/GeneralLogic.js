/**
 * Created by Yair on 6/20/2017.
 */
const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const google = require('googleapis');
const GmailLogic = require('../GmailLogic');
const AcuityLogic = require('../ApiHandlers/AcuitySchedulingLogic');
const AppointmentLogic = require('./AppointmentLogic');
const _ = require('underscore');
const ZoiConfig = require('../../config');

const delayTime = 3000;

function GeneralLogic(user) {
	this.user = user;
	this.DBManager = require('../../dal/DBManager');
}

/**
 * process the user input
 */
GeneralLogic.prototype.processIntent = function (conversationData, setBotTyping, requestObj, callback) {
	let self = this;

	switch (conversationData.intent) {
		case "general hi zoi":
			self.sayHey(conversationData.entities, callback);
			break;
		case "general no thanks":
			self.clearAndSaveUser(callback);
			break;
		case "general bye zoi":
			self.clearAndSaveUser(callback);
			break;
		case "general morning brief":
			setBotTyping();
			self.sendMorningBrief(conversationData, setBotTyping, requestObj, callback);
			break;
	}
};

/**
 * send morning brief
 */
GeneralLogic.prototype.sendMorningBrief = function (conversationData, setBotTyping, requestObj, callback) {
	let self = this;
	let user = self.user;

	let tokens = user.integrations.Gmail;

	let appointmentLogic = new AppointmentLogic(user);

	let acuityLogic = new AcuityLogic(user.integrations.Acuity.accessToken);
	acuityLogic.getClients().then(function (clients) {

		let queryString = "newer_than:7d is:unread";

		//get unread emails from the user clients
		GmailLogic.getEmailsList(tokens, queryString, 'me').then(function (messages) {

			let clientsMessages = _.filter(messages, function (item1) {
				return _.some(this, function (item2) {
					return item1.from.includes(item2.email);
				});
			}, clients);

			if (clientsMessages.length > 0) {
				//emails
				callback(facebookResponse.getButtonMessage("You have " + clientsMessages.length + " unread emails from your clients on the last passed week", [
					facebookResponse.getGenericButton("web_url", "Customers Emails", null, ZoiConfig.clientUrl + "/mail?userId=" + user._id, "tall")
				]), true);
			} else {
				callback(facebookResponse.getTextMessage("You have no unread emails from your customers. Good job! :)"), true);
			}

			//get appointments for today
			return acuityLogic.getAppointments({
				minDate: MyUtils.convertToAcuityDate(moment().startOf('day')),
				maxDate: MyUtils.convertToAcuityDate(moment().endOf('day'))
			});
		}).then(function (appointments) {

			//function for starting send promotions dialog
			let startSendPromotions = function () {
				appointmentLogic.processIntent({
					intent: "appointment send promotions",
					context: "APPOINTMENT",
					skipHey: true
				}, setBotTyping, requestObj, callback);
			};

			//some delay after the previous messages
			setTimeout(function () {

				if (appointments.length) {

					callback(facebookResponse.getButtonMessage("You have " + appointments.length + " appointments today", [
						facebookResponse.getGenericButton("web_url", "Agenda", null, ZoiConfig.clientUrl + "/agenda?userId=" + user._id, "tall")
					]), true);

					//sort appointments
					appointments.sort(function (q1, q2) {
						if (moment(q1.datetime).isAfter(moment(q2.datetime))) {
							return 1;
						} else {
							return -1;
						}
					});

					//get the next appointment
					let nextAppointment;
					appointments.forEach(function (appointment) {
						if (moment(appointment.datetime).isAfter(moment())) {
							nextAppointment = appointment;
							return;
						}
					});

					if (nextAppointment) {
						setTimeout(function () {
							callback(facebookResponse.getTextMessage("Your next appointment is at " + nextAppointment.time + " with " + nextAppointment.firstName + " " + nextAppointment.lastName), true);
							startSendPromotions();
						}, delayTime);
					}
				} else {
					callback(facebookResponse.getTextMessage("You have no appointments today"));
					startSendPromotions();
				}
			}, delayTime);
		}).catch(function (err) {
			Util.log("Error:");
			Util.log(err);
		});
	});
};

/**
 * say hey
 * @param entities
 * @param callback
 */
GeneralLogic.prototype.sayHey = function (entities, callback) {
	let self = this;

	let randomNumber = Math.random();
	if (randomNumber < 0.5) {
		callback(facebookResponse.getTextMessage("Hey boss! What can I do for you?"));
	} else {
		callback(facebookResponse.getTextMessage("Hey Chief! What can I do for you?"));
	}
};

GeneralLogic.prototype.clearAndSaveUser = function (callback) {
	let self = this;
	let user = self.user;

	user.conversationData = null;
	user.session = null;
	self.DBManager.saveUser(user).then(function () {
		callback(facebookResponse.getTextMessage("Bye boss..I will wait here for your commands! :)"));
	});
};


module.exports = GeneralLogic;