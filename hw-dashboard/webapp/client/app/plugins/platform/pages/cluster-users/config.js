define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('platform.pages.cluster-info.cluster-users', {
            templateUrl: dapConfig.pathToPlugins + '/platform/pages/cluster-users/views/index.html',
            controller: 'platform.pages.cluster-info.ClusterUsersPageController',
            resolve: {
                users: ['platform-manager-widget.cluster-info.ClusterUsersActions', 'platform-manager-widget.Widget.ClustersStore', function (clusterUsersActions, ClustersStore) {
                    let cluster = ClustersStore.getSelectedCluster();
                    let platformId = cluster.platformId;
                    let clusterId = cluster.title;

                    clusterUsersActions.setClusterCredentials(platformId, clusterId);
                    return clusterUsersActions.fetchUsers(platformId, clusterId);
                }],
                'platform-manager-widget.Widget.PlatformsStore': ['platform-manager-widget.PlatformsStoreFactory', 'dashboard-isolated-widget-accessor.WidgetStore', function (storeFactory, WidgetStore) {
                    var $dashboardWidget = WidgetStore.getWidget();
                    var widgetGuid = $dashboardWidget.guid;
                    return storeFactory(widgetGuid);
                }],
            }
        });
    }
});
