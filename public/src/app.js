/**
 * Created by sergeisafrigin on 3/27/16.
 */
angular.module('ZoiClient', [
	//NPM-BOWER LIBRARIES
	'ui.router',
	'ui.bootstrap',
	'ngMaterial',
	'isoCurrency',
	'md.time.picker',

	//SERVICES
	'Zoi.services.config',
	'Zoi.services.zoi-api',

	//DIRECTIVES
	'Zoi.directives.integration-element',

	//CONTROLLERS
	'Zoi.controllers.settings',
	'Zoi.controllers.account',
	'Zoi.controllers.integrations',
	'Zoi.controllers.agenda',
	'Zoi.controllers.old-customers',
	'Zoi.controllers.appointment-sum',
	'Zoi.controllers.mail',
	'Zoi.controllers.agenda',
	'Zoi.controllers.profile',
	'Zoi.controllers.abilities',
	'Zoi.controllers.keywords',
	'Zoi.controllers.category',
	'Zoi.controllers.facebook-pages',
	'Zoi.controllers.content-preview',
	'Zoi.controllers.promotion-preview',
	'Zoi.controllers.scheduling-page-link',
	'Zoi.controllers.404'

]).run(['$rootScope', '$state', function ($rootScope, $state) {

	$rootScope.$on('$stateChangeStart', function () {
		MyUtils.addLoader();
		$rootScope.stateIsLoading = true;
	});


	$rootScope.$on('$stateChangeSuccess', function () {
		MyUtils.removeLoader();
		$rootScope.stateIsLoading = false;
	});

}]).config(['$stateProvider', '$urlRouterProvider', '$logProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider, $logProvider, $locationProvider) {
		$urlRouterProvider.otherwise('/integrations');

		$locationProvider.hashPrefix('');

		$logProvider.debugEnabled(true);
	}]
).controller("AppCtrl", AppCtrl);


function AppCtrl($log, $rootScope) {
	$log.info("AppCtrl loaded");
	moment.locale('en');
	$rootScope.moment = moment;
}

AppCtrl.$inject = ['$log', '$rootScope'];
