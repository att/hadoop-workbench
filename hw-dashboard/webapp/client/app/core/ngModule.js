define(function (require) {
    "use strict";

    require('angular-ui-router');
    require('restangular');
    require('angularWidget');
    require("es6shim");
    require("angularPromiseExtras");
    require("cfpHotkeys");
    require("angular-inview");
    require("angularWebsocket");

    var dapComponent = require("component")['ngModuleName'];
    var sharedComponents = require('shared.components')['ngModuleName'];

    return require('angular').module('dap.core', [
        'ui.router',
        'restangular',
        'angularWidget',
        'ngPromiseExtras',
        'cfp.hotkeys',

        'ngWebSocket',
        // ngWebSocket
        dapComponent,
        sharedComponents
    ]);
});
