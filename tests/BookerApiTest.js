const request = require('request-promise');
const MyLog = require('../interfaces/MyLog');

//
const subscriptionCode = "74dfed7a445e4561a5cd4f12bfb16c70";
const grantType = "client_credentials";
const clientId = "CVwkWviKzOkk";
const clientSecret = "SYB6F0KxuJPi";
const scope = "customer";

describe.only("Booker Api Test", function () {

	let accessToken;

	it("get availability", async function () {
		try {
			accessToken = await getToken();

			console.log(accessToken);
		} catch (err) {
			console.error(err);
		}
	});
});

function getToken() {

	return new Promise((resolve, reject) => {
		request({
			method: "POST",
			uri: "https://api-staging.booker.com/v5/auth/connect/token",
			form: {
				grant_type: grantType,
				client_id: clientId,
				client_secret: clientSecret,
				scope: scope
			},
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Ocp-Apim-Subscription-Key': subscriptionCode
			}
		}).then(function (result) {
			result = JSON.parse(result);
			resolve(`Bearer ${result.access_token}`);
		}).catch(function (err) {
			console.log(err);
			reject(err);
		});
	});
}

function getLocations() {

	return new Promise((resolve, reject) => {
		request({
			method: "POST",
			uri: "https://api-staging.booker.com/v5/auth/connect/token",
			form: {
				grant_type: grantType,
				client_id: clientId,
				client_secret: clientSecret,
				scope: scope
			},
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Ocp-Apim-Subscription-Key': subscriptionCode
			}
		}).then(function (result) {
			result = JSON.parse(result);
			resolve(`Bearer ${result.access_token}`);
		}).catch(function (err) {
			console.log(err);
			reject(err);
		});
	});
}