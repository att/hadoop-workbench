define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('oozie-workflow-page', {
            templateUrl: dapConfig.pathToPlugins + '/oozie/pages/workflow-page/views/index.html',
            controller: 'oozie.pages.WorkflowPageController'
        });
    }
});
