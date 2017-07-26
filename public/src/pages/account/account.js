/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.account', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('account', {
			url: '/account?{userId}',
			controller: 'AccountCtrl as vm',
			templateUrl: 'src/pages/account/account.html',
			resolve: {
				zoiUser: function ($http, $log, $stateParams, zoiConfig) {
					return $http({
						url: zoiConfig.getServerUrl() + "/api/getUser",
						method: "GET",
						params: {
							userId: $stateParams.userId
						},
						timeout: 10000
					}).then(function (result) {
						return result.data;
					}, function (err) {
						$log.error(err.data);
						return err.data;
					});
				}
			}
		})
	}]).controller('AccountCtrl', AccountCtrl);


/**
 * page constructor
 * @constructor
 */
function AccountCtrl($log, $rootScope, $timeout, zoiUser) {

	var vm = this;

	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;
	vm.zoiUser = zoiUser;

	vm.$log.info("AccountCtrl loaded");
}

/**
 *  init the page
 */
AccountCtrl.prototype.$onInit = function () {
	var vm = this;
	if (vm.zoiUser != "NO_SUCH_USER") {

	} else {
		vm.zoiUser = null;
	}
};



















