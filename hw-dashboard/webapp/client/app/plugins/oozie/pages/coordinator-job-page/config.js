define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('oozie-coordinator-job-page', {
            templateUrl: dapConfig.pathToPlugins + '/oozie/pages/coordinator-job-page/views/index.html',
            controller: 'oozie.pages.CoordinatorJobPageController'
        });
    }
});
