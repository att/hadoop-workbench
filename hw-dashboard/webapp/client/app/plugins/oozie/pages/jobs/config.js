define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('oozie-jobs', {
            templateUrl: dapConfig.pathToPlugins + '/oozie/pages/jobs/views/index.html',
            controller: 'oozie.pages.JobsController'
        });
    }
});
