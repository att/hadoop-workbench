define(function (require) {
    'use strict';

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];

    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('tenant.deploy-component.wizards.base.platform', {
            controller: 'deploy-component.wizards.base.platformController',
            templateUrl: dapConfig.pathToPlugins + '/tenant/dashboard-widgets/tenant-component-deployment-widget/wizards/base/widgets/platform/index.html',
            resolve: {
                platforms: ['dashboard.searchService', function (searchService) {
                    return searchService.getPlatforms();
                }]
            }
        });

        $widgetProvider.widget('tenant.deploy-component.wizards.base.cluster', {
            controller: 'deploy-component.wizards.base.clusterController',
            templateUrl: dapConfig.pathToPlugins + '/tenant/dashboard-widgets/tenant-component-deployment-widget/wizards/base/widgets/cluster/index.html',
            resolve: {
                clusters: ['dashboard.searchService', '$widgetParams', function (searchService, $widgetParams) {
                    var platformId = $widgetParams.data.platform.id;
                    return searchService.getClustersInfo(platformId);
                }]
            }
        });
    }
});
