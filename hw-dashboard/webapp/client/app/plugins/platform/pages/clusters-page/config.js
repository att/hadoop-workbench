define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('clusters-page', {
            templateUrl: dapConfig.pathToPlugins + '/platform/pages/clusters-page/views/index.html',
            controller: 'platform.pages.ClustersPageContainerPageController'
        });
    }
});
