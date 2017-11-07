define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dashboard.WidgetManagerProvider',
        'dap.core.config'
    ];
    function config(DashboardWidgetManagerProvider, dapConfig) {
        DashboardWidgetManagerProvider.widget('user-settings', {
            type: 'browser',
            icon: 'icon-settings',
            title: 'Settings'
        });
    }
});
