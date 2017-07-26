/**
 * Created by sergeisafrigin on 3/27/16.
 */
angular.module('ZoiClient', [
    //NPM-BOWER LIBRARIES
    'ui.router',
    'ui.bootstrap',
    'ngMaterial',

    //SERVICES
    'Zoi.services.config',
    'Zoi.services.zoi-api',

    //DIRECTIVES
    'Zoi.directives.integration-element',

    //CONTROLLERS
	'Zoi.controllers.account',
    'Zoi.controllers.integrations',
    'Zoi.controllers.agenda',
	'Zoi.controllers.old-customers',
	'Zoi.controllers.appointment-sum',
    'Zoi.controllers.mail',
    'Zoi.controllers.agenda',
    'Zoi.controllers.profile',
    'Zoi.controllers.abilities'

]).config(['$stateProvider', '$urlRouterProvider', '$logProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider, $logProvider, $locationProvider) {
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
