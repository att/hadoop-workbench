define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform-manager-widget.PlatformsActionsFactory', getFactory);

    getFactory.$inject = [
        'flux',
        'platform.restService',
        'platform.websocketService',
        '$q',
        '$rootScope',
        'platform.locationService', 'platform.models.ClusterIndexation'
    ];
    function getFactory(flux, restService, websocketService, $q, $rootScope, LocationService, ClusterIndexation) {
        return function factory(widgetGuid) {
            var ws = null;
            var listenersPlatformsStatusCount = 0;

            function _fetchAccessKeys (platformId, clusterId) {
                return $q.all([
                    restService.getAccessKeys('v1.0', true, platformId, clusterId),
                    restService.getAccessKeys('v1.0', false, platformId, clusterId)
                ]).then(function (results) {
                    flux.dispatch('platform-manager-UPDATE_ACCESS_KEYS', results[0].concat(results[1]));
                }, function () {
                    return [];
                });
            }

            return {
                fetchPlatforms: function () {
                    return restService.silent().getAllPlatforms('v1.0').then(function (platforms) {
                        platforms.forEach(function(p, i){
                            platforms[i] = LocationService.setLocationFiltered(p);
                        });
                        var requestsPlatformsAccessInfo = platforms.map(function (p) {
                            return restService.getPlatformAccessInfo('v1.0', p.id).then(function (accessInfo) {
                                p.accessInfo = accessInfo;
                            }, function (error) {
                                return [];
                            });
                        });
                        return $q.all(requestsPlatformsAccessInfo).then(function () {
                            flux.dispatch('platform-manager-UPDATE_PLATFORMS', platforms);
                        });
                    });
                },

                fetchPlatform: function (platformId) {
                    // @TODO : implement platform update on new platform came from websocket updates
                },
                fetchPlatformTypes: function () {
                    return restService.getPlatformTypes().then(function (metadata) {
                        flux.dispatch('platform-manager-UPDATE_PLATFORM_TYPES', metadata);
                    });
                },

                fetchPlatformTypeMetadata: function (typeId) {
                    return restService.getPlatformTypeMetadata(typeId).then(function (metadata) {
                        flux.dispatch('platform-manager-UPDATE_PLATFORM_TYPE_METADATA', typeId, metadata);
                    });
                },

                listenersPlatformsStatusDecreaseCount: function () {
                    if (listenersPlatformsStatusCount > 0) {
                        listenersPlatformsStatusCount--;
                    }
                    if (listenersPlatformsStatusCount == 0) {
                        _stopListeningPlatformStatus();
                    }
                },

                listenersPlatformsStatusIncreaseCount: function () {
                    if (listenersPlatformsStatusCount == 0) {
                        _startListeningPlatformStatus();
                    }
                    listenersPlatformsStatusCount++;
                },
                fetchAccessKeys: function (platformId, clusterId) {
                    return _fetchAccessKeys(platformId, clusterId);
                },
                setPlatforms: function (platforms) {
                    platforms.forEach(function(p, i){
                        platforms[i] = LocationService.setLocationFiltered(p);
                    });
                    flux.dispatch('platform-manager-UPDATE_PLATFORMS', platforms);
                },
                selectPlatform: function (platform) {
                    flux.dispatch('platform-manager-UPDATE_SELECTED_PLATFORM' + widgetGuid, platform);
                },
                selectPlatformById: function (platformId) {
                    flux.dispatch('platform-manager-UPDATE_SELECTED_PLATFORM_BY_ID' + widgetGuid, platformId);
                },
                createPlatform: function (platform) {
                    return restService.createPlatform('v1.0', platform).then(function (data) {
                        platform.id = data.platformId;
                        restService.updatePlatformAccessInfo('v1.0', platform.id, platform.accessInfo).then(function () {
                            flux.dispatch('platform-manager-ADD_PLATFORM', platform);
                        });
                    });
                },
                updatePlatform: function (platform) {
                    return restService.updatePlatform('v1.0', platform).then(function () {
                        restService.updatePlatformAccessInfo('v1.0', platform.id, platform.accessInfo).then(function () {
                            platform = LocationService.setLocationFiltered(platform);
                            flux.dispatch('platform-manager-UPDATE_PLATFORM', platform);
                        });
                    });
                },
                removePlatform: function (platform) {
                    return restService.deletePlatform('v1.0', platform.id).then(function () {
                        flux.dispatch('platform-manager-REMOVE_PLATFORM', platform);
                    });
                },
                removeAccessKey: function (file, platformId, clusterId) {
                    return restService.deleteAccessKeyFile('v1.0', platformId, clusterId, file.id).then(function () {
                        flux.dispatch('platform-manager-REMOVE_ACCESS_KEY', file);
                    });
                },
                uploadAccessKey: function (fileItem, isPEM, platformId, clusterId) {
                    return uploadFile(fileItem, fileItem.file.name, '', isPEM, platformId, clusterId)
                        .then(function () {
                            _fetchAccessKeys(platformId, clusterId);
                    });
                },
                createAccessKey: function (key, platformId, clusterId) {
                    return restService.createAccessKeyFile(key, platformId, clusterId).then(function (data) {
                        key.id = data.id;
                        key.type = "keytab";
                        key.name = key.principal;
                        flux.dispatch('platform-manager-ADD_ACCESS_KEY', key);
                    });
                },
                testConnectionApi: function (platform) {
                    return restService.getPlatformTestApi('v1.0', platform.id).then(function () {
                        flux.dispatch('platform-manager-TEST_API_PLATFORM', platform);
                    });
                }
            };

            function uploadFile(file, name, description, isPEM, platformId, clusterId) {
                var defer = $q.defer();
                upload();

                function upload() {
                    file.url = restService.getUploadAccessKeyUrl('v1.0', isPEM, name, platformId, clusterId);
                    file.onSuccess = function (response) {
                        $rootScope.$apply(function () {
                            defer.resolve(response);
                        });
                    };
                    file.onError = function (response, status, headers) {
                        defer.reject(response);
                    };
                    file.upload();
                }

                return defer.promise;
            }


            function _startListeningPlatformStatus() {
                var channelName = "platform_status";
                ws = websocketService.connectPlatformsStatusChannel();
                ws.onMessage(function (event) {
                    var message;
/*
                    var platformStatuses = {
                        online: 'isOnline',
                        offline: 'isOffline',
                    };
*/
                    try {
                        message = JSON.parse(event.data);
                    } catch (e) {
                        // ignore
                    }


                    if (message.channelId == channelName) {
                        processPlatformsMessage(message);
                    }

                });

                ws.onOpen(function () {
                    // console.log('connection opened');
                });

                ws.onError(function (event) {
                    // console.log('connection Error', event);
                });

                ws.onClose(function (event) {
                    // console.log('connection closed', event);
                });

            }

            function processPlatformsMessage(message) {
                let defaultStatus = {
                    isOnline: false,
                    isOffline: false,
                    isDestroyed: false,
                    isDestroying: false,
                    isError: false,
                    isProvisioning: false,
                };
                var platforms = [];
                if (!message.body) {
                    return;
                }
                if (message.body.type == "status") {
                    let errorMessageContainer = {};
                    if (message.body.status == "error") {
                        errorMessageContainer.statusErrorMessage = message.body.message;
                    }
                    platforms.push(
                        ng.extend(defaultStatus, errorMessageContainer, {
                            id: message.body.id,
                            // all statuses are exclusive
                            // all statuses:
                            // online|offline|unknown|provisioning|error|destroyed|destroying
                            // actual for "status" type message:
                            // online|offline|unknown

                            isOnline: message.body.status == "online",
                            isOffline: ["offline", "unknown"].indexOf(message.body.status) > -1,
                            isError: "error" === message.body.status,
                            isDestroyed: "destroyed" === message.body.status,
                        })
                    );
                    flux.dispatch('platform-manager-UPDATE_PLATFORMS_STATUS', platforms);
                    //@TODO: refactor: remove flux, use redux
                    flux.dispatch('platform-manager-UPDATE_CLUSTERS_STATUS' + widgetGuid, platforms);
                } else if (message.body.type == "cluster_status") {
                    // var messageExample  = {
                    //     "channelId": "platform_update",
                    //     "body": {
                    //         "type": "cluster_status",
                    //         "platformId": 1,
                    //         "clusterId": "cluster1",
                    //         "oozieWorkflow": {
                    //             "indexing": true,
                    //             "progress": 123, // optional
                    //             "lastUpdate": "12345" // Unix time in millis
                    //         },
                    //         "oozieJob": {
                    //             "indexing": true,
                    //             "progress": 123, // optional
                    //             "lastUpdate": "12345" // Unix time in millis
                    //         }
                    //     }
                    // };

                    var clusterIndexation = {
                        platformId: message.body.platformId,
                        clusterId: message.body.clusterId,
                        indexation: ClusterIndexation.processWebsocketApiResponse({
                            oozieWorkflow: message.body.oozieWorkflow,
                            oozieJob: message.body.oozieJob
                        })
                    };
                    //@TODO: refactor: remove flux, use redux
                    flux.dispatch('platform-manager-UPDATE_CLUSTER_INDEXATION_STATUS' + widgetGuid, clusterIndexation);
                } else if (message.body.type == "platform_list") {
                    if (ng.isArray(message.body.platforms)) {
                        platforms = message.body.platforms.map((id) => ({id}));
                        flux.dispatch('platform-manager-UPDATE_PLATFORMS_STATUS_LIST', platforms);
                        //@TODO: refactor: remove flux, use redux
                        //@TODO: implement cluster removal and widget notification if cluster was open on cluster delete
                        // flux.dispatch('platform-manager-UPDATE_CLUSTERS_STATUS_LIST' + widgetGuid, platformIds);
                    } else {
                        console.log("Platform message status_list has incorrect format", message);
                    }

                } else if (message.body.type == "process") {
                    if (message.body.status === "provisioning") {
                        platforms.push(
                            ng.extend(defaultStatus, {
                                id: message.body.id,
                                isProvisioning: true,
                                statusProvisioningProgress: message.body.progress
                            })
                        );
                        flux.dispatch('platform-manager-UPDATE_PLATFORMS_STATUS', platforms);
                        //@TODO: refactor: remove flux, use redux
                        flux.dispatch('platform-manager-UPDATE_CLUSTERS_STATUS' + widgetGuid, platforms);
                    } else if (message.body.status === "destroying") {
                        platforms.push(
                            ng.extend(defaultStatus, {
                                id: message.body.id,
                                isDestroying: true,
                                statusDestroyingProgress: message.body.progress
                            })
                        );
                        flux.dispatch('platform-manager-UPDATE_PLATFORMS_STATUS', platforms);
                        //@TODO: refactor: remove flux, use redux
                        flux.dispatch('platform-manager-UPDATE_CLUSTERS_STATUS' + widgetGuid, platforms);
                    }
                } else if (message.body.type == "properties_update") {
                    flux.dispatch('platform-manager-UPDATE_PLATFORM_PROPERTIES', message.body.id, message.body.properties);
                }
            }

            function _stopListeningPlatformStatus() {
                ws.close();
            }

        }
    }
});
