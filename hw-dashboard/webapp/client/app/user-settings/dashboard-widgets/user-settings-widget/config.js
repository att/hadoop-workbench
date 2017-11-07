define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('user-settings-widget', {
            templateUrl: dapConfig.pathToApp + '/user-settings/dashboard-widgets/user-settings-widget/views/index.html',
            controller: 'user-settings-widget.IndexController'
        });
    }
});
