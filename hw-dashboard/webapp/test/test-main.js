/*jshint globalstrict: true*/
"use strict";

var allTestFiles = [];
var TEST_REGEXP = /(spec|test)\.js$/i;

var pathToModule = function (path) {
    return "testfiles/" + path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function (file) {
    if (TEST_REGEXP.test(file)) {
        // Normalize paths to RequireJS module names.
        allTestFiles.push(pathToModule(file));
    }
});

requirejs.config({
    baseUrl: '/base/client',
    paths: {

        jquery: 'bower_components/jquery/dist/jquery',
        jqueryUi: 'bower_components/jquery-ui/jquery-ui.min',
        angular: 'bower_components/angular/angular',
        ngRoute: 'bower_components/angular-route/angular-route',
        ngSanitize: 'bower_components/angular-sanitize/angular-sanitize',
        angularResource: 'bower_components/angular-resource/angular-resource',
        jsPlumb: 'bower_components/jsPlumb/dist/js/jquery.jsPlumb-1.6.4',
        ngBootstrap: 'bower_components/angular-bootstrap/ui-bootstrap-tpls',
        ngMockE2E: 'bower_components/angular-mocks/angular-mocks',
        jsZip: 'bower_components/jszip/jszip',

        plugins: 'app/plugins'

    },
    packages: [
        {
            name: 'dap.core',
            location: 'app/core'
        },
        {
            name: 'dap.shared.validation',
            location: 'app/shared/validation'
        },
        {
            name: 'dap.shared.jsPlumb',
            location: 'app/shared/jsPlumb'
        },
        {
            name: 'dap.shared.templateCache',
            location: 'app/shared/templateCache'
        },
        {
            name: 'mocks',
            location: 'app/shared/mocks'
        },
        {
            name: "dap.shared.accordionWidget",
            location: 'app/shared/accordion-widget'
        },
        {
            name: "dap.shared.dropdownWidget",
            location: 'app/shared/dropdown-widget'
        },


        {
            name: 'dap.main',//main app module
            location: 'app/main'
        },

        {
            name: 'flume',
            location: 'app/plugins/flume'
        },
        {
            name: 'tenant',
            location: 'app/plugins/tenant'
        },
        {
            name: 'dashboard',
            location: 'app/plugins/dashboard'
        },
        {
            name: 'auth',
            location: 'app/plugins/auth'
        },
        {
            name: 'test',
            location: 'app/plugins/test'
        },

        // karma js testfiles
        {
            name: 'testfiles',
            location: '/base'
        }
    ],
    shim: {
        angular: {
            deps: ['jquery'],
            exports: 'angular'
        },
        jsPlumb: {
            exports: 'jsPlumb',
            deps: ['jqueryUi']
        },
        ngRoute: {
            deps: ['angular']
        },
        ngSanitize: {
            deps: ['angular']
        },
        ngBootstrap: {
            deps: ['angular']
        },
        ngMockE2E: {
            deps: ['angular']
        },
        jsZip: {
            exports: 'JSZip'
        }
    },

    // dynamically load all spec files, each test file `requires` app file it tests
    deps: allTestFiles,

    // when all spec files are loaded, start karma
    callback: window.__karma__.start
});