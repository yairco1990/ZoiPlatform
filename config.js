let CLIENT_DEV = "https://zoiai.com/p/#";
let CLIENT_LOCAL = "http://local.host:443/p/#";
let CLIENT_NGROK = "https://2fc4a7c1.ngrok.io/p/#";

let Environments = {
	LOCAL: {
		serverUrl: "http://localhost:3000",
		clientUrl: CLIENT_LOCAL
	},
	DEV: {
		serverUrl: "https://zoiai.com:3000",
		clientUrl: CLIENT_DEV
	},
	NGROK: {
		serverUrl: "https://2fc4a7c1.ngrok.io",
		clientUrl: CLIENT_NGROK
	}
};
let selectedEnvironment = Environments.DEV;

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
		"redirectUri": "https://zoiai.com:3000/acuity/oauth2"//TODO change it!
	},
	delayTime: 10,
	oldCustomersIntervalTime: 1000 * 60 * 60 * 24,
	morningBriefIntervalTime: 1000 * 60 * 5,
	oneDay: 1000 * 60 * 60 * 24
};