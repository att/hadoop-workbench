/*jshint maxparams: 10*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = [
        'dashboard.WidgetManagerProvider',
    ];
    function config(DashboardManagerProvider) {
/*
        DashboardManagerProvider
            .widget('platform-provision', {
                widget: 'platform-provision',
                makeParams: function (params) {
                    return params;
                }
            });
*/
    }
});
