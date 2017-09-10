const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

const DEV_BOT_DETAILS = {
	token: "EAAFGPKITtcEBAMuIYkHh0eF3w90PydT4pxM8NZBAMcuo2JypFiP7fbeUACZAhi9scZAHdonZBgpSv8aPWKdqMBZCdQBv03BGOiVaiRad2Yx0tZCnJxsuHljEW9ZBI3wqiqLjHp2kIsb2FKHKweMwl9yLj7qEcMyhRlVBETAzqnHEAZDZD",
	verify: "testtoken",
	app_secret: "364a4ac6971784586eb91066e04d0c80"
};

//////////////////////START PRODUCTION//////////////////////////
const PRODUCTION_BOT_DETAILS = {
	token: "EAATS43ZAMkJQBANoXinzXRjPuZC0525CMDtesm8yIdYdBTt9IKftGgyQTfEBlONO04m08CkI4rU2Fv9tPQQmn7wD2m5GMUIUxPKG2u1ZCH3eYJZBFQNH2EeZCL8YSg4RCO5qgIK6roZCfnjaseNCDBBGszIj40AlYjMZCkgxMOzMQZDZD",
	verify: "40NCkrPUPaALsV4NJz",
	app_secret: "1b27655a518d7d7ee75312074afabe09"
};
///////////////////////END PRODUCTION///////////////////////////

const Environments = {
	LOCAL: {
		appId: "358701207893441",
		appSecret: "364a4ac6971784586eb91066e04d0c80",
		serverUrl: "http://localhost:3000",
		clientUrl: "http://localhost:443/p/#",
		mongoUrl: "mongodb://localhost:27017/zoidev_db",
		NLP_URL: "http://13.82.50.249:5000",
		ELASTIC_URL: "http://52.174.244.154:9200",
		GOOGLE_AUTH_REDIRECT: "http://localhost:3000/gmail/oauthcallback",
		BOT_DETAILS: DEV_BOT_DETAILS,
		ACUITY_OAUTH: {
			"clientId": "GudNczB4yE1zF6I3",
			"clientSecret": "pc47AU2Tjz9V7DmGZRMDEGyuLPpqlqUmjR4hKu5b",
			"redirectUri": "http://localhost:3000/acuity/oauth2"
		},
		adminToken: "zoiIsTheBestInTheWorld",
		isProduction: false,
		delayTime: 1,
		generalPromotionDeviation: 2,
		writeDebug: false,
		writeErrors: false,
		writeInfo: false,
		times: {
			oldCustomersIntervalTime: ONE_MINUTE * 2,
			morningBriefIntervalTime: ONE_MINUTE * 2,
			oldConversationIntervalTime: ONE_MINUTE * 2,
			oneDay: ONE_DAY,
			clearOldConversationRange: ONE_MINUTE * 30,
			oldCustomersForwardDays: 30,
			oldCustomersPreviousDays: 30,
			wishZoiWillDelay: 1,
			firstIntegratedDelay: ONE_SECOND * 6,
			defaultMorningBriefHours: 9,
			defaultOldCustomersHours: 12
		},
		AWS: {
			key: 'AKIAIH4A77U64F5NNU6Q',
			secret: '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',
			amazon: 'https://email.eu-west-1.amazonaws.com'
		}
	},
	NGROK: {
		appId: "358701207893441",
		serverUrl: "https://32a85937.ngrok.io",
		clientUrl: "https://32a85937.ngrok.io/p/#",
		mongoUrl: "mongodb://localhost:27017/zoidev_db",
		NLP_URL: "http://13.82.50.249:5000",
		ELASTIC_URL: "http://52.174.244.154:9200",
		GOOGLE_AUTH_REDIRECT: "http://localhost:3000/gmail/oauthcallback",
		BOT_DETAILS: DEV_BOT_DETAILS,
		ACUITY_OAUTH: {
			"clientId": "GudNczB4yE1zF6I3",
			"clientSecret": "pc47AU2Tjz9V7DmGZRMDEGyuLPpqlqUmjR4hKu5b",
			"redirectUri": "http://localhost:3000/acuity/oauth2"
		},
		adminToken: "zoiIsTheBestInTheWorld",
		isProduction: false,
		delayTime: 1,
		generalPromotionDeviation: 2,
		writeDebug: true,
		writeErrors: true,
		writeInfo: true,
		times: {
			oldCustomersIntervalTime: ONE_MINUTE * 2,
			morningBriefIntervalTime: ONE_MINUTE * 2,
			oldConversationIntervalTime: ONE_MINUTE * 2,
			oneDay: ONE_DAY,
			clearOldConversationRange: ONE_MINUTE,
			oldCustomersForwardDays: 30,
			oldCustomersPreviousDays: 30,
			wishZoiWillDelay: 1,
			firstIntegratedDelay: ONE_SECOND * 6,
			defaultMorningBriefHours: 9,
			defaultOldCustomersHours: 12
		},
		AWS: {
			key: 'AKIAIH4A77U64F5NNU6Q',
			secret: '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',
			amazon: 'https://email.eu-west-1.amazonaws.com'
		}
	},
	DEV: {
		appId: "358701207893441",
		serverUrl: "https://dev.zoiai.com:3000",
		clientUrl: "https://dev.zoiai.com:3000/p/#",
		mongoUrl: "mongodb://localhost:27017/zoidev_db",
		NLP_URL: "http://13.82.50.249:5000",
		ELASTIC_URL: "http://localhost:9200",
		GOOGLE_AUTH_REDIRECT: "https://zoiai.com:3000/gmail/oauthcallback",
		BOT_DETAILS: DEV_BOT_DETAILS,
		ACUITY_OAUTH: {
			"clientId": "GudNczB4yE1zF6I3",
			"clientSecret": "pc47AU2Tjz9V7DmGZRMDEGyuLPpqlqUmjR4hKu5b",
			"redirectUri": "http://52.174.244.154:3000/acuity/oauth2"
		},
		adminToken: "zoiIsTheBestInTheWorld",
		isProduction: false,
		delayTime: 1,
		generalPromotionDeviation: 2,
		writeDebug: true,
		writeErrors: true,
		writeInfo: true,
		times: {
			oldCustomersIntervalTime: ONE_MINUTE * 2,
			morningBriefIntervalTime: ONE_MINUTE * 2,
			oldConversationIntervalTime: ONE_MINUTE * 2,
			oneDay: ONE_DAY,
			clearOldConversationRange: ONE_HOUR * 4,
			oldCustomersForwardDays: 30,
			oldCustomersPreviousDays: 30,
			wishZoiWillDelay: 1,
			firstIntegratedDelay: ONE_SECOND * 6,
			defaultMorningBriefHours: 9,
			defaultOldCustomersHours: 12
		},
		AWS: {
			key: 'AKIAIH4A77U64F5NNU6Q',
			secret: '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',
			amazon: 'https://email.eu-west-1.amazonaws.com'
		}
	},
	/**************PRODUCTION****************/
	PRODUCTION: {
		appId: "1357774290981012",
		serverUrl: "https://zoiai.com:3000",
		clientUrl: "https://zoiai.com/p/#",
		mongoUrl: "mongodb://localhost:27017/zoi_db",
		NLP_URL: "http://13.82.50.249:5000",
		ELASTIC_URL: "http://localhost:9200",
		GOOGLE_AUTH_REDIRECT: "https://zoiai.com:3000/gmail/oauthcallback",
		BOT_DETAILS: PRODUCTION_BOT_DETAILS,
		ACUITY_OAUTH: {
			"clientId": "zyD9dntj6EnOQ0tH",
			"clientSecret": "mezlVskAfjoAJSy8iAGhh3FYOW3MvSEASBnlUGQE",
			"redirectUri": "https://zoiai.com:3000/acuity/oauth2"
		},
		adminToken: "zoiIsTheBestInTheWorld",
		isProduction: true,
		delayTime: ONE_SECOND * 2.5,
		generalPromotionDeviation: 3,
		writeDebug: true,
		writeErrors: true,
		writeInfo: true,
		times: {
			oldCustomersIntervalTime: ONE_MINUTE * 3,
			morningBriefIntervalTime: ONE_MINUTE * 3,
			oldConversationIntervalTime: ONE_MINUTE * 3,
			oneDay: ONE_DAY,
			clearOldConversationRange: ONE_HOUR * 4,
			oldCustomersForwardDays: 30,
			oldCustomersPreviousDays: 30,
			wishZoiWillDelay: ONE_SECOND,
			firstIntegratedDelay: ONE_SECOND * 6,
			defaultMorningBriefHours: 9,
			defaultOldCustomersHours: 12
		},
		AWS: {
			key: 'AKIAIH4A77U64F5NNU6Q',
			secret: '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',
			amazon: 'https://email.eu-west-1.amazonaws.com'
		}
	}
	/**************PRODUCTION****************/
};

///////////////////////////////////////////////////////////////////////////////
const selectedEnvironment = Environments.DEV;
module.exports = selectedEnvironment;
///////////////////////////////////////////////////////////////////////////////
