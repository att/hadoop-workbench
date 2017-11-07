define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('platforms-page', {
            templateUrl: dapConfig.pathToPlugins + '/platform/pages/platforms-page/views/index.html',
            controller: 'platform.pages.PlatformsPageContainerPageController'
        });
    }
});
