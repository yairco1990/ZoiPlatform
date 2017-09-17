/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.scheduling-page-link', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('scheduling-page-link', {
			url: '/scheduling-page-link?{userId}',
			controller: 'schedulingPageLinkCtrl as vm',
			templateUrl: 'src/pages/scheduling-page-link/scheduling-page-link.html',
			resolve: {
				zoiUser: function (zoiApi, $stateParams) {
					return zoiApi.getUser($stateParams.userId);
				}
			}
		})
	}]).controller('schedulingPageLinkCtrl', schedulingPageLinkCtrl);


/**
 * page constructor
 * @constructor
 */
function schedulingPageLinkCtrl($log, $rootScope, $timeout, $scope, $mdDialog, zoiUser, zoiApi, $window, zoiConfig, $state, $stateParams) {

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
	vm.$state = $state;
	vm.$stateParams = $stateParams;

	vm.$log.info("schedulingPageLinkCtrl loaded");
}

/**
 * save user
 * @param ev
 */
schedulingPageLinkCtrl.prototype.saveUser = function (ev) {
	var vm = this;

	if (vm.schedulingPageLinkForm.$valid) {

		MyUtils.addLoader();

		vm.zoiApi.saveUser(vm.zoiUser, ev).then(function () {
			MyUtils.removeLoader();

			vm.$state.go('settings', {userId: vm.$stateParams.userId});
		});

	}
};