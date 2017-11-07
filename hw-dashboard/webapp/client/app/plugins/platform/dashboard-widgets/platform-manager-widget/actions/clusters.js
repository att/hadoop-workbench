define(function (require) {
    "use strict";

    require('../ngModule').factory('platform-manager-widget.ClustersActionsFactory', getFactory);

    getFactory.$inject = [
        'flux',
        'platform.restService'
    ];
    function getFactory(flux, restService) {
        return function factory(widgetGuid) {
            return {
                setClusters: function (clusters, platformId) {
                    flux.dispatch('platform-manager-UPDATE_CLUSTERS' + widgetGuid, clusters, platformId);
                },
                selectCluster: function (cluster) {
                    flux.dispatch('platform-manager-UPDATE_SELECTED_CLUSTER' + widgetGuid, cluster);
                },
                fetchClusters: function (platform) {
                    return restService.silent().getAllPlatformClusters('v1.0', platform).then(function (clusters) {
                        flux.dispatch('platform-manager-UPDATE_CLUSTERS' + widgetGuid, clusters, platform.id);
                    }).catch(function () {
                        flux.dispatch('platform-manager-UPDATE_CLUSTERS' + widgetGuid, [], platform.id);
                    });
                },
                fetchMetadata: function (platformId) {
                    return restService.getClustersMetadata('v1.0', platformId).then(function (metadata) {
                        flux.dispatch('platform-manager-UPDATE_CLUSTERS_METADATA' + widgetGuid, metadata, platformId);
                    });
                },
                updateCluster: function (cluster) {
                    return restService.updateCluster('v1.0', cluster.platformId, cluster.info.id, cluster).then(function (data) {
                        flux.dispatch('platform-manager-UPDATE_CLUSTER' + widgetGuid, cluster);
                    });
                },
                indexOozieStart: function (cluster, path) {
                    flux.dispatch('platform-manager-INDEX-OOZIE-START' + widgetGuid, cluster);
                    return restService.indexOozieStart('v1.0', cluster.platformId, cluster.info.id, path);
                },
                indexOozieStop: function (cluster) {
                    flux.dispatch('platform-manager-INDEX-OOZIE-STOP' + widgetGuid, cluster);
                    return restService.indexOozieStart('v1.0', cluster.platformId, cluster.info.id);
                },
                indexFlumeStart: function (cluster) {
                    flux.dispatch('platform-manager-INDEX-FLUME-START' + widgetGuid, cluster);
                    return restService.indexFlumeStart(cluster.platformId, cluster.info.id);
                },
                testConnectionHdfs: function (cluster) {
                    return restService.getClusterTestHdfs('v1.0', cluster.platformId, cluster.info.id, cluster.title).then(function () {
                        flux.dispatch('platform-manager-TEST_HDFS', cluster);
                    });
                },
                pullConfig: function (cluster) {
                    flux.dispatch('platform-manager-PULL-CONFIG-START' + widgetGuid, cluster);
                    return restService.pullConfig(cluster).then(function () {
                        flux.dispatch('platform-manager-PULL-CONFIG-STOP' + widgetGuid, cluster);
                    }, function () {
                        flux.dispatch('platform-manager-PULL-CONFIG-STOP' + widgetGuid, cluster);
                    });
                },
                pushConfig: function (cluster) {
                    flux.dispatch('platform-manager-PUSH-CONFIG-START' + widgetGuid, cluster);
                    return restService.pushConfig(cluster).then(function () {
                        flux.dispatch('platform-manager-PUSH-CONFIG-STOP' + widgetGuid, cluster);
                    }, function () {
                        flux.dispatch('platform-manager-PUSH-CONFIG-STOP' + widgetGuid, cluster);
                    });
                }
            };
        }
    }
});
