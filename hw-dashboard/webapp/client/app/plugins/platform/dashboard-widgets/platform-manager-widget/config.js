define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {
        $widgetProvider
            .widget('platform-manager-widget', {
                templateUrl: dapConfig.pathToPlugins + '/platform/dashboard-widgets/platform-manager-widget/views/index.html',
                controller: 'platform-manager-widget.IndexController',
                resolve: {
                    'widgetGuid': ['dashboard-isolated-widget-accessor.WidgetStore', function (WidgetStore) {
                        var $dashboardWidget = WidgetStore.getWidget();
                        return $dashboardWidget.guid;
                    }],
                    'platform-manager-widget.Widget.PlatformsActions': ['platform-manager-widget.PlatformsActionsFactory', 'widgetGuid', function (actionsFactory, widgetGuid) {
                        return actionsFactory(widgetGuid);
                    }],
                    'platform-manager-widget.Widget.PlatformsStore': ['platform-manager-widget.PlatformsStoreFactory', 'widgetGuid', function (storeFactory, widgetGuid) {
                        return storeFactory(widgetGuid);
                    }],
                    'platform-manager-widget.Widget.ClustersActions': ['platform-manager-widget.ClustersActionsFactory', 'widgetGuid', function (actionsFactory, widgetGuid) {
                        return actionsFactory(widgetGuid);
                    }],
                    'platform-manager-widget.Widget.ClustersStore': ['platform-manager-widget.ClustersStoreFactory', 'widgetGuid', function (storeFactory, widgetGuid) {
                        return storeFactory(widgetGuid);
                    }],
                    'platformWriteAccess' : ['$rootScope', function ($rootScope) {
                        return $rootScope.currentUser.features.indexOf('CLUSTER_SETTINGS_WRITE') !== -1;
                    }],
                    beforeLoadTask: [
                        '$q',
                        '$widgetParams',
                        'platform-manager-widget.Widget.PlatformsActions',
                        'platform-manager-widget.Widget.PlatformsStore',
                        'platform-manager-widget.Widget.ClustersActions',
                        'platform-manager-widget.Widget.ClustersStore',
                        function ($q, $widgetParams, PlatformsActions, PlatformsStore, ClustersActions, ClustersStore) {
                            return $q.all([
                                PlatformsActions.fetchPlatformTypes(),
                                PlatformsActions.fetchPlatforms()
                            ]).then(function () {
                                var creatingNewPlatform = $widgetParams.newPlatformName !== undefined;
                                if (!creatingNewPlatform) {
                                    var selectedPlatformId = $widgetParams.platform !== undefined ? $widgetParams.platform.id : $widgetParams.cluster.platform.id;
                                    PlatformsActions.selectPlatformById(selectedPlatformId);
                                    var showClustersWidget = $widgetParams.platform === undefined;
                                    if (showClustersWidget) {
                                        return $q.all([
                                            ClustersActions.fetchClusters($widgetParams.cluster.platform),
                                            ClustersActions.fetchMetadata($widgetParams.cluster.platform.id),
                                        ]).then(function () {
                                            ClustersStore.getClusters($widgetParams.cluster.platform.id).some(function (c) {
                                                if (c.id === $widgetParams.cluster.id) {
                                                    ClustersActions.selectCluster(c);
                                                    return true;
                                                }
                                                return false;
                                            });
                                        });
                                    }
                                }
                            });
                        }]
                }
            });
    }
});
