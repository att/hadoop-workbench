define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('tenant.deploy-component.wizards.flume.service', {
            controller: 'deploy-component.wizards.flume.serviceController',
            templateUrl: dapConfig.pathToPlugins + '/tenant/dashboard-widgets/tenant-component-deployment-widget/wizards/flume/widgets/service/index.html',
            resolve: {
                services: ['dashboard.searchService', '$widgetParams', function (searchService, $widgetParams) {
                    var platformId = $widgetParams.data.platform.id;
                    var clusterId = $widgetParams.data.cluster.id;
                    return searchService.getServices(platformId, clusterId, "FLUME");
                }]
            }
        });

        $widgetProvider.widget('tenant.deploy-component.wizards.flume.plugin-dirs', {
            controller: 'deploy-component.wizards.flume.pluginDirsController',
            templateUrl: dapConfig.pathToPlugins + '/tenant/dashboard-widgets/tenant-component-deployment-widget/wizards/flume/widgets/plugin-dirs/index.html',
            resolve: {
                directories: ['dashboard.searchService', '$widgetParams', function (searchService, $widgetParams) {
                    var platformId = $widgetParams.data.platform.id;
                    return searchService.getPluginDirs(platformId);
                }]
            }
        });

        $widgetProvider.widget('tenant.deploy-component.wizards.flume.componentName', {
            controller: 'deploy-component.wizards.flume.componentNameController',
            templateUrl: dapConfig.pathToPlugins + '/tenant/dashboard-widgets/tenant-component-deployment-widget/wizards/flume/widgets/componentName/index.html'
        });
    }
});
