angular.module('Zoi.services.zoi-api', [])

	.service('zoiApi', function ($log, $http, zoiConfig) {

		return {
			/**
			 * save user
			 * @param user
			 * @returns {*}
			 */
			saveUser: function (user) {
				return $http({
					url: zoiConfig.getServerUrl() + "/api/saveUser",
					method: "POST",
					params: {
						user: user
					},
					timeout: 10000
				}).then(function (result) {
					return result.data;
				});
			}
		}

	});