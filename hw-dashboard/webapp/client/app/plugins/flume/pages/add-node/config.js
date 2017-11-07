define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('flume-add-node', {
            templateUrl: dapConfig.pathToPlugins + '/flume/pages/add-node/views/index.html',
            controller: 'flume.pages.AddNodeController'
        });
    }
});
