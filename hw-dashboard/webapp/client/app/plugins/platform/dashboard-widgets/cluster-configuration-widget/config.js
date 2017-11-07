define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('cluster-configuration-widget', {
            templateUrl: dapConfig.pathToPlugins + '/platform/dashboard-widgets/cluster-configuration-widget/views/index.html',
            controller: 'cluster-configuration.IndexController',
            resolve: {
                $dashboardWidget: ['dashboard-isolated-widget-accessor.WidgetStore', function (WidgetStore) {
                    return WidgetStore.getWidget();
                }],
                filesContainer: ['$dashboardWidget', 'cluster-configuration.restService', function ($dashboardWidget, restService) {
                    var platformId = $dashboardWidget.params.platformId;
                    var clusterId = $dashboardWidget.params.clusterId;

                    restService.setClusterCredentials(platformId, clusterId);
                    return restService.getAllFiles();
                }],
                fileManager: ['filesContainer', 'cluster-configuration.FileManager', function (filesContainer, FileManager) {
                    return FileManager.factory(filesContainer.files);
                }],
                platformWriteAccess : ['$rootScope', function ($rootScope) {
                    return $rootScope.currentUser.features.indexOf('CLUSTER_SETTINGS_WRITE') !== -1;
                }]
            }
        });
    }
});
