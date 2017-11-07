define(function (require) {
    "use strict";

    require('./controllers/index');
    require('./ngModule').config(configure);

    configure.$inject = ['dap.core.config', 'dap-widget.$widgetProvider'];
    function configure(dapConfig, $widgetProvider) {
        $widgetProvider.widget('tab-pages', {
            templateUrl: dapConfig.pathToLayouts + '/tab-pages/views/index.html',
            controller: 'layouts.TabPagesController'
        });
    }
});
