define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('addService.wizards-tenant.oozie.version', {
            controller: 'addService.wizards-tenant.oozie.versionController',
            templateUrl: dapConfig.pathToPlugins + '/addService/wizards-tenant/oozie/widgets/version/index.html',
            resolve: {
                versions: ['oozie.restService', function (restService) {
                    return restService.getVersionsList();
                }]
            }
        });

        $widgetProvider.widget('addService.wizards-tenant.oozie.template', {
            controller: 'addService.wizards-tenant.oozie.templateController',
            templateUrl: dapConfig.pathToPlugins + '/addService/wizards-tenant/oozie/widgets/template/index.html'
        });

        $widgetProvider.widget('addService.wizards-tenant.oozie.inputData', {
            controller: 'addService.wizards-tenant.oozie.inputDataController',
            templateUrl: dapConfig.pathToPlugins + '/addService/wizards-tenant/oozie/widgets/input-data/index.html'
        });
    }
});
