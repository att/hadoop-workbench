define(function (require) {
    "use strict";

    require('./ngModule').config(deployment);

    deployment.$inject = [
        'dashboard.WidgetManagerProvider',
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function deployment(dashboardWidgetManagerProvider,
                        $widgetProvider,
                        dapConfig) {
        dashboardWidgetManagerProvider
            .widget('deployment-manager', {
                // widget: 'deployment-manager',
                type: 'browser',
                icon: 'icon-deployment',
                makeParams: function (params) {
                    return params;
                }
        });
    }

});
