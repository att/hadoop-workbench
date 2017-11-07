define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').service('platform-manager-widget.PlatformsStoreFactory', getStore);
    var $ = require("jquery");

    let statusTypes = [
        {status: 'isOnline'},
        {status: 'isOffline'},
        {status: 'isDestroyed'},
        {status: 'isDestroying'},
        {status: 'isProvisioning', messageFieldName: 'statusProvisioningProgress'},
        {status: 'isError', messageFieldName: 'statusErrorMessage'},
    ];


    let platformFieldsToCloneOnUpdate = [];
    statusTypes.forEach((statusType) => {
        // push status field name
        platformFieldsToCloneOnUpdate.push(statusType.status);
        // push status messages field name
        if (statusType.messageFieldName) {
            platformFieldsToCloneOnUpdate.push(statusType.messageFieldName);
        }
    });


    getStore.$inject = ['flux'];
    function getStore(flux) {
        return function factory(widgetGuid) {

            return flux.createStore(function (exports) {
                var self = this;
                this.platforms = [];
                this.accessKeys = [];
                this.types = [];
                this.typeMetadata = {};
                this.selectedPlatform = null;
                this.lastPlatformStatusError = null;

                this.setPlatforms = function (platforms) {
                    self.platforms = [].concat(platforms);
                    self.emitChange();
                };

                this.updatePlatforms = function (platforms) {
                    let cloneMap = [];
                    /**
                     * Save status data from existing platforms
                     */
                    self.platforms.forEach((p) =>
                        platforms.some((pNew) => {
                            if (p.id === pNew.id) {
                                cloneMap.push({
                                    oldPlatform: p,
                                    newPlatform: pNew
                                });
                                return true;
                            }
                        })
                    );
                    cloneMap.forEach((map) => {
                        copyTransientFields(map.newPlatform, map.oldPlatform);
                    });
                    self.platforms = [].concat(platforms);
                    self.emitChange();

                    function copyTransientFields(target, source) {
                        platformFieldsToCloneOnUpdate.forEach((field) => {
                            target[field] = source[field]
                        })
                    }
                };

                this.setTypes = function (types) {
                    self.types = types;
                    self.emitChange();
                };

                this.setTypeMetadata = function (typeId, metadata) {
                    self.typeMetadata[typeId] = metadata;
                    self.emitChange();
                };

                this.setSelectedPlatform = function (platform) {
                    self.selectedPlatform = platform;
                    self.emitChange();
                };

                this.setSelectedPlatformById = function (platformId) {
                    if (platformId === undefined || platformId === null) {
                        return;
                    }

                    if (self.selectedPlatform && self.selectedPlatform.id == platformId) {
                        return;
                    }

                    var platforms = self.platforms;
                    var platformToSelect = platforms.filter(function (p) {
                        return p.id === platformId;
                    })[0];
                    if (!platformToSelect) {
                        if (platforms.length) {
                            platformToSelect = platforms[0];
                        }
                    }

                    self.selectedPlatform = platformToSelect;
                    self.emitChange();
                };

                this.addPlatform = function (platform) {
                    self.platforms.push(platform);
                    self.selectedPlatform = platform;
                    self.emitChange();
                };

                this.removePlatform = function (platform) {
                    self.platforms = self.platforms.filter(function (p) {
                        return p.id !== platform.id;
                    });
                    if (self.selectedPlatform && self.selectedPlatform.id === platform.id) {
                        if (self.platforms.length > 0) {
                            self.selectedPlatform = self.platforms[0];
                        } else {
                            self.selectedPlatform = null;
                        }
                    }
                    self.emitChange();
                };

                this.updatePlatform = function (platform) {
                    let index = -1;
                    self.platforms.some((p, i) => {
                        if (p.id === platform.id) {
                            index = i;
                            return true;
                        }
                        return false;
                    });
                    if (index !== -1) {
                        self.platforms.splice(index, 1, platform);
                        self.emitChange();
                    }
                };

                this.updatePlatformProperties = function (platformId, properties) {
                    let index = -1;
                    self.platforms.some((p, i) => {
                        if (p.id === platformId) {
                            index = i;
                            return true;
                        }
                        return false;
                    });
                    if (index !== -1) {
                        var targetPlatform = self.platforms[index];
                        if (!targetPlatform.api) {
                            targetPlatform.api = {};
                        }
                        if (ng.isArray(properties)) {
                            let changed = false;
                            properties.forEach((property) => {
                                if (targetPlatform.api[property.name] != property.value) {
                                    targetPlatform.api[property.name] = property.value;
                                }
                            });
                            if (changed) {
                                self.emitChange();
                            }
                        }
                    }
                };

                this.updateAccessKeys = function (accessKeys) {
                    self.accessKeys = accessKeys;
                    self.emitChange();
                };

                this.addAccessKeys = function (file) {
                    if (self.accessKeys.some(function (f) {
                            return f.id === file.id;
                        })) {
                        return;
                    }
                    self.accessKeys.push(file);
                    self.emitChange();
                };

                this.removeAccessKeys = function (file) {
                    self.accessKeys = self.accessKeys.filter(function (f) {
                        return f.id !== file.id;
                    });
                    self.emitChange();
                };

                this.updatePlatformsStatusList = function (platforms) {
                    var dirty = false;
                    var existingPlatformIds = platforms.map(({id}) => id);
                    var platformToDeleteIndexes = [];
                    self.platforms.forEach(function (p, index) {
                        if (existingPlatformIds.indexOf(p.id) === -1) {
                            platformToDeleteIndexes.push(index);
                            dirty = true;
                        }
                    });
                    // removing items in reverse order
                    if (platformToDeleteIndexes.length > 0) {
                        for (var j = platformToDeleteIndexes.length -1; j >= 0; j--){
                            self.platforms.splice(platformToDeleteIndexes[j],1);
                        }
                    }
                    if (dirty) {
                        self.emitChange();
                        self.emit('platforms-store-PLATFORMS_STATUS_UPDATE');
                    }
                };

                // online|offline|unknown|provisioning|error|destroyed|destroying
                this.updatePlatformsStatus = function (platforms) {
                    if (self.lastPlatformStatusError) {
                        self.lastPlatformStatusError = null;
                    }

                    var dirty = false;

                    // message types
                    statusTypes
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

                            self.platforms.forEach(function (p) {
                                var statusIsDifferent = false, statusMessageIsDifferent = false;
                                if (newPlatformStatuses[p.id] !== undefined) {
                                    statusIsDifferent = p[messageType.status] !== newPlatformStatuses[p.id].status;

                                    if (messageType.messageFieldName) {
                                        statusMessageIsDifferent = p[messageType.messageFieldName] !== newPlatformStatuses[p.id][messageType.messageFieldName];
                                    }
                                }

                                if (statusIsDifferent) {
                                    p[messageType.status] = newPlatformStatuses[p.id].status;
                                    dirty = true;
                                }
                                if (statusMessageIsDifferent) {
                                    p[messageType.messageFieldName] = newPlatformStatuses[p.id][messageType.messageFieldName];
                                    dirty = true;
                                }
                            });
                        });

                    if (dirty) {
                        self.emitChange();
                        self.emit('platforms-store-PLATFORMS_STATUS_UPDATE');
                    }
                };

                this.updatePlatformsStatusError = function (error) {
                    self.lastPlatformStatusError = error;
                    self.emit('platforms-store-PLATFORMS_STATUS_UPDATE_REQUEST_ERROR');
                };

                this.on('platform-manager-UPDATE_PLATFORM_TYPE_METADATA', this.setTypeMetadata);
                this.on('platform-manager-UPDATE_PLATFORM_TYPES', this.setTypes);
                this.on('platform-manager-UPDATE_PLATFORMS', this.updatePlatforms);
                this.on('platform-manager-UPDATE_SELECTED_PLATFORM' + widgetGuid, this.setSelectedPlatform);
                this.on('platform-manager-UPDATE_SELECTED_PLATFORM_BY_ID' + widgetGuid, this.setSelectedPlatformById);
                this.on('platform-manager-ADD_PLATFORM', this.addPlatform);
                this.on('platform-manager-REMOVE_PLATFORM', this.removePlatform);
                this.on('platform-manager-UPDATE_PLATFORM', this.updatePlatform);
                this.on('platform-manager-UPDATE_PLATFORM_PROPERTIES', this.updatePlatformProperties);
                this.on('platform-manager-UPDATE_ACCESS_KEYS', this.updateAccessKeys);
                this.on('platform-manager-ADD_ACCESS_KEY', this.addAccessKeys);
                this.on('platform-manager-REMOVE_ACCESS_KEY', this.removeAccessKeys);
                this.on('platform-manager-UPDATE_PLATFORMS_STATUS_LIST', this.updatePlatformsStatusList);
                this.on('platform-manager-UPDATE_PLATFORMS_STATUS', this.updatePlatformsStatus);
                this.on('platform-manager-UPDATE_PLATFORMS_STATUS_REQUEST_ERROR', this.updatePlatformsStatusError);


                exports.getTypeMetadata = function (typeId) {
                    if (self.typeMetadata[typeId]) {
                        return self.typeMetadata[typeId];
                    }
                    return null;
                };

                exports.getTypes = function () {
                    return self.types;
                };

                exports.getPlatforms = function () {
                    return self.platforms;
                };

                exports.getSelectedPlatform = function () {
                    return self.selectedPlatform;
                };

                exports.getAccessKeys = function (type) {
                    switch (type) {
                        case 'PEM':
                            return self.accessKeys.filter(function (key) {
                                return key.type === 'PEM';
                            });
                        case 'keytab':
                            return self.accessKeys.filter(function (key) {
                                return key.type === 'keytab';
                            });
                        default:
                            return self.accessKeys;
                    }
                };

                exports.getLastPlatformStatusError = function () {
                    return self.lastPlatformStatusError;
                }
            });
        }
    }
});
