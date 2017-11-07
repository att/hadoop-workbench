define(function (require) {
    "use strict";

    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('oozie-job-log', {
            templateUrl: dapConfig.pathToPlugins + '/oozie/pages/job-log/views/index.html',
            controller: 'oozie.pages.JobLogController'
        });
    }
});
