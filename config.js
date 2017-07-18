let CLIENT_DEV = "http://zoiai.com/#";
let CLIENT_LOCAL = "http://localhost:63343/ZoiClient/#";

let Environments = {
	Local: {
		serverUrl: "http://localhost:3000",
		clientUrl: CLIENT_LOCAL
	},
	Dev: {
		serverUrl: "https://zoiai.com:3000",
		clientUrl: CLIENT_DEV
	},
	Ngrok: {
		serverUrl: "https://45e73634.ngrok.io",
		clientUrl: CLIENT_DEV
	}
};
let SELECTED_ENVIRONMENT = Environments.Dev;

module.exports = {
	serverUrl: SELECTED_ENVIRONMENT.serverUrl,
	clientUrl: SELECTED_ENVIRONMENT.clientUrl,
	AWS: {
		key: 'AKIAIH4A77U64F5NNU6Q',
		secret: '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',
		amazon: 'https://email.eu-west-1.amazonaws.com'
	},
	Acuity: {
		"clientId": "zyD9dntj6EnOQ0tH",
		"clientSecret": "mezlVskAfjoAJSy8iAGhh3FYOW3MvSEASBnlUGQE",
		"redirectUri": SELECTED_ENVIRONMENT.serverUrl + "/acuity/oauth2"
	}
};