define(function (require) {
    "use strict";

    require('./ngModule').config(cssLoaderConfig);

    cssLoaderConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function cssLoaderConfig($widgetProvider, dapConfig) {
        $widgetProvider.widget('css-loader', {
            templateUrl: dapConfig.pathToShared + '/widgets/css-loader/views/index.html',
        });
    }

});
