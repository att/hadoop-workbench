define(function (require) {
    "use strict";

    require('./ngModule').config(['dap-widget.$widgetProvider', 'dap.core.config', function ($widgetProvider, dapConfig) {
        $widgetProvider.widget('editor', {
            templateUrl: dapConfig.pathToPlugins + '/editor/views/index.html',
            controller: 'editor.IndexController',
            scope: {
                options: "="
            },
            resolve: {
                container: ['$widgetParams', function ($widgetParams) {
                    return $widgetParams.container;
                }],
                options: ['$widgetParams', function ($widgetParams) {
                    return $widgetParams.options;
                }]
            }
        });
    }]);
});
