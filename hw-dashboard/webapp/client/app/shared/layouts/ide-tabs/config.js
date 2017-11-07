define(function (require) {
    "use strict";

    require('./controllers/index');
    require('./ngModule').config(configure);

    configure.$inject = ['dap.core.config', 'dap-widget.$widgetProvider'];
    function configure(dapConfig, $widgetProvider) {
        $widgetProvider.widget('ide-tabs', {
            templateUrl: dapConfig.pathToLayouts + '/ide-tabs/views/index.html',
            controller: 'layouts.IdeTabsController',
            resolve: {
                tabsActions: ['$widgetParams', function ($widgetParams) {
                    return $widgetParams.tabsActions;
                }],
                sizes: ['$widgetParams', function ($widgetParams) {
                    return $widgetParams.sizes;
                }]
            }
        });
    }
});
