const CLIENT_DEV = "https://zoiai.com/p/#";
const CLIENT_LOCAL = "http://local.host:443/p/#";
const CLIENT_NGROK = "https://2fc4a7c1.ngrok.io/p/#";

const Environments = {
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
const selectedEnvironment = Environments.DEV;

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
	generalPromotionDeviation: 4,
	times: {
		oldCustomersIntervalTime: 1000 * 60 * 0.5,
		morningBriefIntervalTime: 1000 * 60 * 0.5,
		oneDay: 1000 * 60 * 60 * 24,
		clearOldConversationRange: 1000 * 60 * 60 * 4,
		oldCustomersForwardDays: 30,
		oldCustomersPreviousDays: 30,
		wishZoiWillDelay: 1000,
		firstIntegratedDelay: 6000,
		defaultMorningBriefHours: 9,
		defaultOldCustomersHours: 12
	}
};