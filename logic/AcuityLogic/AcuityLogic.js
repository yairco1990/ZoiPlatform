/**
 * Created by Yair on 7/4/2017.
 */
const AcuityApi = require('../ApiHandlers/AcuitySchedulingLogic');
const Util = require('util');
const moment = require('moment');
const ZoiConfig = require('../../config');
const GmailLogic = require('../GmailLogic');
const _ = require('underscore');
const MyUtils = require('../../interfaces/utils');
const AcuityFactory = require('../../interfaces/Factories/AcuityFactory');
const requestify = require('requestify');
const facebookResponse = require('../../interfaces/FacebookResponse');
const ClientLogic = require('../Intents/ClientLogic');
const EmailLib = require('../../interfaces/EmailLib');
const EmailConfig = require('../../interfaces/assets/EmailsConfig');
const WelcomeLogic = require('../Intents/WelcomeLogic');
const deepcopy = require('deepcopy');

class AcuityLogic {

	constructor() {
		this.DBManager = require('../../dal/DBManager');
	}

	getClients(userId, callback) {
		let self = this;

		self.DBManager.getUser({_id: userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			acuityApi.getClients().then(function (result) {
				callback(200, result);
			})
		});
	}

	getAvailability(userId, callback) {
		let self = this;

		self.DBManager.getUser({_id: userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			let options = [
				{key: 'appointmentTypeID', value: 3581890},
				{key: 'date', value: moment().add(1, 'days').format('YYYY-MM-DDTHH:mm:ss')}
			];

			acuityApi.getAvailability(options).then(function (result) {
				callback(200, result);
			})
		});
	}

	getAppointmentTypes(userId, callback) {
		let self = this;

		self.DBManager.getUser({_id: userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			acuityApi.getAppointmentTypes().then(function (result) {
				callback(200, result);
			})
		});
	}

	//only for test now
	sendPromotions(userId, callback) {
		let self = this;

		self.DBManager.getUser({_id: userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			let options = [
				{key: 'appointmentTypeID', value: 3581890},
				{key: 'date', value: moment().add(1, 'days').format('YYYY-MM-DDTHH:mm:ss')}
			];

			return acuityApi.getAvailability(options);
		}).then(function (slots) {

			//iterate slots
			slots.forEach(function (slot) {
				callback(200, slot);
			})
		});
	}

	getAgenda(data, callback) {
		let self = this;

		self.DBManager.getUser({_id: data.userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			return acuityApi.getAppointments({
				minDate: MyUtils.convertToAcuityDate(moment().startOf('day')),
				maxDate: MyUtils.convertToAcuityDate(moment().endOf('day'))
			});
		}).then(function (appointments) {

			//sort appointments
			appointments.sort(function (q1, q2) {
				if (moment(q1.datetime).isAfter(moment(q2.datetime))) {
					return 1;
				} else {
					return -1;
				}
			});

			callback(200, AcuityFactory.generateAppointmentsList(appointments));
		}).catch(function (err) {
			callback(401, err);
		});
	}

	getOldCustomers(data, callback) {
		let self = this;

		self.DBManager.getUser({_id: data.userId}).then(function (user) {

			if (user.metadata.oldCustomers) {
				callback(200, user.metadata.oldCustomers);
			} else {
				callback(200, "NOT_AVAILABLE");
			}

		}).catch(function (err) {
			callback(401, err);
		});
	}

	promoteOldCustomers(data, callback) {
		let self = this;

		let customers = JSON.parse(data.customers);

		self.DBManager.getUser({_id: data.userId}).then(function (user) {

			let emailTemplate = EmailConfig.oldCustomersEmail;

			customers.forEach(function (customer) {

				let emailHtml = EmailLib.getEmailByName('promotionsMail');

				//parse the first part
				emailHtml = emailHtml.replace('{{line1}}', emailTemplate.line1);
				emailHtml = emailHtml.replace('{{line2}}', emailTemplate.line2);
				emailHtml = emailHtml.replace('{{line3}}', emailTemplate.line3);
				emailHtml = emailHtml.replace('{{line4}}', emailTemplate.line4);
				emailHtml = emailHtml.replace('{{bannerSrc}}', emailTemplate.bannerImage);

				//parse the second part
				emailHtml = emailHtml.replace('{{Business name}}', user.integrations.Acuity.userDetails.name);
				emailHtml = emailHtml.replace('{{business_name}}', user.integrations.Acuity.userDetails.name);
				emailHtml = emailHtml.replace('{{business name}}', user.integrations.Acuity.userDetails.name);
				emailHtml = emailHtml.replace('{{firstName}}', customer.firstName);
				emailHtml = MyUtils.replaceAll('{{hoverColor}}', emailTemplate.hoverColor, emailHtml);
				emailHtml = MyUtils.replaceAll('{{color}}', emailTemplate.color, emailHtml);

				EmailLib.sendEmail(emailHtml, [{
					address: customer.email,
					from: 'Zoi.AI <noreply@fobi.io>',
					subject: customer.firstName + ' ' + customer.lastName,
					alt: 'Old Customers Promotions'
				}]);
			});

			callback(200, "SUCCESS");
			Util.log("Old customers promotions sent successfully");

			//remove the metadata
			user.metadata.oldCustomers = null;
			self.DBManager.saveUser(user).then(function () {
				//old customers removed
			});

		}).catch(function (err) {
			callback(401, err);
		});
	}

	scheduleAppointment(data, callback) {
		let self = this;

		let _user;
		self.DBManager.getUser({_id: data.userId}).then(function (user) {
			_user = user;
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			// Create appointment:
			let options = {
				method: 'POST',
				body: {
					//remove the timezone
					datetime: data.datetime.substring(0, 19),
					appointmentTypeID: data.appointmentTypeID,
					firstName: data.firstname,
					lastName: data.lastname,
					email: data.email,
					notes: data.notes
				}
			};
			if (data.certificate) {
				options.body.certificate = data.certificate;
			}

			return acuityApi.scheduleAppointment(options);
		}).then(function () {

			callback(200, {});
			Util.log("Appointment scheduled successfully");

			//save appointment times
			let actionTime = moment().format("YYYY/MM");
			_user.profile = _user.profile || {};
			if (_user.profile[actionTime]) {
				_user.profile[actionTime].numOfAppointments = (_user.profile[actionTime].numOfAppointments || 0) + 1;
				_user.profile[actionTime].profitFromAppointments = ((_user.profile[actionTime].profitFromAppointments || 0) + parseFloat(data.price)) || 0;
			} else {
				_user.profile[actionTime] = {
					numOfAppointments: 1,
					profitFromAppointments: parseFloat(data.price) || 0
				}
			}

			self.DBManager.saveUser(_user).then(function () {
			});
		}).catch(function (err) {

			callback(401, err);
		});
	}

	getEmails(data, callback) {

		let self = this;

		let tokens, clients;
		self.DBManager.getUser({_id: data.userId}).then(function (user) {

			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);
			tokens = user.integrations.Gmail;

			return acuityApi.getClients();

		}).then(function (_clients) {
			clients = _clients;
			let queryString = "newer_than:7d is:unread";

			//get unread emails from the user clients
			return GmailLogic.getEmailsList(tokens, queryString, 'me');

		}).then(function (messages) {

			let clientsMessages = _.filter(messages, function (item1) {
				return _.some(this, function (item2) {
					return item1.from.includes(item2.email) && item2.email;
				});
			}, clients);

			callback(200, clientsMessages);

		}).catch(function (err) {
			callback(401, err);
		});
	}

	onAppointmentScheduled(userId, data, bot, callback) {
		let self = this;

		let acuityApi;
		let _user;
		//get the user that wants to integrate
		self.DBManager.getUser({_id: userId}).then(function (user) {

			_user = user;

			acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			return acuityApi.getAppointments(null, 'appointments/' + data.id);

		}).then(function (appointment) {

			let options = {
				firstName: appointment.firstName,
				lastName: appointment.lastName
			};

			return acuityApi.getAppointments(options);

		}).then(function (appointments) {

			if (appointments.length < 2) {
				let appointment = appointments[0];
				let newClient = {
					firstName: appointment.firstName,
					lastName: appointment.lastName,
					email: appointment.email,
				};

				if (!_user.conversationData) {

					//save the new client to user
					_user.session = {
						newClient: newClient
					};
					self.DBManager.saveUser(_user).then(function () {

						//start the conversation in the clientLogic class
						let clientLogic = new ClientLogic(_user);
						let conversationData = {
							intent: "client new customer join",
							context: "CLIENT"
						};
						let replyFunction = function (rep, isBotTyping, delay) {
							return new Promise(function (resolve, reject) {
								delay = delay || 0;
								setTimeout(() => {
									//send reply
									bot.sendMessage(_user._id, rep, (err) => {
										if (err) {
											reject(err);
											return;
										}
										if (isBotTyping) {
											bot.sendSenderAction(_user._id, "typing_on", () => {
												resolve();
											});
										} else {
											resolve();
										}
										Util.log(`Message returned ${_user._id}] -> ${rep.text}`);
									});
								}, delay);
							});
						};
						clientLogic.processIntent(conversationData, null, null, replyFunction);
					});
				}

				callback(200, {message: "It's a new customer"});
			} else {
				callback(200, {message: "Not a new customer"});
			}

		}).catch(MyUtils.getErrorMsg(function (err) {
			callback(400, err);
		}));
	}

	integrate(userId, code, bot, callback) {

		let self = this;

		//get the user that wants to integrate
		self.DBManager.getUser({_id: userId}).then(function (user) {

			//check if already integrated with Acuity
			let isAlreadyConnectedWithAcuity = user.integrations && user.integrations.Acuity;

			//get acuity details
			AcuityApi.getUserAndToken(code).then(function (userData) {

				//set integration
				user.integrations.Acuity = userData;

				//save user with the integration
				return self.DBManager.saveUser(user);

			}).then(function () {

				//redirect the user to his integrations page
				callback(302, {'location': ZoiConfig.clientUrl + '/integrations?userId=' + userId});

				let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

				//register for Acuity webhooks
				let options = {
					method: 'POST',
					body: {
						event: "appointment.scheduled",
						target: ZoiConfig.serverUrl + "/acuity/webhook/" + userId + "/scheduled"
					}
				};
				return acuityApi.setWebhooks(options);

			}).then(function (response) {

				//proceed after user integrated for the first time only(if integrated more than once - skip it)
				if (!isAlreadyConnectedWithAcuity) {
					//start the conversation in the welcomeLogic class
					let welcomeLogic = new WelcomeLogic(user);
					let conversationData = {
						intent: "welcome acuity integrated",
						context: "WELCOME_CONVERSATION"
					};
					let replyFunction = function (rep, isBotTyping, delay) {
						return new Promise(function (resolve, reject) {
							delay = delay || 0;
							setTimeout(() => {
								//send reply
								bot.sendMessage(_user._id, rep, (err) => {
									if (err) {
										reject(err);
										return;
									}
									if (isBotTyping) {
										bot.sendSenderAction(_user._id, "typing_on", () => {
											resolve();
										});
									} else {
										resolve();
									}
									Util.log(`Message returned ${_user._id}] -> ${rep.text}`);
								});
							}, delay);
						});
					};
					welcomeLogic.processIntent(conversationData, null, null, replyFunction);
				}

				Util.log("Response");
				Util.log(response);

			}).catch(MyUtils.getErrorMsg());
		});
	}
}

module.exports = AcuityLogic;