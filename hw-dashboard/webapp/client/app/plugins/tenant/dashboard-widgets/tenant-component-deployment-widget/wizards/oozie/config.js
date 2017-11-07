define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('tenant.deploy-component.wizards.oozie.path', {
            controller: 'deploy-component.wizards.oozie.pathController',
            templateUrl: dapConfig.pathToPlugins + '/tenant/dashboard-widgets/tenant-component-deployment-widget/wizards/oozie/widgets/path/index.html'
        });

        $widgetProvider.widget('tenant.deploy-component.wizards.oozie.space', {
            controller: 'deploy-component.wizards.oozie.spaceController',
            templateUrl: dapConfig.pathToPlugins + '/tenant/dashboard-widgets/tenant-component-deployment-widget/wizards/oozie/widgets/space/index.html',
            resolve: {
                spaces: ['platform.restService', '$widgetParams', function (restService, $widgetParams) {
                        let {
                            platform: {id: platformId} = {},
                            cluster: {id: clusterId} = {}
                        } = $widgetParams.data;
                    return restService.getClusterDeploymentEnvironments('v1.0', platformId, clusterId);
                }]
            }

        });
    }
});
