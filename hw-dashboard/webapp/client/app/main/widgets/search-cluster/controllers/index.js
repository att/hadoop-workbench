/*jshint maxparams: 7*/
import {TYPE_CDH, TYPE_HDP, TYPE_KAFKA, TYPE_CASSANDRA} from '../../../../plugins/platform/constants/platform-types';
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('main.SearchClusterController', Controller);

    Controller.$inject = [
        '$rootScope',
        '$scope',
        '$filter',
        'dashboard.searchService',
        'core.utils.string-format',
        '$q',
        'main.alerts.alertsManagerService',
        "dashboard.WidgetsActions",
        'platform.restService',
        'platform.widgetHelper'
    ];
    function Controller($rootScope, $scope, $filter, searchService, stringFormat, $q, dashboardAlertsManager, WidgetsActions, platformService, platformWidgetHelper) {
        let platformWriteAccess = $rootScope.currentUser.features.indexOf('CLUSTER_SETTINGS_WRITE') !== -1;
        ng.extend($scope, {
            searchStr: '',
            clustersFiltered: [],
            platformsClustersFiltered: [],
            plainPlatformsClustersFiltered: [],
            platformsClusters: [],
            requesting: false,
            platformWriteAccess: platformWriteAccess,
            platformTypes: [],
            platformIcons: {
                [TYPE_CDH]: 'b-platforms-browser__icon-platform-cloudera',
                [TYPE_HDP]: 'b-platforms-browser__icon-platform-hdp',
                [TYPE_CASSANDRA]: 'b-platforms-browser__icon-platform-cassandra',
                [TYPE_KAFKA]: 'b-platforms-browser__icon-platform-kafka',
            }
        });
        $scope.dropdownVisible = false;

        platformService.getPlatformTypes().then(function (platformTypes) {
            let requestPromises = {};
            platformTypes.forEach(function (platformType) {
                requestPromises[platformType.id] = platformService.getPlatformTypeMetadata(platformType.id);
            });
            $q.all(requestPromises).then(metadatas => {
                platformTypes.forEach(function (platformType) {
                    platformType.properties = metadatas[platformType.id];
                    platformType.icon = $scope.platformIcons[platformType.id]
                });
            });
            $scope.platformTypes = platformTypes;
        });

        ng.extend($scope, {

            openItem: function (item) {
                if (currentUserHasPlatformReadAccess()) {
                    if (item.itemType == 'platform') {
                        $scope.openPlatform(item);
                    } else if (item.itemType == 'cluster') {
                        $scope.openCluster(item);
                    }
                } else {
                    dashboardAlertsManager.addAlertError({
                        title: "Authorization failure",
                        text: "User \"" + $rootScope.currentUser.login + "\" unauthorized to read cluster settings"
                    });
                }


            },

            openPlatform: function (platform) {

                if (platform) {
                    WidgetsActions.addWidgetSingleton({
                            widgetName: 'platform-manager',
                            params: {
                                platform: platform
                            }
                        },
                        {
                            top: true
                        },
                        null,
                        function (widget) {
                            return (widget.dashboardWidget && widget.dashboardWidget.widgetName == "platform-manager");
                        },
                    );
                }

                $scope.close();
            },
            openCluster: function (cluster) {
                if (!cluster) {
                    return;
                }
                $scope.close();
                WidgetsActions.addWidgetSingleton(
                    {
                        widgetName: 'platform-manager',
                        params: {
                            cluster: cluster
                        }
                    },
                    {
                        top: true
                    },
                    null,
                    function (widget) {
                        return (widget.dashboardWidget && widget.dashboardWidget.widgetName == "platform-manager");
                    },
                );
            },
            deletePlatform: function (platform) {
                var confirmation = {
                    type: "warning",
                    title: (platform.title),
                    text: "Do you really want to remove  platform \"" + (platform.title) + "\"?",
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: continueDelete
                        },
                        {
                            text: "No",
                            style: "cancel",
                            action: function (close) {
                                close();
                            }
                        }
                    ]
                };
                dashboardAlertsManager.addAlerts([confirmation]);
                function continueDelete(close) {
                    close();

                    return platformService.deletePlatform("v1.0", platform.id).then(function success(data) {
                        dashboardAlertsManager.addAlertSuccess({
                            title: platform.title,
                            text: "Platform \"" + platform.title + "\" has been successfully deleted"
                        });
                    }, function error(message) {
                        dashboardAlertsManager.addAlertError({
                            title: platform.title,
                            text: "Failed to delete platform \"" + platform.title + "\" because of the error: " + message
                        });
                    });
                }
            },
            showPlatformsList: function() {
                $scope.dropdownVisible = $scope.dropdownVisible ? false : true;
            },
            createNewPlatform: function (item) {

                var widgetObj = {
                    widgetName: 'platform-manager',
                    params: item.properties.info
                };

                platformWidgetHelper.setNewPlatformNameParam(widgetObj, $scope.searchStr || "New platform");
                platformWidgetHelper.setNewPlatformTypeIdParam(widgetObj, item.id);


                WidgetsActions.addWidget(widgetObj, {top: true});
                $scope.dropdownVisible = false;
                $scope.close();
            },
            close: function () {
                $scope.$emit('close.search-cluster');
            },
            onKeyDown: function (event) {
                var escKeyCode = 27;
                if (event.keyCode === escKeyCode) {
                    $scope.close();
                }
            }
        });

        $scope.$watch('platformsClusters', function (newVal) {
            filterList($scope.searchStr);
        });
        $scope.$watch('searchStr', filterList);

        fetchClusters();

        function filterList(newVal) {
            var result = $scope.platformsClusters.map(function (platform) {
                var plt = ng.copy(platform);
                plt.clusters = $filter('filter')(platform.clusters, {path2Display: newVal});
                return plt;
            });

            result = result.filter(function (platform) {
                return (platform.clusters.length > 0 || platform.title.search(new RegExp(newVal, "i")) !== -1 );
            });

            $scope.platformsClustersFiltered.splice(0);
            $scope.platformsClustersFiltered.push.apply($scope.platformsClustersFiltered, result);
            $scope.clustersFiltered.splice(0);

            result.forEach(function (platform) {
                platform.clusters.forEach(function (cluster) {
                    $scope.clustersFiltered.push(cluster);
                });
            });

            $scope.plainPlatformsClustersFiltered.splice(0);
            $scope.platformsClustersFiltered.forEach(function (platform) {
                platform.itemType = 'platform';
                $scope.plainPlatformsClustersFiltered.push(platform);

                if (platform.clusters.length) {
                    platform.clusters.forEach(function (cluster) {
                        cluster.itemType = 'cluster';
                        $scope.plainPlatformsClustersFiltered.push(cluster);
                    })
                }
                delete platform.clusters;
            });
        }

        function fetchClusters() {
            $scope.requesting = true;
            searchService.getClustersListing('v1.0').then(function (platforms) {
                return platforms.map(function (p) {
                    p.clusters.map(function (cluster) {
                        cluster.path2Display = stringFormat('{0}', cluster.title);
                        cluster.platform = {
                            id: p.id,
                            host: p.host,
                            title: p.title,
                            type: p.type
                        };
                        return cluster;
                    });
                    return p;
                });
            }).then(function (platformsClusters) {
                $scope.platformsClusters = platformsClusters;
            }).catch(function (error) {
                dashboardAlertsManager.addAlertError({
                    title: 'Search clusters',
                    text: "Failed to get clusters because of the error: " + error.message
                });
            }).finally(function () {
                $scope.requesting = false;
            });
        }

        function currentUserHasPlatformReadAccess() {
            return $rootScope.currentUser.features.indexOf('CLUSTER_SETTINGS_READ') !== -1;
        }
    }
});
