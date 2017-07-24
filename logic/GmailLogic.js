const google = require("googleapis");
const ZoiConfig = require('../config');
const DBManager = require('../dal/DBManager');
const Util = require('util');
const rp = require('request-promise');
const batchUtils = require('google-api-batch-utils');
const createBatchBody = batchUtils.createBatchBody;
const parseBatchResponse = batchUtils.parseBatchResponse;
const _h = require('highland');
const GmailBatchStream = require('gmail-batch-stream');

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

				user.integrations.Gmail = tokens;

				//save the user with the integrations
				DBManager.saveUser(user).then(() => {
					callback(302, {'location': ZoiConfig.clientUrl + '/integrations?userId=' + userId});
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
		//TODO change the localhost to zoiai.com after review in google
		// http://192.168.43.233.xip.io:3000/gmail/oauthcallback
		// http://localhost:3000/gmail/oauthcallback
		return new OAuth2("514803140347-utj3lmcijoj5flqo2i5c393m0gf8sq6r.apps.googleusercontent.com", "N7WGFdSUY02RqdhaEm-BbVia", ZoiConfig.serverUrl + "/gmail/oauthcallback");
	}

	/**
	 * get emails list
	 * @param tokens
	 * @param queryString
	 * @param userId
	 * @returns {Promise}
	 */
	static getEmailsList(tokens, queryString, userId) {
		//TODO handle with expiration token
		return new Promise((resolve, reject) => {

			let oauthObject = GmailLogic.getAuthObject();
			oauthObject.setCredentials(tokens);

			//check token expiration date
			if (tokens.expiry_date > new Date().valueOf()) {
				let GBS = new GmailBatchStream(tokens.access_token);
				const gmailGBS = GBS.gmail();
				const messageIdStream = _h([gmailGBS.users.messages.list({userId: userId, q: queryString})])
					.pipe(GBS.pipeline(1, 5))
					.pluck('messages')
					.sequence()
					.pluck('id');

				let messages = [];

				messageIdStream
					.map(messageId => gmailGBS.users.messages.get({userId: 'me', id: messageId, format: 'metadata'}))
					.pipe(GBS.pipeline(100, 5)) //Run in batches of 100. Use quota of 5 (for users.messages.get).
					// .tap( _h.log )
					.each(function (message) {
						let headers = message.payload.headers;
						messages.push({
							id: message.id,
							snippet: message.snippet,
							'Message-ID': GmailLogic.getByKey(headers, 'Message-ID'),
							from: GmailLogic.getByKey(headers, 'From'),
							date: GmailLogic.getByKey(headers, 'Date'),
							subject: GmailLogic.getByKey(headers, 'Subject')
						});
					}).done(() => {
					resolve(messages);
				});
			} else {
				reject("TOKEN_EXPIRED");
			}

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