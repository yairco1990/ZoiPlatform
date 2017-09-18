const google = require("googleapis");
const ZoiConfig = require('../config');
const DBManager = require('../dal/DBManager');
const MyLog = require('../interfaces/MyLog');
const MyUtils = require('../interfaces/utils');
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
		DBManager.getUser({_id: userId}).then(function (user) {
			if (user && user._id) {
				//redirect the user to his integrations page
				let authUrl = GmailLogic.getUrl(userId);
				if (!user.integrations.Gmail || !user.integrations.Gmail.refresh_token) {
					authUrl += "&prompt=consent";
				}
				callback(302, {'location': authUrl});
			}
		}).catch(MyUtils.getErrorMsg);
	}

	/**
	 * get tokens
	 * @param userId
	 * @param code
	 * @param callback
	 */
	static getTokens(userId, code, callback) {

		//get the auth object
		let oauth2Client = GmailLogic.getAuthObject(userId);

		//get tokens(access and refresh)
		oauth2Client.getToken(code, (err, tokens) => {
			if (err) {
				MyLog.error(err);
				callback(400, err);
				return;
			}
			MyLog.info("Got Gmail tokens");

			//get user
			DBManager.getUser({_id: userId}).then((user) => {

				//if there is no integration with gmail before
				if (!user.integrations.Gmail) {
					user.integrations.Gmail = tokens;
				} else {
					user.integrations.Gmail.access_token = tokens.access_token;
					user.integrations.Gmail.token_type = tokens.token_type;
					user.integrations.Gmail.expiry_date = tokens.expiry_date;
					user.integrations.Gmail.refresh_token = tokens.refresh_token || user.integrations.Gmail.refresh_token;
				}

				//save the user with the integrations
				DBManager.saveUser(user).then(() => {
					callback(302, {'location': `${ZoiConfig.clientUrl}/integrations?userId=${userId}&closeWindow=true&skipExtension=true`});
				});
				// oauth2Client.setCredentials(tokens);
				// res.send(tokens);
				// listMessages(oauth2Client);
				// getMessage(oauth2Client);
			}).catch(MyUtils.getErrorMsg);
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
		return new OAuth2("514803140347-utj3lmcijoj5flqo2i5c393m0gf8sq6r.apps.googleusercontent.com", "N7WGFdSUY02RqdhaEm-BbVia", ZoiConfig.GOOGLE_AUTH_REDIRECT);
	}

	/**
	 * get emails list
	 * @param tokens
	 * @param queryString
	 * @param userId
	 * @param user
	 * @returns {Promise}
	 */
	static getEmailsList(tokens, queryString, userId, user) {

		return new Promise((resolve, reject) => {

			const getEmails = function () {

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
					MyLog.info("Successfully got the user's emails");
				});
			};

			//check token expiration date()
			if (tokens.expiry_date - (60 * 1000) > new Date().valueOf()) {
				getEmails();
			} else {
				//renew the access token
				let oauthObject = GmailLogic.getAuthObject();
				oauthObject.setCredentials(tokens);
				oauthObject.refreshAccessToken(function (err, tokens) {
					if (err) {
						console.error(err);
						reject(err);
						return;
					}
					user.integrations.Gmail.access_token = tokens.access_token;
					user.integrations.Gmail.token_type = tokens.token_type;
					user.integrations.Gmail.expiry_date = tokens.expiry_date;
					user.integrations.Gmail.refresh_token = tokens.refresh_token || user.integrations.Gmail.refresh_token;

					DBManager.saveUser(user).then(function () {
						getEmails();
					});
				});
			}

		});
	}

	static getByKey(arr, name) {
		let value = null;
		arr.forEach(function (item) {
			if (item.name === name) {
				value = item.value;
			}
		});
		return value;
	}
}

module
	.exports = GmailLogic;