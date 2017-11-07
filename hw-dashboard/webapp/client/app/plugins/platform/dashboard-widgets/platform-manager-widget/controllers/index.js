/*jshint maxparams: 13*/
import {TYPE_CDH} from '../../../constants/platform-types';
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('platform-manager-widget.IndexController', Controller);

    Controller.$inject = [
        '$scope',
        '$widgetParams',
        'dashboard-isolated-widget-accessor.WidgetStore',
        'dashboard-isolated-widget-accessor.WidgetActions',
        'dashboard.models.TabPage',
        'platform.models.Platform',
        'main.alerts.alertsManagerService',
        'platform-manager-widget.Widget.PlatformsActions',
        'platform-manager-widget.Widget.ClustersActions',
        'platform-manager-widget.Widget.PlatformsStore',
        'platform-manager-widget.Widget.ClustersStore',
        'platform.widgetHelper',
        'platform.icons',
        '$q'
    ];
    function Controller($scope, $widgetParams, WidgetStore, WidgetAccessorActions, TabPage, Platform, alertsManager, PlatformsActions,
                        ClustersActions, PlatformsStore, ClustersStore, platformWidgetHelper, PlatformIcons, $q) {

        var $dashboardWidget = WidgetStore.getWidget();
        var platformsBrowserIndex;
        var clustersBrowserIndex;
        var kafkaTopicsBrowserIndex;

        var newPlatformName = $widgetParams.newPlatformName;
        var newPlatformTypeId = $widgetParams.newPlatformTypeId;

        var platformIdClusterIdObj = {};
        ng.extend($scope, {
            $dashboardWidget: $dashboardWidget,
            isRequesting: false
        });

        ng.extend($scope, {});

        $scope.$on('show-plugin-preloader', showPluginPreloader);

        $scope.$on('hide-plugin-preloader', hidePluginPreloader);

        init();

        function init() {
            WidgetAccessorActions.updateWidgetExternalActions(widgetExternalActionCall);

            startWatching();

            platformsBrowserIndex = $dashboardWidget.tabManager.addTab(TabPage.factory({
                name: "platforms-page",
                params: {
                    newPlatformName: newPlatformName,
                    newPlatformTypeId: newPlatformTypeId
                }
            }), '', '', '', true);
            clustersBrowserIndex = $dashboardWidget.tabManager.addTab(TabPage.factory({
                name: "clusters-page"
            }), '', '', '', true);

            kafkaTopicsBrowserIndex = $dashboardWidget.tabManager.addTab(TabPage.factory({
                name: "kafka-topics-page",
                params: {
                    platformIdClusterIdObj: platformIdClusterIdObj
                }
            }), '', '', '', true);

            processParamsAndSelectTab($widgetParams);
        }

        function widgetExternalActionCall(action, actionParams) {
            switch (action) {
                case 'applyOptionsCallback':
                    processParamsAndSelectTab(actionParams);
                    break;
            }
        }

        function processParamsAndSelectTab(widgetParams) {
            var creatingNewPlatform = widgetParams.newPlatformName !== undefined;
            var showClusterWidget = widgetParams.cluster !== undefined;
            if (!creatingNewPlatform && showClusterWidget) {
                if (widgetParams.cluster && widgetParams.cluster.platform) {
                    var desiredPlatform = widgetParams.cluster.platform;
                    if (desiredPlatform) {
                        loadClusterAndShowClusterTab(desiredPlatform);
                    }
                }
            } else {
                PlatformsActions.fetchPlatforms();
                showTab("platforms");
            }
        }

        function showTab(tab) {
            if (tab === "platforms") {
                $dashboardWidget.title = "Platforms";
                $dashboardWidget.icon = PlatformIcons.PLATFORM;
                ClustersActions.selectCluster(null);
                var platforms = PlatformsStore.getPlatforms();
                if (platforms.length > 0 && PlatformsStore.getSelectedPlatform() === null) {
                    PlatformsActions.selectPlatform(platforms[0]);
                }
                $dashboardWidget.tabManager.setActive(platformsBrowserIndex);
            } else if (tab === "clusters") {
                // tab === "clusters"
                var selectedPlatformInstance = PlatformsStore.getSelectedPlatform();
                $dashboardWidget.title = selectedPlatformInstance.title + " - clusters";
                $dashboardWidget.icon = getWidgetIcon(selectedPlatformInstance);
                PlatformsActions.selectPlatform(null);
                var clusters = ClustersStore.getClusters(selectedPlatformInstance && selectedPlatformInstance.id);
                if (clusters.length > 0 && ClustersStore.getSelectedCluster() === null) {
                    ClustersActions.selectCluster(clusters[0]);
                }
                $dashboardWidget.tabManager.setActive(clustersBrowserIndex);
            } else if (tab === "kafka-topics") {
                $dashboardWidget.title = "Kafka Topics";
                $dashboardWidget.icon = PlatformIcons.PLATFORM_KAFKA;
                $dashboardWidget.tabManager.setActive(kafkaTopicsBrowserIndex);
            }
        }

        function getWidgetIcon(platformInstance) {
            return platformInstance.type === TYPE_CDH ? PlatformIcons.PLATFORM_CLOUDERA : PlatformIcons.PLATFORM_HDP;
        }

        function startWatching() {
            $scope.$on('open-clusters.platforms-browser', function (event, platform) {
                event.stopPropagation();
                loadClusterAndShowClusterTab(platform);
            });

            $scope.$on('open-platforms.clusters-browser', function (event) {
                $dashboardWidget.title = "Platforms";
                event.stopPropagation();
                showTab("platforms");
            });

            $scope.$on('save.platform', function (event, platform) {
                event.stopPropagation();

                platformWidgetHelper.clearNewPlatformNameParam($dashboardWidget);
                platformWidgetHelper.clearNewPlatformTypeIdParam($dashboardWidget);

                event.deferredResult = PlatformsActions.createPlatform(platform);
            });

            $scope.$on('update.platform', function (event, platform) {
                event.stopPropagation();
                event.deferredResult = PlatformsActions.updatePlatform(platform);
            });

            $scope.$on('update.cluster-info', function (event, cluster) {
                event.stopPropagation();
                event.deferredResult = ClustersActions.updateCluster(cluster);
            });
        }


        function loadClusterAndShowClusterTab(platform) {
            var syncOrAsync = _openClusters(platform);
            if (syncOrAsync.syncCall) {
                complete();
            } else if (syncOrAsync.asyncCall) {
                syncOrAsync.asyncCall.then(complete);
            }

            function complete() {
                showTab("clusters");
            }

        }

        /**
         * Load all data needed to show "clusters" tab
         *
         * @param platform
         * @returns {Object} // EXACTLY ON OF: {syncCall: <Boolean>} OR {asyncCall: <Promise>}
         * @private
         */
        function _openClusters(platform) {

            showPluginPreloader();
            //TODO(maximk): using `finally` with Actions looks weird, there's got to be a better way to emit event
            var asyncTaskArray = [];

            var clusters = ClustersStore.getClusters(platform.id);
            var fetchClustersAsyncCall = ClustersActions.fetchClusters(platform);

            var result = {};
            if (!clusters.length) {
                asyncTaskArray.push(fetchClustersAsyncCall);
            }
            if (!ClustersStore.getMetadata(platform.id)) {
                asyncTaskArray.push(ClustersActions.fetchMetadata(platform.id));
            }
            if (asyncTaskArray.length) {
                result.asyncCall = $q.all(asyncTaskArray).finally(finallyCallFn);
            } else {
                // we already have needed data in ClusterStore
                // Start rendering immediate,
                // later, then http-requests will be complete, data will be updated[if they are updated], on the already rendered view
                result.syncCall = finallyCallFn();
            }

            return result;
            function finallyCallFn() {
                PlatformsActions.selectPlatformById(platform.id);
                hidePluginPreloader();

                var platformSelected = PlatformsStore.getSelectedPlatform();
                $dashboardWidget.title = platformSelected.title + " - clusters";
                return true;
            }
        }

        function showPluginPreloader() {
            $scope.showPreloader = true;
        }

        function hidePluginPreloader() {
            $scope.showPreloader = false;
        }
    }
});
