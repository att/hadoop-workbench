/*jshint maxparams: 13*/
import {TYPE_CDH} from '../../../../platform/constants/platform-types';
import {getCompositeId} from '../../../../oozie/reducers/oozieDeployedComponents'
define(function (require) {
    "use strict";

    var ng = require('angular');
                                      // deployment-manager-widget.IndexController
    require('../ngModule').controller('deployment-manager-widget.IndexController', Controller);

    Controller.$inject = [
        '$scope',
        '$widgetParams',
        'dashboard-isolated-widget-accessor.WidgetStore',
        'dashboard-isolated-widget-accessor.WidgetActions',
        'dashboard.models.TabPage',
        '$ngRedux',
        'oozie.redux-actions',
        'dashboard.searchService',
        'main.alerts.alertsManagerService',
        'platform.icons',
        '$q',
        '$interval',
    ];
    function Controller($scope, $widgetParams, WidgetStore, WidgetActions,
                        TabPage,
                        $ngRedux,
                        oozieActions,
                        searchService,
                        alertsManagerService, PlatformIcons, $q, $interval) {

        var $dashboardWidget = WidgetStore.getWidget();

        $dashboardWidget.title = "Deployment Manager";

        let componentsTimer = false;
        let sourceDispatchers = [];

        ng.extend($scope, {
            $dashboardWidget: $dashboardWidget,
            isRequesting: false,
            clusters: [],
            clusterTypes: {},
            sources: [],
            close: WidgetActions.close
        });

        ng.extend($scope, {});

        $scope.$on('show-plugin-preloader', showPluginPreloader);

        $scope.$on('hide-plugin-preloader', hidePluginPreloader);

        $scope.$on('$destroy', function() {
            removeTimers();
        });

        init();

        function init() {
            showPluginPreloader();
            fetchClusters()
                .then(function () {
                    $scope.sources.forEach((source) => {
                        let dispatcher = () => {
                            return $ngRedux.dispatch(oozieActions.getDeployedComponents(source))
                        };

                        sourceDispatchers.push({
                            dispatcher: dispatcher,
                            source: source
                        });
                    });

                    $scope.clusters.forEach((cluster, index) => addClusterTab(cluster, $scope.clusterTypes, index));
                })
                .finally(() => {
                    const activeTabIndex = $dashboardWidget.tabManager.getActive();
                    $dashboardWidget.tabManager.setActive(activeTabIndex);
                    if (sourceDispatchers && sourceDispatchers.length !== 0) {
                        $dashboardWidget.tabManager.on('active-tab-changed', () => updateWorkflowList(true));
                        updateWorkflowList(true);
                        initTimers();
                    } else {
                        $scope.errorMessage = "No cluster found";
                        hidePluginPreloader();
                    }
                });
        }


        function initTimers() {
            componentsTimer = $interval(() => updateWorkflowList(false), 5000, 1000);
        }

        function updateWorkflowList(showPreloader = true) {
            let activeTabIndex = $dashboardWidget.tabManager.getActive();
            let activeTab = $dashboardWidget.tabManager.getTab(activeTabIndex);
            let dispatcher = sourceDispatchers.find(dispatcher => isSourceTabActive(dispatcher.source, activeTab));

            if (showPreloader) {
                showPluginPreloader();
                dispatcher.dispatcher().finally(hidePluginPreloader);
            } else {
                dispatcher.dispatcher();
            }
        }

        function isSourceTabActive(source, activeTab) {
            return source.platform.id === activeTab.page.params.platformId &&
                source.cluster.id === activeTab.page.params.clusterId
        }

        function removeTimers() {
            if (componentsTimer) {
                $interval.cancel(componentsTimer);
            }
        }

        function showPluginPreloader() {
            $scope.showPreloader = true;
        }

        function hidePluginPreloader() {
            $scope.showPreloader = false;
        }

        function addClusterTab({id: clusterId, platform: {id: platformId, type = '', title: platformTitle} = {}},
                               clusterTypes,
                               index) {


            let defaultTab = $widgetParams.defaultTab;
            let doNotSetFocus = $widgetParams.defaultTab ?
                defaultTab.clusterId !== clusterId ||  defaultTab.platformId !== platformId:
                index > 0;

            var page = TabPage.factory({
                name: "deployment-environment-page",
                params: {
                    clusterId: clusterId,
                    platformId: platformId,
                    clusterTypes: clusterTypes
                },
            });

            let title = platformTitle + '/' + clusterId;
            let tooltip = platformTitle + '/' + clusterId;
            let icon = 'ic-search-cluster-' + type.toLowerCase() + '-cluster';
            var tabIndex = $dashboardWidget.tabManager.addTab(page, title, tooltip, icon);
            if (!doNotSetFocus) {
                $dashboardWidget.tabManager.setActive(tabIndex);
            }

        }

        function buildClusterSource(clusters) {
            return clusters.map(({id: clusterId = '', platform: {id: platformId = ''} = {}}) =>
                ({
                    cluster: {
                        id: clusterId
                    },
                    platform: {
                        id: platformId
                    }
                }));
        }

        function buildClusterType(clusters) {
            return clusters.map(({id: clusterId = '', platform: {id: platformId = '', type = ''} = {}}) =>
                ({
                    clusterId,
                    platformId,
                    type
                })).reduce((typeTree, idObject) => {
                typeTree[getCompositeId(idObject)] = idObject.type;
                return typeTree;
            }, {});

        }

        function fetchClusters() {
            $scope.isRequesting = true;
            return searchService.getClustersListing('v1.0', false).then(function (clusters) {
                $scope.clusters = clusters;
                $scope.clusterTypes = buildClusterType(clusters);
                $scope.sources = buildClusterSource(clusters)
                //cluster.path2Display = stringFormat('{0}', cluster.title);
            }).catch(function (error) {
                alertsManagerService.addAlertError({
                    title: 'Search clusters',
                    text: "Failed to get clusters because of the error: " + error.message
                });
            }).finally(function () {
                $scope.isRequesting = false;
            });
        }

    }
});
