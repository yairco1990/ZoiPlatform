let CLIENT_DEV = "http://zoiai.com/#";
let CLIENT_LOCAL = "http://local.host:63343/ZoiClient/#";

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
		serverUrl: "https://c871b6cd.ngrok.io",
		clientUrl: CLIENT_LOCAL
	}
};
let selectedEnvironment = Environments.Ngrok;

///////////////////////////////////////////////////////////////////////////////
module.exports = {
	serverUrl: selectedEnvironment.serverUrl,
	clientUrl: selectedEnvironment.clientUrl,
	AWS: {
		key: 'AKIAIH4A77U64F5NNU6Q',
		secret: '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',
		amazon: 'https://email.eu-west-1.amazonaws.com'
	},
	Acuity: {
		"clientId": "zyD9dntj6EnOQ0tH",
		"clientSecret": "mezlVskAfjoAJSy8iAGhh3FYOW3MvSEASBnlUGQE",
		// "clientId": "VyZtYYyz2be8VpZ6",
		// "clientSecret": "Au4oQ6mG9vSvRnbHRUEBWQ8YOdMw2ZRqkDUg5ehM",
		"redirectUri": Environments.Dev.serverUrl + "/acuity/oauth2"//TODO change it!
	},
	delayTime: 10
};