/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.keywords', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('keywords', {
			url: '/keywords?{userId}',
			controller: 'keywordsCtrl as vm',
			templateUrl: 'src/pages/keywords/keywords.html',
			resolve: {
				zoiUserId: function () {
					return getZoiUserId();
				},
				zoiUser: function (zoiUserId, zoiApi) {
					return zoiApi.getUser(Number(zoiUserId));
				},
			}
		})
	}]).controller('keywordsCtrl', keywordsCtrl);


/**
 * page constructor
 * @constructor
 */
function keywordsCtrl($log, $rootScope, $timeout, $scope, $mdDialog, zoiUser, zoiApi, $window, zoiConfig) {

	var vm = this;

	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;
	vm.$scope = $scope;
	vm.$mdDialog = $mdDialog;
	vm.zoiUser = zoiUser;
	vm.zoiApi = zoiApi;
	vm.$window = $window;
	vm.zoiConfig = zoiConfig;

	vm.$log.debug("keywordsCtrl loaded");
}

keywordsCtrl.prototype.saveUser = function (ev) {
	var vm = this;

	MyUtils.addLoader();

	vm.zoiApi.saveUser(vm.zoiUser, ev).then(function () {
		vm.$timeout(function () {
			MyUtils.closeWebview();
		}, 2000);
	});
};