define(function (require, exports, module) {
    "use strict";

    var angular = require('angular');
    var transcludePlaceholder = require('./transclude-placeholder')['ngModuleName'];
    var componentLoader = require('./component-loader')['ngModuleName'];

    exports['ngModuleName'] = angular.module('dap-component', [
        transcludePlaceholder,
        componentLoader
    ]).name;
    exports['extendModule'] = require('./component')['extendModule'];
    exports['components'] = require('./component')['components'];
});
