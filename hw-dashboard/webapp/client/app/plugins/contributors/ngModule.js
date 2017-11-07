define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dashboard');
    require('./dashboard-widgets/contributors-widget/main');

    return ng.module('dapContributors', [
        'dashboard',
        'contributors-widget'
    ]);
});
