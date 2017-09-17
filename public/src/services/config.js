angular.module('Zoi.services.config', [])

	.service('zoiConfig', ['$log', '$location',
		function () {

			var ENVIRONMENTS = {
				NGROK: {
					url: "https://d064382c.ngrok.io"
				},
				LOCAL: {
					url: "http://localhost:443"
				},
				TEAMMATE: {
					url: "http://10.0.0.1:443"
				},
				DEV: {
					url: "https://dev.zoiai.com"
				},
				PRODUCTION: {
					url: "https://zoiai.com:443"
				}
			};

			var selectedEnvironment = ENVIRONMENTS.NGROK;

			return {
				getServerUrl: function () {
					return selectedEnvironment.url;
				}
			}
		}]
	);