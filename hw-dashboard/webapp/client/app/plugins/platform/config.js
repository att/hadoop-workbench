/*jshint maxparams: 10*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = [
        'dashboard.WidgetManagerProvider',
        'platform.icons'
    ];
    function config(DashboardManagerProvider, PlatformIcons) {
        DashboardManagerProvider
            .widget('platform-manager', {
                widget: 'platform-manager',
                type: 'browser',
                icon: PlatformIcons.PLATFORM,
                makeParams: function (params) {
                    return params;
                }
            });
        DashboardManagerProvider
            .widget('cluster-configuration', {
                icon: 'icon-configuration'
            });
    }
});
