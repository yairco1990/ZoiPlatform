/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.promotion-preview', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('promotion-preview', {
			url: '/promotion-preview?{userId}',
			controller: 'promotionPreviewCtrl as vm',
			templateUrl: 'src/pages/promotion-preview/promotion-preview.html',
			resolve: {
				zoiUser: function (zoiApi, $stateParams) {
					return zoiApi.getUser($stateParams.userId);
				}
			}
		})
	}]).controller('promotionPreviewCtrl', promotionPreviewCtrl);


/**
 * page constructor
 * @constructor
 */
function promotionPreviewCtrl($log, $rootScope, $timeout, $scope, $mdDialog, zoiUser, zoiApi, $window, zoiConfig, $stateParams) {

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
	vm.$stateParams = $stateParams;
}

/**
 *  init the page
 */
promotionPreviewCtrl.prototype.$onInit = function () {
	var vm = this;

	var selectedTemplate = vm.zoiUser.session.template;

	vm.isIntegratedWithAcuity = !!vm.zoiUser.integrations.Acuity;
	vm.contentTitle = selectedTemplate.promotionTitle;
	vm.selectedTitle = vm.contentTitle;
	vm.contentImage = selectedTemplate.image;
	vm.schedulingPageLink = vm.zoiUser.schedulingPageLink || "";

	vm.$log.debug("promotionPreviewCtrl initiated");
};


promotionPreviewCtrl.prototype.postIt = function (ev) {
	var vm = this;

	MyUtils.addLoader();

	vm.zoiApi.postPromotionOnFacebook({
		userId: vm.zoiUser._id,
		link: vm.schedulingPageLink,
		title: vm.selectedTitle,
		imageUrl: vm.contentImage
	}, ev).then(function () {
		//close the browser via messenger extension
		MyUtils.closeWebview();
	});
};