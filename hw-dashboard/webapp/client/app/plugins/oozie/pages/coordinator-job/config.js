define(function (require) {
    "use strict";

    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('oozie-coordinator-job', {
            templateUrl: dapConfig.pathToPlugins + '/oozie/pages/coordinator-job/views/index.html',
            controller: 'oozie.page.CoordinatorJobController'
        });
    }

});
