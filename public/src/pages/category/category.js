/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.category', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('category', {
			url: '/category?{userId}',
			controller: 'categoryCtrl as vm',
			templateUrl: 'src/pages/category/category.html',
			resolve: {
				zoiUser: function (zoiApi, $stateParams) {
					return zoiApi.getUser($stateParams.userId);
				}
			}
		})
	}]).controller('categoryCtrl', categoryCtrl);


/**
 * page constructor
 * @constructor
 */
function categoryCtrl($log, $rootScope, $timeout, $scope, $mdDialog, zoiUser, zoiApi, $window, zoiConfig) {

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

	vm.$log.debug("categoryCtrl loaded");
}

/**
 *  init the page
 */
categoryCtrl.prototype.$onInit = function () {
	var vm = this;

	vm.categories = ["All", "Beauty", "Fitness", "Spa & Massage", "Fashion", "Make Up", "Skin", "Hair Style", "Fragrance", "Nail", "Accessories", "Tech"];

	vm.zoiUser.category = vm.zoiUser.category || vm.categories[0];
};


categoryCtrl.prototype.saveUser = function (ev) {
	var vm = this;

	MyUtils.addLoader();

	vm.zoiApi.saveUser(vm.zoiUser, ev).then(function () {
		vm.$timeout(function () {
			MyUtils.closeWebview();
		}, 2000);
	});
};