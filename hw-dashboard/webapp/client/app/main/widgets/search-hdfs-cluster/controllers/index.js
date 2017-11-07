/*jshint maxparams: 7*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('main.SearchHdfsClusterController', Controller);

    Controller.$inject = [
        '$scope',
        'dashboard.searchService',
        "dashboard.WidgetsActions",
        'main.alerts.alertsManagerService'
    ];
    function Controller($scope, searchService, WidgetsActions, alertsManagerService) {
        ng.extend($scope, {
            searchStr: '',
            clustersFiltered: [],
            clusters: [],
            requesting: false
        });

        ng.extend($scope, {
            openCluster: function (cluster) {
                if (!cluster) {
                    return;
                }
                $scope.close();

                var c = ng.extend({}, cluster); // clear ng-repeat $id
                WidgetsActions.addWidget({
                    widgetName: 'hdfs-manager',
                    params: {
                        src: {
                            platform: c.platform,
                            cluster: c
                        }
                    }
                }, {top: true});
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

        $scope.$watch('clusters', function (newVal) {
            filterList($scope.searchStr);
        });
        $scope.$watch('searchStr', filterList);

        fetchClusters();

        function filterList(newVal) {
            //TODO(maximk): check if we need case insensitive comparison here
            var result = $scope.clusters.filter(function (cluster) {
                return newVal === "" || cluster.id.indexOf(newVal) !== -1;
            });
            $scope.clustersFiltered.splice(0);
            $scope.clustersFiltered.push.apply($scope.clustersFiltered, result);
        }

        function fetchClusters() {
            $scope.requesting = true;
            searchService.getClustersListing('v1.0', false).then(function (clusters) {
                $scope.clusters = clusters;
                //cluster.path2Display = stringFormat('{0}', cluster.title);
            }).catch(function (error) {
                alertsManagerService.addAlertError({
                    title: 'Search clusters',
                    text: "Failed to get clusters because of the error: " + error.message
                });
            }).finally(function () {
                $scope.requesting = false;
            });
        }
    }
});
