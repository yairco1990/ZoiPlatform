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
				zoiUserId: function () {
					return getZoiUserId();
				},
				zoiUser: function (zoiUserId, zoiApi) {
					return zoiApi.getUser(Number(zoiUserId));
				}
			}
		})
	}]).controller('promotionPreviewCtrl', promotionPreviewCtrl);


/**
 * page constructor
 * @constructor
 */
function promotionPreviewCtrl($log, $rootScope, $timeout, $scope, $mdDialog, zoiUser, zoiApi, $window, zoiConfig, $stateParams, $sce) {

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
	vm.$sce = $sce;
}

/**
 *  init the page
 */
promotionPreviewCtrl.prototype.$onInit = function () {
	var vm = this;

	vm.promotionType = vm.zoiUser.session.promotionType;

	if (vm.zoiUser.session.promotionType === 'facebook') {

		var selectedTemplate = vm.zoiUser.session.template;

		vm.isIntegratedWithAcuity = !!vm.zoiUser.integrations.Acuity;
		vm.contentTitle = selectedTemplate.promotionTitle;
		vm.selectedTitle = vm.contentTitle;
		vm.contentImage = selectedTemplate.image;
		vm.schedulingPageLink = vm.zoiUser.schedulingPageLink || "";

		vm.pageTitle = "Promotion Preview";
		vm.subHeaderText = "This is what I'm going to post on your facebook page. Change the post title if you want to.";
		vm.approveText = "Post Promotion!";
		vm.rejectText = "Don't Promote It";

	} else if (vm.zoiUser.session.promotionType === 'email') {
		vm.selectedEmailTemplate = vm.$sce.trustAsHtml(vm.zoiUser.session.emailTemplate);

		vm.pageTitle = "Email Preview";
		vm.subHeaderText = "This is what I'm going to send to your customers.";
		vm.approveText = "Send Emails!";
		vm.rejectText = "Don't Send Emails";
	}

	vm.$log.debug("promotionPreviewCtrl initiated");
};


promotionPreviewCtrl.prototype.sendAction = function (ev, isApproved) {
	var vm = this;

	MyUtils.addLoader();

	if (vm.promotionType === 'facebook') {
		vm.zoiApi.postPromotionOnFacebook({
			userId: vm.zoiUser._id,
			link: vm.schedulingPageLink,
			title: vm.selectedTitle,
			imageUrl: vm.contentImage,
			toPost: isApproved
		}, ev).then(function () {
			//close the browser via messenger extension
			MyUtils.closeWebview();
		});
	} else {
		vm.zoiApi.sendPromotionViaEmail({
			userId: vm.zoiUser._id,
			sendEmail: isApproved
		}, ev).then(function () {
			//close the browser via messenger extension
			MyUtils.closeWebview();
		});
	}
};