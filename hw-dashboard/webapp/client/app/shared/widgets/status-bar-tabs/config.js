define(function (require) {
    "use strict";

    require('./controllers/index');
    require('./ngModule').config(configure);

    configure.$inject = [
        'dap.core.config',
        'dap-widget.$widgetProvider'
    ];
    function configure(dapConfig, $widgetProvider) {

        $widgetProvider.widget('status-bar-tabs', {
            templateUrl: dapConfig.pathToShared + '/widgets/status-bar-tabs/views/index.html',
            controller: 'status-bar-tabs.IndexController'
        });
    }
});
