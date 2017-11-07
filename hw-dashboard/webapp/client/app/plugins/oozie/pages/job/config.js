define(function (require) {
    "use strict";

    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('oozie-job', {
            templateUrl: dapConfig.pathToPlugins + '/oozie/pages/job/views/index.html',
            controller: 'oozie.page.JobController',
            resolve: {
                jobWorkflow: ['$widgetParams', 'oozie.job-rest-service', "$q",
                    function ($widgetParams, restService) {
                        let jobId = $widgetParams.params.jobId;
                        let source = $widgetParams.params.source;
                        return restService.getJobWorkflow(source, jobId).then(function (workflow) {
                            return workflow;
                        }, function () {
                            return null;
                        });
                    }],
                jobModule: [
                    'oozie.restService',
                    '$widgetParams',
                    "jobWorkflow",
                    function (oozieRestService, $widgetParams, workflow) {
                        return oozieRestService.convertModule($widgetParams.params.source, workflow, [], {x: 192, y: 96});
                    }]
            }
        });
    }

});
