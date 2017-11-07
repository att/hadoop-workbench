define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('addService.wizards-tenant.flume.template', {
            controller: 'addService.wizards-tenant.flume.templateController',
            templateUrl: dapConfig.pathToPlugins + '/addService/wizards-tenant/flume/widgets/template/index.html',
            resolve: {
                templates: ['flume.restService', '$widgetParams', function (restService, $widgetParams) {
                    return restService.getTemplates($widgetParams.data.version);
                }]
            }
        });

        $widgetProvider.widget('addService.wizards-tenant.flume.inputData', {
            controller: 'addService.wizards-tenant.flume.inputDataController',
            templateUrl: dapConfig.pathToPlugins + '/addService/wizards-tenant/flume/widgets/input-data/index.html'
        });
    }
});
