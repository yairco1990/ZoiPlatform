angular.module('Zoi.services.config', [])

	.service('zoiConfig', ['$log', '$location',
		function ($log, $window) {

			var ENVIRONMENTS = {
				NGROK: {
					url: "https://c871b6cd.ngrok.io"
				},
				LOCAL: {
					url: "http://localhost:3000"
				},
				DEV: {
					url: "https://zoiai.com:3000"
				}
			};

			var selectedEnvironment = ENVIRONMENTS.DEV;

			return {
				getServerUrl: function () {
					return selectedEnvironment.url;
				}
			}
		}]
	);