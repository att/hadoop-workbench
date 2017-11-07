define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(configure);

    configure.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function configure($widgetProvider, dapConfig) {
        $widgetProvider.widget('search-component-oozie', {
            controller: 'deployment.SearchComponentOozieController',
            templateUrl: dapConfig.pathToPlugins + '/deployment/widgets/search-component-oozie/views/index.html',
            resolve: {}
        });
    }
});
