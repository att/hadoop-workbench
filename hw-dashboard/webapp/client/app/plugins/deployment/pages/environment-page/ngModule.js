define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dashboard');

    return ng.module('deployment.pages.environment-page', ['dashboard']);
});
