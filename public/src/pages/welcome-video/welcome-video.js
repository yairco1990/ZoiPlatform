/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.welcome-video', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('welcome-video', {
			url: '/welcome-video',
			controller: 'WelcomeVideoCtrl as vm',
			templateUrl: 'src/pages/welcome-video/welcome-video.html'
		})
	}]).controller('WelcomeVideoCtrl', WelcomeVideoCtrl);


/**
 * page constructor
 * @constructor
 */
function WelcomeVideoCtrl($log, $rootScope, $timeout, $sce) {

	var vm = this;

	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;
	vm.videoUrl = $sce.trustAsResourceUrl("http://res.cloudinary.com/gotime-systems/video/upload/q_100/v1506558920/Scene_1_mhj5xc.mp4");

	vm.$log.info("WelcomeVideoCtrl loaded");
}



















