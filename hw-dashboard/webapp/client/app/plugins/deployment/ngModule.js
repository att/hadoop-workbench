define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dashboard');
    require('./dashboard-widgets/deployment-manager-widget/main');
    require('./pages/environment-page/main');

    return ng.module('deployment', [
        'dashboard',
        'deployment-manager-widget',
        'deployment.pages.environment-page'
    ]);
});
