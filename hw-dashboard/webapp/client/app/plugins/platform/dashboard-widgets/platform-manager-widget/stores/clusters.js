define(function (require) {
    "use strict";

    let angular = require("angular");

    require('../ngModule').service('platform-manager-widget.ClustersStoreFactory', getStore);

    getStore.$inject = [
        'flux',
        'cluster.indexation.types',
        'cluster.indexation.status',
        'cluster.config.request.types',
        'cluster.config.request.status'
    ];
    function getStore(flux,
                      CLUSTER_INDEXATION_TYPES,
                      CLUSTER_INDEXATION_STATUSES,
                      CLUSTER_CONFIG_REQUEST_TYPES,
                      CLUSTER_CONFIG_REQUEST_STATUS) {
        return function factory(widgetGuid) {
            return flux.createStore(function (exports) {
                var self = this;
                this.platformsClusters = [];
                this.selectedCluster = null;
                this.selectedPlatformId = null;
                this.metadata = [];
                this.lastClusterStatusError = [];

                this.setMetadata = function (metadata, platformId) {
                    self.metadata[platformId] = metadata;
                };

                this.setClusters = function (clusters, platformId) {
                    setSelectedPlatform(platformId);
                    self.platformsClusters[self.selectedPlatformId] = [].concat(clusters);
                    self.emitChange();
                };

                this.setSelectedCluster = function (cluster) {
                    if (cluster === self.selectedCluster) {
                        return;
                    }
                    if (cluster) {
                        setSelectedPlatform(cluster.platformId);
                    }
                    self.selectedCluster = cluster;
                    self.emitChange();
                };

                this.addCluster = function (cluster) {
                    self.platformsClusters[self.selectedPlatformId].push(cluster);
                    self.emitChange();
                };

                this.removeCluster = function (cluster) {
                    self.platformsClusters[self.selectedPlatformId] = self.platformsClusters[self.selectedPlatformId].filter(function (pc) {
                        return pc.info.id !== cluster.info.id;
                    });
                    self.emitChange();
                };

                this.updateCluster = function (cluster) {
                    self.platformsClusters[self.selectedPlatformId] = self.platformsClusters[self.selectedPlatformId].filter(function (pc) {
                        return pc.info.id !== cluster.info.id;
                    });
                    self.platformsClusters[self.selectedPlatformId].push(cluster);
                    self.emitChange();
                };

                this.requestIndexOozieStart = function (cluster) {
                    setNewIndexationStatusAndEmitChange(cluster, CLUSTER_INDEXATION_TYPES.OOZIE, CLUSTER_INDEXATION_STATUSES.STARTING);
                };

                this.requestIndexOozieStop = function (cluster) {
                    setNewIndexationStatusAndEmitChange(cluster, CLUSTER_INDEXATION_TYPES.OOZIE, CLUSTER_INDEXATION_STATUSES.STOPPING);
                };

                this.requestIndexFlumeStart = function (cluster) {
                    setNewIndexationStatusAndEmitChange(cluster, CLUSTER_INDEXATION_TYPES.FLUME, CLUSTER_INDEXATION_STATUSES.STARTING);
                };

                this.requestPullConfigStart = function (cluster) {
                    setNewConfigRequestStatusAndEmitChange(cluster, CLUSTER_CONFIG_REQUEST_TYPES.PULL, CLUSTER_CONFIG_REQUEST_STATUS.RUNNING);
                };

                this.requestPushConfigStart = function (cluster) {
                    setNewConfigRequestStatusAndEmitChange(cluster, CLUSTER_CONFIG_REQUEST_TYPES.PUSH, CLUSTER_CONFIG_REQUEST_STATUS.RUNNING);
                };

                this.requestPullConfigStop = function (cluster) {
                    setNewConfigRequestStatusAndEmitChange(cluster, CLUSTER_CONFIG_REQUEST_TYPES.PULL, CLUSTER_CONFIG_REQUEST_STATUS.NOT_RUNNING);
                };

                this.requestPushConfigStop = function (cluster) {
                    setNewConfigRequestStatusAndEmitChange(cluster, CLUSTER_CONFIG_REQUEST_TYPES.PUSH, CLUSTER_CONFIG_REQUEST_STATUS.NOT_RUNNING);
                };

                /**
                 *
                 * @param {
                 *      platformId,
                 *      clusterId,
                 *      indexation: {
                 *          oozieWorkflow,
                 *          oozieJob
                 *      }
                 *  } clusterIndexationContainer
                 */
                this.updateClusterIndexationStatus = function ({platformId, clusterId, indexation}) {
                    var dirty = false;

                    let p = [];
                    if (self.platformsClusters[platformId]) {
                        p = self.platformsClusters[platformId];
                    }
                    p.forEach(function (pc) {
                        var statusIsDifferent = false;

                        if (pc.info.id === clusterId) {
                            statusIsDifferent = angular.equals(indexation, pc.indexation);
                            pc.indexation = indexation;
                            if (statusIsDifferent) {
                                dirty = true;
                            }
                        }
                        return !statusIsDifferent;
                    });

                    if (dirty) {
                        self.emitChange();
                    }

                    self.emit('clusters-store-CLUSTERS_INDEXATION_STATUS_UPDATE');
                };

                this.updateClustersStatus = function (platforms) {

                    /*
                     let platformsExample = [
                     {
                     id: message.body.id,
                     isOnline: false,
                     isOffline: false,
                     isError: true,
                     isProvisioning: false,
                     statusErrorMessage: message.body.error
                     }
                     ];
                     */
                    platforms.forEach((platform) => {
                        if (self.lastClusterStatusError[platform.id]) {
                            self.lastClusterStatusError[platform.id] = null;
                        }
                    });

                    var dirty = false;
                    // message types
                    [
                        {status: 'isOnline'},
                        {status: 'isOffline'},
                        //@TODO: implement cluster deletion on platform delete
                        // {status: 'isDeleted'},
                        {status: 'isDestroyed'},
                        {status: 'isDestroying'},
                        {status: 'isOffline'},
                        {status: 'isError', messageFieldName: 'statusErrorMessage'},
                    ]
                        .forEach((messageType) => {
                            var newPlatformStatuses = {};
                            platforms.forEach(function (p) {
                                newPlatformStatuses[p.id] =
                                {
                                    status: p[messageType.status]
                                };
                                if (messageType.messageFieldName) {
                                    newPlatformStatuses[p.id][messageType.messageFieldName] = p[messageType.messageFieldName];
                                }
                            });

                            self.platformsClusters.forEach(function (p) {
                                p.forEach(function (pc) {
                                    var statusIsDifferent = false, statusMessageIsDifferent = false;
                                    if (newPlatformStatuses[pc.platformId] !== undefined) {
                                        statusIsDifferent = pc[messageType.status] !== newPlatformStatuses[pc.platformId].status;

                                        if (messageType.messageFieldName) {
                                            statusMessageIsDifferent = pc[messageType.messageFieldName] !== newPlatformStatuses[pc.platformId][messageType.messageFieldName];
                                        }
                                    }

                                    if (statusIsDifferent) {
                                        pc[messageType.status] = newPlatformStatuses[pc.platformId].status;
                                        dirty = true;
                                    }
                                    if (statusMessageIsDifferent) {
                                        pc[messageType.messageFieldName] = newPlatformStatuses[pc.platformId][messageType.messageFieldName];
                                        dirty = true;
                                    }
                                });
                            });
                        });

                    if (self.selectedPlatformId) {
                        var newClustersOnlineStatuses = {};

                        var existingClustersOnlineStatuses = {};
                        self.platformsClusters[self.selectedPlatformId].forEach(function (c) {
                            existingClustersOnlineStatuses[c.info.id] = c.isOnline;
                        });

                        self.platformsClusters[self.selectedPlatformId].forEach(function (c) {
                            var statusOnlineIsDifferent = newClustersOnlineStatuses[c.info.id] !== undefined && c.isOnline !== newClustersOnlineStatuses[c.info.id];
                            if (statusOnlineIsDifferent) {
                                c.isOnline = newClustersOnlineStatuses[c.info.id];
                                dirty = true;
                            }
                        });

                    }
                    if (dirty) {
                        self.emitChange();
                    }

                    self.emit('clusters-store-CLUSTERS_STATUS_UPDATE');
                };

                this.updateClustersStatusError = function (error, platformId) {
                    self.lastClusterStatusError[platformId] = error;
                    self.emit('clusters-store-CLUSTERS_STATUS_UPDATE_REQUEST_ERROR');
                };

                this.on('platform-manager-UPDATE_CLUSTERS_METADATA' + widgetGuid, this.setMetadata);
                this.on('platform-manager-UPDATE_CLUSTERS' + widgetGuid, this.setClusters);
                this.on('platform-manager-UPDATE_SELECTED_CLUSTER' + widgetGuid, this.setSelectedCluster);
                this.on('platform-manager-ADD_CLUSTER' + widgetGuid, this.addCluster);
                this.on('platform-manager-REMOVE_CLUSTER' + widgetGuid, this.removeCluster);
                this.on('platform-manager-UPDATE_CLUSTER' + widgetGuid, this.updateCluster);
                this.on('platform-manager-UPDATE_CLUSTERS_STATUS' + widgetGuid, this.updateClustersStatus);
                this.on('platform-manager-UPDATE_CLUSTER_INDEXATION_STATUS' + widgetGuid, this.updateClusterIndexationStatus);
                this.on('platform-manager-INDEX-OOZIE-START' + widgetGuid, this.requestIndexOozieStart);
                this.on('platform-manager-INDEX-OOZIE-STOP' + widgetGuid, this.requestIndexOozieStop);
                this.on('platform-manager-INDEX-FLUME-START' + widgetGuid, this.requestIndexFlumeStart);
                this.on('platform-manager-UPDATE_CLUSTERS_STATUS_REQUEST_ERROR' + widgetGuid, this.updateClustersStatusError);
                this.on('platform-manager-PULL-CONFIG-START' + widgetGuid, this.requestPullConfigStart);
                this.on('platform-manager-PULL-CONFIG-STOP' + widgetGuid, this.requestPullConfigStop);
                this.on('platform-manager-PUSH-CONFIG-START' + widgetGuid, this.requestPushConfigStart);
                this.on('platform-manager-PUSH-CONFIG-STOP' + widgetGuid, this.requestPushConfigStop);

                exports.getMetadata = function (platformId) {
                    return self.metadata[platformId];
                };

                exports.getClusters = function (platformId) {
                    if (platformId !== undefined) {
                        setSelectedPlatform(platformId);
                    }
                    return self.platformsClusters[self.selectedPlatformId];
                };

                exports.getSelectedCluster = function () {
                    return self.selectedCluster;
                };

                exports.getLastClusterStatusError = function (platformId) {
                    return self.lastClusterStatusError[platformId];
                };

                function setSelectedPlatform(platformId) {
                    self.selectedPlatformId = platformId;

                    if (self.selectedPlatformId !== undefined && !self.platformsClusters[self.selectedPlatformId]) {
                        self.platformsClusters[self.selectedPlatformId] = []
                    }
                }

                function setNewConfigRequestStatusAndEmitChange({id: clusterId, platformId}, type, newStatus) {
                    let dirty = false;
                    let p = [];
                    if (self.platformsClusters[platformId]) {
                        p = self.platformsClusters[platformId];
                    }

                    let [updatedCluster] = p.filter((platformCluster) => (platformCluster.id === clusterId));
                    if (updatedCluster) {
                        let oldStatus = updatedCluster.configRequest[type].status;
                        if (oldStatus !== newStatus) {
                            updatedCluster.configRequest[type].status = newStatus;
                            dirty = true;
                        }
                    }
                    if (dirty) {
                        self.emitChange();
                    }
                }

                function setNewIndexationStatusAndEmitChange({id: clusterId, platformId}, type, newStatus) {
                    let dirty = false;
                    let p = [];
                    if (self.platformsClusters[platformId]) {
                        p = self.platformsClusters[platformId];
                    }

                    let [updatedCluster] = p.filter((platformCluster) => (platformCluster.id === clusterId));
                    if (updatedCluster) {
                        let {
                            indexation: {
                                [type]: {status}
                            }
                        } = updatedCluster;
                        if (status !== newStatus) {
                            updatedCluster.indexation[type].status = newStatus;
                            dirty = true;
                        }
                    }
                    if (dirty) {
                        self.emitChange();
                    }
                    self.emit('clusters-store-CLUSTERS_INDEXATION_STATUS_UPDATE');
                }
            });
        }
    }
});
