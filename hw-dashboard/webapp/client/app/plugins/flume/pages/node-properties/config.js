define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('flume-node-properties', {
            templateUrl: dapConfig.pathToPlugins + '/flume/pages/node-properties/views/index.html',
            controller: 'flume.pages.NodePropertiesController'
        });
    }
});
