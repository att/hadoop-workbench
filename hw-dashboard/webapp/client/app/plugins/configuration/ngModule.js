define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dashboard');
    require('./dashboard-widgets/configuration-widget/main');

    return ng.module('dapConfiguration', [
        'dashboard',
        'configuration-widget'
    ]);
});
