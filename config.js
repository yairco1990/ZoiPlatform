// const CLIENT_DEV = "https://zoiai.com/p/#";
const CLIENT_PROD = "https://zoiai.com/p/#";
const CLIENT_LOCAL = "http://local.host:443/p/#";
const CLIENT_NGROK = "https://2fc4a7c1.ngrok.io/p/#";

const DEV_BOT_DETAILS = {
	token: "EAAFGPKITtcEBAEoxVuLcraZCX6Ip22dKaBFxQ6Kmz8XBC96VMR43edopkuDc7tXPA4FKtzOBavmG6d9StvKGZCc64vAKTmOphZBdthhgp8ClAZCLXRvijEY9MJqPMFzAVZCcaxlDZAXjkmSOJYJ08gCcwoSnIGZB3ZBCiZCNVXNm6xgZDZD",
	verify: "testtoken",
	app_secret: "1b27655a518d7d7ee75312074afabe09"
};

const PRODUCTION_BOT_DETAILS = {
	token: "EAATS43ZAMkJQBANoXinzXRjPuZC0525CMDtesm8yIdYdBTt9IKftGgyQTfEBlONO04m08CkI4rU2Fv9tPQQmn7wD2m5GMUIUxPKG2u1ZCH3eYJZBFQNH2EeZCL8YSg4RCO5qgIK6roZCfnjaseNCDBBGszIj40AlYjMZCkgxMOzMQZDZD",
	verify: "testtoken",
	app_secret: "1b27655a518d7d7ee75312074afabe09"
};

const ACUITY_OAUTH_DEV = {
	"clientId": "2aSb6hOLkXZu0CEs",
	"clientSecret": "rDrarobUWzAc953F3AqizKBtqwfloYlXSRIhX5XF",
	"redirectUri": "http://localhost:3000/acuity/oauth2"
};

const ACUITY_OAUTH_PRODUCTION = {
	"clientId": "zyD9dntj6EnOQ0tH",
	"clientSecret": "mezlVskAfjoAJSy8iAGhh3FYOW3MvSEASBnlUGQE",
	"redirectUri": "https://zoiai.com:3000/acuity/oauth2"
};

const Environments = {
	LOCAL: {
		serverUrl: "http://localhost:3000",
		clientUrl: CLIENT_LOCAL,
		mongoUrl: "mongodb://zoiAdmin:GoTime2015!@ds133192.mlab.com:33192/zoi_db",
		NLP_URL: "http://52.177.185.253:5000",
		GOOGLE_AUTH_REDIRECT: "http://localhost:3000/gmail/oauthcallback",
		BOT_DETAILS: DEV_BOT_DETAILS,
		ACUITY_OAUTH: ACUITY_OAUTH_DEV
	},
	NGROK: {
		serverUrl: "https://2fc4a7c1.ngrok.io",
		clientUrl: CLIENT_NGROK,
		mongoUrl: "mongodb://zoiAdmin:GoTime2015!@ds133192.mlab.com:33192/zoi_db",
		NLP_URL: "http://13.82.50.249:5000",
		GOOGLE_AUTH_REDIRECT: "http://localhost:3000/gmail/oauthcallback",
		BOT_DETAILS: DEV_BOT_DETAILS,
		ACUITY_OAUTH: ACUITY_OAUTH_DEV
	},
	// DEV: {
	// 	serverUrl: "https://zoiai.com:3000",
	// 	clientUrl: CLIENT_DEV,
	// 	mongoUrl: "mongodb://zoiAdmin:GoTime2015!@ds133192.mlab.com:33192/zoi_db",
	// 	NLP_URL: "http://52.177.185.253:5000",
	// 	BOT_DETAILS: DEV_BOT_DETAILS
	// },
	/**************PRODUCTION****************/
	PRODUCTION: {
		serverUrl: "https://zoiai.com:3000",
		clientUrl: CLIENT_PROD,
		mongoUrl: "mongodb://localhost:27017/zoi_db",
		NLP_URL: "http://13.82.50.249:5000",
		GOOGLE_AUTH_REDIRECT: "https://zoiai.com:3000/gmail/oauthcallback",
		BOT_DETAILS: PRODUCTION_BOT_DETAILS,
		ACUITY_OAUTH: ACUITY_OAUTH_PRODUCTION
	}
	/**************PRODUCTION****************/
};

///////////////////////////////////////////////////////////////////////////////
const selectedEnvironment = Environments.NGROK;
///////////////////////////////////////////////////////////////////////////////
module.exports = {
	serverUrl: selectedEnvironment.serverUrl,
	clientUrl: selectedEnvironment.clientUrl,
	mongoUrl: selectedEnvironment.mongoUrl,
	nlpUrl: selectedEnvironment.NLP_URL,
	BOT_DETAILS: selectedEnvironment.BOT_DETAILS,
	Acuity: selectedEnvironment.ACUITY_OAUTH,
	adminToken: "zoiIsTheBestInTheWorld",
	GOOGLE_AUTH_REDIRECT: selectedEnvironment.GOOGLE_AUTH_REDIRECT,
	AWS: {
		key: 'AKIAIH4A77U64F5NNU6Q',
		secret: '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',
		amazon: 'https://email.eu-west-1.amazonaws.com'
	},
	delayTime: 1,
	generalPromotionDeviation: 4,
	times: {
		oldCustomersIntervalTime: 1000 * 60 * 2,
		morningBriefIntervalTime: 1000 * 60 * 2,
		oneDay: 1000 * 60 * 60 * 24,
		clearOldConversationRange: 1000 * 60 * 60 * 4,
		oldCustomersForwardDays: 30,
		oldCustomersPreviousDays: 30,
		wishZoiWillDelay: 2000,
		firstIntegratedDelay: 6000,
		defaultMorningBriefHours: 9,
		defaultOldCustomersHours: 12
	},
	writeDebug: true,
	writeErrors: true,
	writeInfo: true
};