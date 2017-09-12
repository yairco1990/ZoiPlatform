angular.module('Zoi.services.config', [])

	.service('zoiConfig', ['$log', '$location',
		function ($log, $window) {

			var ENVIRONMENTS = {
				NGROK: {
					url: "https://32a85937.ngrok.io"
				},
				LOCAL: {
					url: "http://localhost:443"
				},
				TEAMMATE: {
					url: "http://10.0.0.1:443"
				},
				DEV: {
					url: "https://dev.zoiai.com:443"
				},
				PRODUCTION: {
					url: "https://zoiai.com:443"
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