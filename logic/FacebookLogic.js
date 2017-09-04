const graph = require('fbgraph');
const ZoiConfig = require('../config');
const DBManager = require('../dal/DBManager');
const MyLog = require('../interfaces/MyLog');
const MyUtils = require('../interfaces/utils');
const request = require('request');
const fs = require('fs');

class FacebookLogic {

	/**
	 * add facebook integration to the user object
	 * @param userId
	 * @param authResponse
	 * @param callback
	 */
	static async addFacebookIntegration(userId, authResponse, callback) {

		try {

			//get long token
			const longTermAuth = await FacebookLogic.extendAccessToken(authResponse.accessToken);

			//get the user
			const user = await DBManager.getUserById(userId);

			//set the facebook integration to the user
			user.integrations.Facebook = longTermAuth;

			//get pages details
			const pagesResult = await MyUtils.makeRequest("GET", MyUtils.addParamsToUrl("https://graph.facebook.com/me/accounts", {access_token: authResponse.accessToken}));
			user.integrations.Facebook.pages = pagesResult.data;

			//save user
			await DBManager.saveUser(user);

			callback(200, {message: "integrated successfully with Facebook"});

		} catch (err) {
			MyLog.error("Failed to integrate with Facebook", err);
		}
	}

	/**
	 * post on facebook page
	 * @param pageId
	 * @param accessToken
	 * @param message
	 * @param imageUrl
	 */
	static async postOnFacebookPage(pageId, accessToken, message, imageUrl) {

		try {

			function uploadImage(message, imageUrl) {
				return new Promise(async (resolve, reject) => {
					request({
						method: 'POST',
						url: `https://graph.facebook.com/v2.9/${pageId}/photos`,
						formData: {
							access_token: accessToken,
							message: message,
							url: imageUrl
						}
					}, function (err, response, body) {
						if (err) {
							return reject(err);
						}
						body = JSON.parse(body);
						resolve(body);
					});
				});
			}

			const imageUploadResult = await uploadImage(message, imageUrl);

			return imageUploadResult;

			// function post(payload) {
			// 	return new Promise((resolve, reject) => {
			// 		graph.post(`${pageId}/feed?access_token=${accessToken}`, payload, function (err, res) {
			// 			if (err) {
			// 				console.error(err);
			// 				return reject(err);
			// 			}
			// 			// returns the post id
			// 			MyLog.log(res);
			// 			resolve(res);
			// 		});
			// 	});
			// }

			// let payload = {
			// 	message: messageContent
			// };
			//
			// if (imageUrl) {
			// 	const imageUploadResult = await uploadImage(imageUrl);
			//
			// 	payload.object_attachment = imageUploadResult.id;
			// }
			//
			// await post(payload);
		} catch (err) {
			MyLog.error("Failed to integrate with Facebook", err);
		}

	}

	/**
	 * extend the access token
	 * @param accessToken
	 * @returns {Promise}
	 */
	static extendAccessToken(accessToken) {
		return new Promise((resolve, reject) => {
			graph.extendAccessToken({
				"access_token": accessToken,
				"client_id": ZoiConfig.appId,
				"client_secret": ZoiConfig.appSecret
			}, function (err, facebookResponse) {
				if (err) {
					return reject(err);
				}
				resolve(facebookResponse);
			});
		});
	}
}

module.exports = FacebookLogic;