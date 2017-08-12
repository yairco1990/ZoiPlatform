const fs = require('fs');
const MyLog = require('../../interfaces/MyLog');
const MyUtils = require('../../interfaces/utils');
const Acuity = require('acuityscheduling');
const zoiConfig = require('../../config');
const requestify = require('requestify');


class AcuitySchedulingLogic {

	constructor(accessToken) {
		this.requestOptions = Object.create(zoiConfig.Acuity);
		this.requestOptions.accessToken = accessToken;
		this.acuity = Acuity.oauth(this.requestOptions);
	}

	getClients() {
		let self = this;

		return new Promise((resolve, reject) => {

			self.acuity.request('clients', function (err, res, body) {

				if (err || body.error) {
					reject(err || body.error);
					return;
				}

				resolve(body);
			});
		});
	}

	getCalendars(options) {
		let self = this;

		return new Promise((resolve, reject) => {

			self.acuity.request(MyUtils.addParamsToUrl('calendars', options), function (err, res, body) {

				if (err || body.error) {
					reject(err || body.error);
					return;
				}

				resolve(body);
			});
		});
	}

	getAvailability(options) {
		let self = this;

		return new Promise((resolve, reject) => {

			self.acuity.request(MyUtils.addParamsToUrl('availability/times', options), function (err, res, body) {

				if (err || body.error) {
					reject(err || body.error);
					return;
				}

				resolve(body);
			});
		});
	}

	getAppointments(options, endpoint) {
		let self = this;

		return new Promise((resolve, reject) => {

			endpoint = endpoint || 'appointments';

			self.acuity.request(MyUtils.addParamsToUrl(endpoint, options), function (err, res, body) {

				if (err || body.error) {
					reject(err || body.error);
					return;
				}

				resolve(body);
			});
		});
	}

	scheduleAppointment(options) {
		let self = this;

		return new Promise((resolve, reject) => {

			self.acuity.request('appointments?admin=true&noEmail=true', options, function (err, res, body) {

				if (err || body.error) {
					reject(err || body.error);
					return;
				}

				resolve(body);
			});
		});
	}

	getAppointmentTypes() {
		let self = this;

		return new Promise((resolve, reject) => {

			self.acuity.request('appointment-types', function (err, res, body) {

				if (err || body.error) {
					reject(err || body.error);
					return;
				}

				//TODO change the type on next version
				body = body.filter(function (at) {
					return at.service === "service";
				});

				resolve(body);
			});
		});
	}

	setWebhooks(options) {
		let self = this;

		return new Promise((resolve, reject) => {

			self.acuity.request('webhooks', options, function (err, res, body) {

				if (err) {
					reject(err || body.error);
					return;
				}

				resolve(body);
			});
		});
	}

	getCoupons() {
		let self = this;

		return new Promise((resolve, reject) => {

			self.acuity.request('coupons', function (err, res, body) {

				if (err || body.error) {
					reject(err || body.error);
					return;
				}

				resolve(body);
			});
		});
	}

	/**
	 * static function that returns accessToken for specific account
	 * @param code
	 * @returns {Promise}
	 */
	static getUserAndToken(code) {

		return new Promise(function (resolve, reject) {

			//get config
			let options = Object.create(zoiConfig.Acuity);
			//create acuity object
			let acuity = Acuity.oauth(options);

			let tokenRequestParams = {};
			tokenRequestParams.grant_type = 'authorization_code';
			tokenRequestParams.code = code;
			tokenRequestParams.redirect_uri = zoiConfig.Acuity.redirectUri;
			tokenRequestParams.client_id = zoiConfig.Acuity.clientId;
			tokenRequestParams.client_secret = zoiConfig.Acuity.clientSecret;

			requestify.request('https://acuityscheduling.com/oauth2/token', {
				method: 'POST',
				dataType: 'form-url-encoded',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'User-Agent': 'AcuityScheduling-js/0.1.7'
				},
				body: tokenRequestParams
			}).then(function (tokenResult) {

				let tokenResponse = tokenResult.getBody();

				if (tokenResponse.access_token) {
					acuity.accessToken = tokenResponse.access_token;
				}

				acuity.request('me', function (err, res, me) {

					if (err) {
						reject(err);
						return console.error(err);
					}

					let accountResult = res.body;
					accountResult.accessToken = acuity.accessToken;

					resolve({userDetails: accountResult, accessToken: acuity.accessToken});
				});

			}).catch(function (err) {
				MyLog.error("Error:");
				MyLog.error(err);
				reject(err);
			});
		});
	}
}

module.exports = AcuitySchedulingLogic;