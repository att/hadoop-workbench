define(function (require) {
    "use strict";

    require('./controllers/index');
    require('./ngModule').config(configure);

    configure.$inject = ['dap.core.config', 'dap-widget.$widgetProvider'];
    function configure(dapConfig, $widgetProvider) {
        $widgetProvider.widget('page-two-columns', {
            templateUrl: dapConfig.pathToLayouts + '/page-two-columns/views/index.html',
            controller: 'layouts.PageTwoColumnsController'
        });
    }
});
