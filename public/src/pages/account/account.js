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
				zoiUserId: function () {
					return getZoiUserId();
				},
				zoiUser: function ($http, $log, zoiUserId, zoiConfig, $timeout, $state) {
					return $http({
						url: zoiConfig.getServerUrl() + "/api/getUser",
						method: "GET",
						params: {
							userId: zoiUserId
						},
						timeout: 10000
					}).then(function (result) {
						return result.data;
					}, function (err) {
						$log.error(err);
						$timeout(function () {
							$state.go('404');
						});
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



















