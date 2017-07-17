const google = require("googleapis");
const ZoiConfig = require('../config');
const DBManager = require('../dal/DBManager');
const Util = require('util');
const rp = require('request-promise');
const batchUtils = require('google-api-batch-utils');
const createBatchBody = batchUtils.createBatchBody;
const parseBatchResponse = batchUtils.parseBatchResponse;

class GmailLogic {
	constructor() {
	}

	/**
	 * redirect the user to the permissions page
	 * @param userId
	 * @param callback
	 */
	static integrate(userId, callback) {
		//redirect the user to his integrations page
		callback(302, {'location': GmailLogic.getUrl(userId)});
	}

	/**
	 * get tokens
	 * @param userId
	 * @param code
	 * @param callback
	 */
	static getTokens(userId, code, callback) {
		Util.log(code);

		//get the auth object
		let oauth2Client = GmailLogic.getAuthObject(userId);

		//get tokens(access and refresh)
		oauth2Client.getToken(code, (err, tokens) => {
			if (err) {
				Util.log(err);
				callback(400, err);
				return;
			}
			Util.log(tokens);

			//get user
			DBManager.getUser({_id: userId}).then((user) => {

				//check integrations exist
				if (!user.integrations) {
					user.integrations = {};
				}
				user.integrations.Gmail = tokens;

				//save the user with the integrations
				DBManager.saveUser(user).then(() => {
					callback(302, {'location': ZoiConfig.clientUrl + '/main?facebookId=' + userId});
				});
				// oauth2Client.setCredentials(tokens);
				// res.send(tokens);
				// listMessages(oauth2Client);
				// getMessage(oauth2Client);
			});
		});
	}

	/**
	 * get the redirect url
	 * @param userId
	 * @returns {*}
	 */
	static getUrl(userId) {
		let oauth2Client = GmailLogic.getAuthObject(userId);
		// generate a url that asks permissions for Google+ and Google Calendar scopes
		let scopes = [
			'https://www.googleapis.com/auth/gmail.modify'
		];
		return oauth2Client.generateAuthUrl({
			access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
			scope: scopes, // If you only need one scope you can pass it as string
			state: userId
		});
	}

	/**
	 * get auth object
	 * @param userId
	 */
	static getAuthObject() {
		let OAuth2 = google.auth.OAuth2;
		return new OAuth2("514803140347-utj3lmcijoj5flqo2i5c393m0gf8sq6r.apps.googleusercontent.com", "N7WGFdSUY02RqdhaEm-BbVia", "http://localhost:3000/gmail/oauthcallback");
	}

	/**
	 * get emails list
	 * @param tokens
	 * @param queryString
	 * @param userId
	 * @returns {Promise}
	 */
	static getEmailsList(tokens, queryString, userId) {

		return new Promise((resolve, reject) => {

			let oauthObject = GmailLogic.getAuthObject();
			oauthObject.setCredentials(tokens);
			let gmail = google.gmail('v1');
			gmail.users.messages.list({
				auth: oauthObject,
				q: queryString,
				userId: userId,
			}, function (err, response) {
				if (err) {
					Util.log('The API returned an error: ' + err);
					reject(err);
					return;
				}
				if (response.messages) {
					resolve(response.messages);
				} else {
					resolve([]);
				}
			})
		});
	}

	static getMessage(tokens, messageId, userId) {
		return new Promise((resolve, reject) => {

			let oauthObject = GmailLogic.getAuthObject();
			oauthObject.setCredentials(tokens);
			let gmail = google.gmail('v1');
			gmail.users.messages.get({
				auth: oauthObject,
				id: messageId,
				userId: userId
			}, function (err, response) {
				if (err) {
					console.log('The API returned an error: ' + err);
					reject(err);
					return;
				}
				let message = response;
				let headers = message.payload.headers;
				resolve({
					id: messageId,
					snippet: response.snippet,
					'Message-ID': GmailLogic.getByKey(headers, 'Message-ID'),
					from: GmailLogic.getByKey(headers, 'From'),
					date: GmailLogic.getByKey(headers, 'Date'),
					subject: GmailLogic.getByKey(headers, 'Subject')
				});
			})
		});
	}

	static getByKey(arr, name) {
		let value = null;
		arr.forEach(function (item) {
			if (item.name == name) {
				value = item.value;
				return;
			}
		});
		return value;
	}
}

module
	.exports = GmailLogic;