const fs = require('fs');
const Util = require('util');
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

				if (err) {
					reject(err);
					return console.error(err);
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
					reject(err);
					return console.error(err);
				}

				resolve(body);
			});
		});
	}

	scheduleAppointment(options) {
		let self = this;

		return new Promise((resolve, reject) => {

			self.acuity.request('appointments?admin=true', options, function (err, res, body) {

				if (err || body.error) {
					reject(err || body.error);
					return console.error(err);
				}

				resolve(body);
			});
		});
	}

	getAppointmentTypes() {
		let self = this;

		return new Promise((resolve, reject) => {

			self.acuity.request('appointment-types', function (err, res, body) {

				if (err) {
					reject(err);
					return console.error(err);
				}

				resolve(body);
			});
		});
	}

	getCoupons() {
		let self = this;

		return new Promise((resolve, reject) => {

			self.acuity.request('coupons', function (err, res, body) {

				if (err) {
					reject(err);
					return console.error(err);
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
				Util.log("Error:");
				Util.log(err);
				reject(err);
			});
		});
	}
}

module.exports = AcuitySchedulingLogic;