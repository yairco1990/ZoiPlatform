angular.module('Zoi.services.config', [])

	.service('zoiConfig', ['$log', '$location',
		function ($log, $window) {

			var ENVIRONMENTS = {
				NGROK: {
					url: "https://2fc4a7c1.ngrok.io"
				},
				LOCAL: {
					url: "http://localhost:3000"
				},
				DEV: {
					url: "https://bdd1bb96.ngrok.io"
				},
				PRODUCTION: {
					url: "https://zoiai.com:3000"
				}
			};

			var selectedEnvironment = ENVIRONMENTS.LOCAL;

			return {
				getServerUrl: function () {
					return selectedEnvironment.url;
				}
			}
		}]
	);