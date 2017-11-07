/*jshint maxparams: 13*/
import { packDistribution, unpackDistribution } from '../../../helpers/platform-type-version-converter';

define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('platform.pages.PlatformInfoPageController', Controller);

    var objectDeepDiff = require('object-deep-diff');
    var deepExtend = require('deep-extend');

    Controller.$inject = [
        '$scope',
        '$widgetParams',
        'dashboard.models.PageControl',
        'platform-manager-widget.Widget.PlatformsActions',
        'platform-manager-widget.Widget.PlatformsStore',
        'shared.jsonSchemaBuilder',
        'main.alerts.alertsManagerService',
        'platformWriteAccess'
    ];
    function Controller($scope, $widgetParams, PageControl, PlatformsActions, PlatformsStore, jsonSchemaBuilder, alertsManager, platformWriteAccess) {
        var saveControl;

        $scope.platform = PlatformsStore.getSelectedPlatform();

        var lastPopulatedPlatform = null;
        var lastActiveSchema = null;

        var activeSchema = null;
        if ($scope.platform) {
            activeSchema = getOrFetchTypeMetadata($scope.platform.type);
        }

        ng.extend($scope, {
            requesting: !!$scope.platform,
            page: $widgetParams.page,
            propertiesJsonSchema: {
                info: {},
                apiAccess: {},
                sshAccess: {}
            },
            isReadonly: false,
            accessKeysPEM: PlatformsStore.getAccessKeys('PEM')
        });

        tryToSetUpAndPopulateJsonSchemaForPlatform($scope.propertiesJsonSchema, $scope.platform, activeSchema);

        ng.extend($scope, {
            save: save
        });

        setUpControls();

        function setUpControls() {
            saveControl = PageControl.factory({
                label: '',
                tooltip: 'Save',
                icon: 'platform-info__icon-save',
                action: save
            });
            if (platformWriteAccess) {
                $widgetParams.page.addControl(saveControl);
            }

            $scope.$listenTo(PlatformsStore, 'change', function () {
                $scope.platform = PlatformsStore.getSelectedPlatform();
                var typeId = $scope.platform ? $scope.platform.type : null;
                var newSchema = getOrFetchTypeMetadata(typeId);
                if (newSchema) {
                    activeSchema = newSchema;
                    if (activeSchema) {
                        if (activeSchema && activeSchema.sshAccess) {
                            $scope.accessKeysPEM = PlatformsStore.getAccessKeys('PEM');
                        }
                        $scope.requesting = false;
                        tryToSetUpAndPopulateJsonSchemaForPlatform($scope.propertiesJsonSchema, $scope.platform, activeSchema);
                    }
                }
            });
        }

        function tryToSetUpAndPopulateJsonSchemaForPlatform(propertiesJsonSchema, newPlatformValue, schema, list) {
            if (schema) {
                var usedPlatformValue = null;

                if (schema !== lastActiveSchema) {
                    lastActiveSchema = schema;
                    lastPopulatedPlatform = null;
                    usedPlatformValue = newPlatformValue;

                    tryToSetUpPropertiesJsonSchemaForPlatform(propertiesJsonSchema, schema, list);
                } else {
                    /**
                     * Verify if is same platform, than user provided changes will be stored
                     * @param newLoadedPlatform
                     */
                    var isPlatformNotChanged = lastPopulatedPlatform && newPlatformValue && (newPlatformValue.id === lastPopulatedPlatform.id);
                    if (isPlatformNotChanged) {
                        var currentData = convertJsonSchemaToPlatformData(propertiesJsonSchema);
                        usedPlatformValue = mergeChangesOnUpdatedSource(lastPopulatedPlatform, newPlatformValue, currentData);
                    } else {
                        usedPlatformValue = newPlatformValue;
                    }
                }

                var isJsonSchemaWasPopulated = populatePropertiesJsonSchema(propertiesJsonSchema, usedPlatformValue, list);

                if (isJsonSchemaWasPopulated) {
                    lastPopulatedPlatform = ng.copy(newPlatformValue);
                }
            }

            function mergeChangesOnUpdatedSource(origCopy, newCopy, current) {
                return deepExtend({}, newCopy, objectDeepDiff(origCopy, current));
            }
        }

        function tryToSetUpPropertiesJsonSchemaForPlatform(propertiesJsonSchema, schema, list = ['info', 'apiAccess', 'sshAccess']) {
            if (schema) {
                list.forEach((property) => {
                    if (schema[property]) {
                        propertiesJsonSchema[property] = jsonSchemaBuilder.createSchema(
                            enumDataConverter(property, schema[property]));
                    } else {
                        propertiesJsonSchema[property] = null;
                    }
                });
            }

            function enumDataConverter(property, data) {
                if (property === 'sshAccess') {
                    return setUpAccessKeyEnums(data, PlatformsStore.getAccessKeys('PEM'))
                } else {
                    return data;
                }
            }
        }

        function populatePropertiesJsonSchema(propertiesJsonSchema, platformValue, list = ['info', 'apiAccess', 'sshAccess']) {

            var propertiesJson4Schema = prepareProperties4Schema(platformValue);
            var isJsonSchemaWasPopulated = false;
            list.forEach((property) => {
                if (propertiesJsonSchema[property] && propertiesJsonSchema[property].populate) {
                    isJsonSchemaWasPopulated = true;

                    replaceNullsWithEmptyString(propertiesJsonSchema[property], propertiesJson4Schema[property]);
                    if (!platformWriteAccess) {
                        setAllFieldsReadonly(propertiesJsonSchema[property]);
                    }

                    propertiesJsonSchema[property].populate(propertiesJson4Schema[property]);
                }
            });
            return isJsonSchemaWasPopulated;

        }

        function replaceNullsWithEmptyString(propertiesJsonSchema, value) {
            const properties = propertiesJsonSchema.$meta.schema.properties;
            if (properties) {
                Object.keys(properties).forEach((property) => {
                    const type = properties[property].type;
                    if (type === 'string' && value[property] === null) {
                        value[property] = '';
                    }
                });
            }
        }

        function setAllFieldsReadonly(propertiesJsonSchema) {
            const properties = propertiesJsonSchema.$meta.schema.properties;
            if (properties) {
                Object.keys(properties).forEach((key) => {
                    properties[key].readonly = true;
                });
            }
        }

        function getOrFetchTypeMetadata(typeId) {
            if (typeId === null) {
                return null;
            }
            let requestedTypes = {};
            let schema = PlatformsStore.getTypeMetadata(typeId);
            if (!schema) {
                if (!requestedTypes[typeId]) {
                    requestedTypes[typeId] = true;
                    PlatformsActions.fetchPlatformTypeMetadata(typeId);
                }
            }
            return schema;
        }

        function setUpAccessKeyEnums(schema, accessKeysPEM) {
            var result = Object.assign({}, schema);
            result.properties.keyFileId.enum = (accessKeysPEM || []).map(function (key) {
                return key.id;
            });
            result.properties.keyFileId.enumLabels = (accessKeysPEM || []).reduce(function (host, key) {
                host[key.id] = key.name;
                return host;
            }, {});
            result.properties.keyFileId.enum.unshift(null);
            result.properties.keyFileId.enumLabels[null] = '---';
            return result;
        }

        function save() {
            var platform = $scope.platform;

            deepExtend(platform, convertJsonSchemaToPlatformData($scope.propertiesJsonSchema));

            $scope.requesting = true;
            var event, action;
            if (platform.id) {
                event = $scope.$emit('update.platform', platform);
                action = 'updated';
            } else {
                event = $scope.$emit('save.platform', platform);
                action = 'created';
            }

            event.deferredResult.then(function () {
                alertsManager.addAlertSuccess({
                    title: 'Success',
                    text: 'Platform "' + platform.title + '" has been successfully ' + action + '.'
                });
            }).catch(function (error) {
                alertsManager.addAlertError({
                    title: 'Platform info saving error',
                    text: 'Platform "' + platform.title + '" has not been ' + action + ' because of the error: ' + error.message
                });
            }).finally(function () {
                $scope.requesting = false;
            });

        }

        function convertJsonSchemaToPlatformData(propertiesJsonSchema) {
            //extract data from jsonSchema
            var info = {};
            if (propertiesJsonSchema.info && propertiesJsonSchema.info.toJSON) {
                // Now distribution contains string like "CDH 4.4"
                // this should be converted to {type: 'CDH', version: '4.4'}
                info = unpackDistribution(ng.copy(propertiesJsonSchema.info.toJSON()));
            }
            var apiAccess = {};
            if (propertiesJsonSchema.apiAccess && propertiesJsonSchema.apiAccess.toJSON) {
                apiAccess = ng.copy(propertiesJsonSchema.apiAccess.toJSON());
            }
            var sshAccess = {};
            if (propertiesJsonSchema.sshAccess && propertiesJsonSchema.sshAccess.toJSON) {
                sshAccess = ng.copy(propertiesJsonSchema.sshAccess.toJSON());
            }

            var platform = {
                api: {},
                accessInfo: {}
            };
            //info
            platform.id = info.id;
            platform.title = info.title;
            platform.version = info.version;
            platform.distribution = info.distribution;
            platform.type = info.type;
            platform.location = info.location;

            platform.api.protocol = apiAccess.protocol;
            platform.api.host = apiAccess.host;
            platform.api.port = apiAccess.port;
            platform.api.userName = apiAccess.userName;
            platform.api.password = apiAccess.password;

            //access info
            platform.accessInfo.port = sshAccess.port;
            platform.accessInfo.userName = sshAccess.userName;
            platform.accessInfo.password = sshAccess.password;
            platform.accessInfo.keyFileId = sshAccess.keyFileId;
            platform.accessInfo.pluginDirs = sshAccess.pluginDirs;

            return platform;
        }

        function prepareProperties4Schema(platform = {
                                              id: '',
                                              title: '',
                                              distribution: '',
                                              type: '',
                                              location: '',
                                              installationId: '',
                                              version: '',
                                              accessInfo: {},
                                              api: {
                                                  protocol: '',
                                                  host: '',
                                                  port: 0,
                                                  userName: '',
                                                  password: ''
                                              }
                                          }) {
            platform = packDistribution(platform);

            return {
                info: {
                    id: platform.id,
                    title: platform.title,
                    version: platform.version,
                    distribution: platform.distribution,
                    type: platform.type,
                    location: platform.location,
                    installationId: platform.installationId
                },
                apiAccess: {
                    protocol: platform.api.protocol,
                    host: platform.api.host,
                    port: platform.api.port,
                    userName: platform.api.userName,
                    password: platform.api.password
                },
                sshAccess: platform.accessInfo
            };
        }
    }
});
