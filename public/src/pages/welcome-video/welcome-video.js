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
	vm.videoUrl = $sce.trustAsResourceUrl("https://res.cloudinary.com/gotime-systems/video/upload/q_80/v1505858944/Scene_2_bmlllw.mp4");

	vm.$log.info("WelcomeVideoCtrl loaded");
}



















