define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('flume-pipeline-page', {
            templateUrl: dapConfig.pathToPlugins + '/flume/pages/pipeline-page/views/index.html',
            controller: 'flume.pages.PipelinePageController',
            resolve: {
                restGetRawFileFunction: ['$widgetParams', 'flume.restService', function ($widgetParams, restService) {
                    if ($widgetParams.params.isTenantComponent) {
                        return function (file) {
                            return restService.getTenantFile('v1.0', $widgetParams.params.componentId, file.path).then(function (fileData) {
                                return ng.extend({}, file, fileData);
                            });
                        };
                    } else {
                        return function (file) {
                            return restService.getFile('v1.0', $widgetParams.params.source, file.path).then(function (fileData) {
                                return ng.extend({}, file, fileData);
                            });
                        };
                    }
                }]
            }
        });
    }
});
