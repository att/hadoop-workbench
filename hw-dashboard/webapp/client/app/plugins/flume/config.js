define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(flumeConfig);

    flumeConfig.$inject = [
        'dashboard.WidgetManagerProvider'
    ];
    function flumeConfig(dashboardWidgetManagerProvider) {
        dashboardWidgetManagerProvider.widget('flume', {
            widget: 'flume',
            icon: '',
            type: 'service',
            makeParams: function (params) {
                return {
                    source: params.source
                };
            }
        });
    }
});
