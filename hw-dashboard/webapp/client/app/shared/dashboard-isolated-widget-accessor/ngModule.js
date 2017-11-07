define(function (require) {
    "use strict";

    var ng = require('angular');
    require('flux');

    return ng.module('dashboard-isolated-widget-accessor', ['flux']);
});
