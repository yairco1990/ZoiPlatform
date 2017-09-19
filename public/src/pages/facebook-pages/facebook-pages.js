/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.facebook-pages', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('facebook-pages', {
			url: '/facebook-pages?{userId}',
			controller: 'FacebookPagesCtrl as vm',
			templateUrl: 'src/pages/facebook-pages/facebook-pages.html',
			resolve: {
				zoiUser: function ($stateParams, zoiApi) {
					return zoiApi.getUser(Number($stateParams.userId));
				},
			}
		})
	}]).controller('FacebookPagesCtrl', FacebookPagesCtrl);


/**
 * page constructor
 * @constructor
 */
function FacebookPagesCtrl($log, $rootScope, $timeout, zoiApi, zoiUser, $mdDialog) {

	var vm = this;

	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;
	vm.zoiApi = zoiApi;
	vm.zoiUser = zoiUser;
	vm.$mdDialog = $mdDialog;

	vm.$log.info("FacebookPagesCtrl loaded");
}

/**
 *  init the page
 */
FacebookPagesCtrl.prototype.saveUser = function (ev) {
	var vm = this;

	MyUtils.addLoader();

	vm.zoiApi.saveUser(vm.zoiUser, ev).then(function () {
		vm.$timeout(function () {
			MyUtils.closeWebview();
		}, 2000);
	});
};


















