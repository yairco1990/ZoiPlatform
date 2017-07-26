// Karma configuration
// Generated on Sat Jan 14 2017 23:18:36 GMT+0200 (Jerusalem Standard Time)

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],


        // list of files / patterns to load in the browser
        files: [
            //MODULES
            "node_modules/angular/angular.js",
            "node_modules/angular-ui-router/release/angular-ui-router.min.js",
            "node_modules/angular-mocks/angular-mocks.js",
            "node_modules/jquery/dist/jquery.min.js",
            "node_modules/angular-translate/dist/angular-translate.min.js",
            "node_modules/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js",
            "node_modules/bootstrap/dist/js/bootstrap.min.js",
            "node_modules/angular-ui-bootstrap/dist/ui-bootstrap.js",
            "node_modules/angular-resource/angular-resource.min.js",
            "node_modules/moment/min/moment.min.js",

            //SERVICES
            "src/services/config.js",
            "src/services/resources.js",
            "src/services/languages.js",
            "src/services/AppointmentService.js",

            //CONTROLLERS
            "src/app.js",
            "src/appointment/appointment.js",

            //TESTS
            "src/services/services.spec.js",
            "src/appointment/appointment.spec.js"
        ],


        // list of files to exclude
        exclude: [],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {},


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['spec'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    })
}
