/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.content-preview', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('content-preview', {
			url: '/content-preview?{userId}',
			controller: 'contentPreviewCtrl as vm',
			templateUrl: 'src/pages/content-preview/content-preview.html',
			resolve: {
				zoiUserId: function () {
					return getZoiUserId();
				},
				zoiUser: function (zoiUserId, zoiApi) {
					return zoiApi.getUser(Number(zoiUserId));
				}
			}
		})
	}]).controller('contentPreviewCtrl', contentPreviewCtrl);


/**
 * page constructor
 * @constructor
 */
function contentPreviewCtrl($log, $rootScope, $timeout, $scope, $mdDialog, zoiUser, zoiApi, $window, zoiConfig) {

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
}

/**
 *  init the page
 */
contentPreviewCtrl.prototype.$onInit = function () {
	var vm = this;

	var selectedArticle = vm.zoiUser.session.selectedArticle;

	vm.contentTitle = selectedArticle.title;
	vm.selectedTitle = vm.contentTitle;
	vm.contentImage = selectedArticle.image;
	vm.link = selectedArticle.link;

	vm.$log.debug("contentPreviewCtrl initiated");
};


contentPreviewCtrl.prototype.postIt = function (ev, toPost) {
	var vm = this;

	MyUtils.addLoader();

	vm.zoiApi.postContentOnFacebook({
		userId: vm.zoiUser._id,
		link: vm.link,
		title: vm.selectedTitle,
		toPost: toPost
	}, ev).then(function () {
		//close the browser via messenger extension
		MyUtils.closeWebview();
	});
};