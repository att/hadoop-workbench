define(function (require) {
    "use strict";

    require('./ngModule').config(configurationConfig);

    configurationConfig.$inject = [
        'dashboard.WidgetManagerProvider'
    ];
    function configurationConfig(dashboardManagerProvider) {
        dashboardManagerProvider.widget('contributors', {
            icon: 'icon-configuration'
        });
    }
});
