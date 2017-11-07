import {deleteNonExistingKeysFromOldObject} from "../../../../../shared/utils/array-functions";
/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('platform.pages.ClustersBrowserPageController', Controller);

    Controller.$inject = [
        '$scope',
        'dashboard.WidgetsActions',
        'platform-manager-widget.Widget.PlatformsActions',
        'platform-manager-widget.Widget.PlatformsStore',
        'platform-manager-widget.Widget.ClustersActions',
        'platform-manager-widget.Widget.ClustersStore',
        'cluster.indexation.status',
        'cluster.indexation.types',
        'cluster.config.request.types',
        'cluster.config.request.status',
        'dashboard.models.PageControl',
        'dashboard.models.TabPage',
        '$widgetParams',
        'main.alerts.alertsManagerService',
        "dashboard.models.TabPage.EVENTS"
    ];
    function Controller($scope, WidgetsActions, PlatformsActions, PlatformsStore, ClustersActions, ClustersStore, CLUSTER_INDEXATION_STATUS, CLUSTER_INDEXATION_TYPES, CLUSTER_CONFIG_REQUEST_TYPES, CLUSTER_CONFIG_REQUEST_STATUS, PageControl, TabPage, $widgetParams, alertsManager, TabPageEvents) {
        var isListeningPlatformsStatus = false;

        ng.extend($scope, {
            clusters: ClustersStore.getClusters(),
            selectedItem: ClustersStore.getSelectedCluster(),
            indexationTypes: [
                {
                    type: CLUSTER_INDEXATION_TYPES.OOZIE,
                    startBtnTitle: "Start Index Oozie",
                    indexDescription:"Start Oozie index process for cluster",
                    stopBtnTitle:"Stop Index Oozie",
                    indexingDescription:"Indexing Oozie Workflow",
                    startFunc: indexOozieStart,
                    stopFunc: indexOozieStop,
                }, {
                    type: CLUSTER_INDEXATION_TYPES.FLUME,
                    startBtnTitle: "Start Index Flume",
                    indexDescription:"Start Flume index process for cluster",
                    stopBtnTitle:"Stop Index Flume",
                    indexingDescription:"Indexing Flume",
                    startFunc: indexFlumeStart,
                }
            ],
            schemaPropertyKeys: {},
            platformId: null,
            isAutoRefresh: true,
            refreshInterval: 5000,
            refreshIntervalTimeout: null,
            pageErrorMessage: null
        });
        
        //@ add cluster watcher
        if ($scope.clusters.length > 0) {
            $scope.platformId = $scope.clusters[0].platformId;
            Object.keys(ClustersStore.getMetadata($scope.platformId)).forEach(function (propertyKey) {
                $scope.schemaPropertyKeys[propertyKey] = true;
            });
        }

        ng.extend($scope, {
            selectCluster: function (cluster) {
                PlatformsActions.fetchAccessKeys(cluster.platformId, cluster.title);
                ClustersActions.selectCluster(cluster);
            },
            testConnectionHdfs: function (cluster) {
                ClustersActions.testConnectionHdfs(cluster);
            },
            pullConfig: function (cluster) {
                ClustersActions.pullConfig(cluster);
            },
            pushConfig: function (cluster) {
                ClustersActions.pushConfig(cluster);
            },
            isClusterHasKafkaTopics: function (cluster) {
                if (cluster && cluster.zooKeeperAccess && cluster.zooKeeperAccess.isNotEmpty) {
                    return cluster.zooKeeperAccess.isNotEmpty();
                }
                return false;
            },
            isClusterIndexationRunning: function (type, cluster) {
                return cluster.indexation[type].status == CLUSTER_INDEXATION_STATUS.RUNNING;
            },
            isClusterIndexationStopped: function (type, cluster) {
                return cluster.indexation[type].status == CLUSTER_INDEXATION_STATUS.NOT_RUNNING;
            },
            isClusterIndexationStarting: function (type, cluster) {
                return cluster.indexation[type].status == CLUSTER_INDEXATION_STATUS.STARTING;
            },
            isClusterIndexationStopping: function (type, cluster) {
                return cluster.indexation[type].status == CLUSTER_INDEXATION_STATUS.STOPPING;
            },
            isPullConfigRequestRunning: function (cluster) {
                return cluster.configRequest[CLUSTER_CONFIG_REQUEST_TYPES.PULL].status == CLUSTER_CONFIG_REQUEST_STATUS.RUNNING;
            },
            isPushConfigRequestRunning: function (cluster) {
                return cluster.configRequest[CLUSTER_CONFIG_REQUEST_TYPES.PUSH].status == CLUSTER_CONFIG_REQUEST_STATUS.RUNNING;
            },
            isClusterBusy: function (cluster) {
                let isOozieIndexationStopped = $scope.isClusterIndexationStopped(CLUSTER_INDEXATION_TYPES.OOZIE, cluster);
                let isFlumeIndexationStopped = $scope.isClusterIndexationStopped(CLUSTER_INDEXATION_TYPES.FLUME, cluster);
                let isPullConfigRequestRunning = $scope.isPullConfigRequestRunning(cluster);
                let isPushConfigRequestRunning = $scope.isPushConfigRequestRunning(cluster);

                return !isOozieIndexationStopped
                    || !isFlumeIndexationStopped
                    || isPullConfigRequestRunning
                    || isPushConfigRequestRunning;
            },
            openClusterConfigurationFiles: function (cluster) {
                WidgetsActions.addWidget({
                        widgetName: 'cluster-configuration',
                        params: {
                            platformId: cluster.platformId,
                            clusterId: cluster.title
                        }
                    }, {
                        top: true
                    }
                );
            }
        });

        init();

        function init() {
            setupWatchers();
            PlatformsActions.fetchAccessKeys($scope.selectedItem.platformId, $scope.selectedItem.title);

            var backToPlatformsControl = PageControl.factory({
                label: '← Back to platforms',
                tooltip: '← Back to platforms',
                type: 'control',
                icon: 'b-clusters-browser__icon-back',
                css: '',
                active: false,
                enable: true,
                action: function () {
                    $scope.$emit('open-platforms.clusters-browser');
                }
            });
            $widgetParams.page.addControl(backToPlatformsControl);

            var index = $widgetParams.page.rightTabManager.addTab(TabPage.factory({
                active: true,
                name: 'platform.pages.cluster-info',
                params: {
                    platformId: $scope.platformId
                }
            }), '', 'Properties', 'b-clusters-browser__properties-widget__icon', false);
            $widgetParams.page.rightTabManager.addTab(TabPage.factory({
                active: true,
                name: 'platform.pages.cluster-info.cluster-users'
            }), '', 'Users', 'b-clusters-browser__service-users-widget__icon', false);
            $widgetParams.page.rightTabManager.addTab(TabPage.factory({
                active: true,
                name: 'platform.pages.access-keys',
                params: {
                    mode: 'keytab',
                    platformId: $scope.selectedItem.platformId,
                    clusterId: $scope.selectedItem.title
                }
            }), '', 'Access Keys', 'b-clusters-browser__access-keys-widget__icon', false);

            $widgetParams.page.rightTabManager.setActive(index);

            $widgetParams.page.on(TabPageEvents.ACTIVE_STATE_CHANGE, function (event, active) {
                $scope.isAutoRefresh = active;
            });

            startOrContinueListeningPlatformsStatus();
        }

        function setupWatchers() {
            $scope.$listenTo(ClustersStore, 'change', function () {
                $scope.clusters = ClustersStore.getClusters();
                $scope.selectedItem = ClustersStore.getSelectedCluster();
                if ($scope.clusters.length > 0) {
                    $scope.platformId = $scope.clusters[0].platformId;

                    var newPropertiesJsonSchema = ClustersStore.getMetadata($scope.platformId);
                    var newPropertiesJsonSchemaKeys = Object.keys(newPropertiesJsonSchema);
                    if (!ng.equals(newPropertiesJsonSchemaKeys, $scope.schemaPropertyKeys)) {
                        newPropertiesJsonSchemaKeys.forEach(function (propertyKey) {
                            $scope.schemaPropertyKeys[propertyKey] = true;
                        });
                        /**
                         * New schema can have other set of properties,
                         * so remove non-existing properties from $scope.propertiesJsonSchema object
                         * @type {Array.<*>}
                         */
                        deleteNonExistingKeysFromOldObject($scope.schemaPropertyKeys, newPropertiesJsonSchemaKeys);
                    }
                }
            });

            $scope.$listenTo(ClustersStore, 'clusters-store-CLUSTERS_STATUS_UPDATE', function () {
                $scope.pageErrorMessage = null;
            });

            $scope.$listenTo(ClustersStore, 'clusters-store-CLUSTERS_INDEXATION_STATUS_UPDATE', function () {
                // $scope.pageErrorMessage = null;
            });

            $scope.$listenTo(ClustersStore, 'clusters-store-CLUSTERS_STATUS_UPDATE_REQUEST_ERROR', function () {
                $scope.pageErrorMessage = ClustersStore.getLastClusterStatusError($scope.platformId);
            });

            $scope.$on('$destroy', function () {
                $scope.isAutoRefresh = false;
                stopListeningPlatformsStatus();
            });

            $scope.$watch('isAutoRefresh', function (newValue, oldValue) {
                if ((newValue !== oldValue) && newValue) {
                    startOrContinueListeningPlatformsStatus();
                } else {
                    if (newValue === false) {
                        stopListeningPlatformsStatus();
                    }
                }
            });

        }

        function startOrContinueListeningPlatformsStatus() {
            if (!isListeningPlatformsStatus) {
                isListeningPlatformsStatus = true;
                PlatformsActions.listenersPlatformsStatusIncreaseCount();
            }
        }

        function stopListeningPlatformsStatus() {
            if (isListeningPlatformsStatus) {
                PlatformsActions.listenersPlatformsStatusDecreaseCount();
                isListeningPlatformsStatus = false;
            }
        }

        function indexFlumeStart(cluster) {
            ClustersActions.indexFlumeStart(cluster).then(function () {
                alertsManager.addAlertSuccess({
                    title: 'Success',
                    text: 'Flume index process for cluster "' + cluster.title + '" started successfully.'
                });
            });
        }

        function indexOozieStart(cluster) {
            ClustersActions.indexOozieStart(cluster)
                .then(function () {
                    alertsManager.addAlertSuccess({
                        title: 'Success',
                        text: 'Oozie Workflow index process for cluster "' + cluster.title + '" started successfully.'
                    });
                });
        }
        function indexOozieStop(cluster) {
            ClustersActions.indexOozieStop(cluster)
                .then(function () {
                    alertsManager.addAlertSuccess({
                        title: 'Success',
                        text: 'Oozie Workflow index process for cluster "' + cluster.title + '" stopped successfully.'
                    });
                });
        }

    }
});
