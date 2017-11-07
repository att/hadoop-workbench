define(function (require) {
    "use strict";

    require('./controllers/index');
    require('./ngModule').config(configure);

    configure.$inject = ['dap.core.config', 'dap-widget.$widgetProvider'];
    function configure(dapConfig, $widgetProvider) {
        $widgetProvider.widget('ide-tab-pages', {
            templateUrl: dapConfig.pathToLayouts + '/ide-tab-pages/views/index.html',
            controller: 'layouts.IdeTabPagesController'
        });
    }
});
