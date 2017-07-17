let Environments = {
	Local: {
		serverUrl: "http://localhost:3000",
		clientUrl: "http://localhost:63343/ZoiClient/#"
	},
	Dev: {
		serverUrl: "https://zoiai.com:3000",
		clientUrl: "http://zoiai.com/#/ZoiClient/#"
	},
	Ngrok: {
		serverUrl: "https://45e73634.ngrok.io",
		clientUrl: "http://localhost:63343/ZoiClient/#"
	}
};
let SELECTED_ENVIRONMENT = Environments.Ngrok;

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
		// "clientId": "0bsQgfUYYtTiwyoV",
		// "clientSecret": "PBljloalFuHEns1TjDvwbKkatyEWVlbjRYrnAJLl",
		"redirectUri": SELECTED_ENVIRONMENT.serverUrl + "/acuity/oauth2"
	}
};