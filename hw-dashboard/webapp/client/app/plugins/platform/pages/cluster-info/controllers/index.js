import {deleteNonExistingKeysFromOldObject} from "../../../../../shared/utils/array-functions";
/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('platform.pages.ClusterInfoPageController', Controller);

    var objectDeepDiff = require('object-deep-diff');
    var deepExtend = require('deep-extend');

    const USER_ID_FIELD_NAME = 'userId';
    Controller.$inject = [
        '$scope',
        '$widgetParams',
        'dashboard.models.PageControl',
        'platform-manager-widget.Widget.ClustersStore',
        'platform-manager-widget.ServiceUsersStore',
        'shared.jsonSchemaBuilder',
        'main.alerts.alertsManagerService',
        'platformWriteAccess'
    ];
    function Controller($scope, $widgetParams, PageControl, ClustersStore, ServiceUsersStore, jsonSchemaBuilder, alertsManager, platformWriteAccess) {
        var saveControl;
        var lastPopulatedCluster = null;

        var prepareProperties4SchemaFunctionFactory = function (key) {
            return function (inputObject) {
                var result = {};
                if (inputObject && inputObject[key]) {
                    result = inputObject[key];
                }
                return result;
            }
        };

        init();

        function init() {
            ng.extend($scope, {
                requesting: false,
                page: $widgetParams.page,
                cluster: ClustersStore.getSelectedCluster(),
                users: ServiceUsersStore.getUsers(),
                isReadonly: false
            });
            $scope.propertiesJsonSchema = propertiesJsonSchemaBuilder(
                getSchemaForCurrentPlatformId(),
                $scope.users);
            $scope.propertyJsonSchemaOrderedKeyArray = getSchemaOrderedKeys(getSchemaForCurrentPlatformId());
            ng.extend($scope, {
                save: save
            });

            setUpControls();
        }

        function setUpControls() {
            saveControl = PageControl.factory({
                label: '',
                tooltip: 'Save',
                icon: 'cluster-info__icon-save',
                action: save
            });

            if (platformWriteAccess) {
                $widgetParams.page.addControl(saveControl);
            }

            $scope.$watch('cluster', function (newClusterValue) {
                if (newClusterValue) {
                    saveControl.active = !!newClusterValue;
                    // each time a new cluster is selected we need to reinitialize schema with default values
                    // to discard values from previously selected cluster
                    updatePropertiesJsonSchemaAndValues(newClusterValue, $scope.users);
                }
            });

            /**
             * HWDAP-1715 (ui) Custom properties of cluster are blinking
             *
             * This watcher automatically renews custom props, that's why custom properties are blinking
             * Solution: if (!angular.equals(ClustersStore.getSelectedCluster(), $scope.cluster))
             */
            $scope.$listenTo(ClustersStore, 'change', function () {
                if (!angular.equals(ClustersStore.getSelectedCluster(), $scope.cluster)) {
                    $scope.cluster = ClustersStore.getSelectedCluster();
                    if ($scope.cluster) {
                        updatePropertiesJsonSchemaAndValues($scope.cluster, $scope.users);
                    }
                }
            });

            $scope.$listenTo(ServiceUsersStore, 'change', function (event) {
                $scope.users = ServiceUsersStore.getUsers();
                updateUserEnumsForPropertiesJsonSchema($scope.users);
            });
        }

        function updateUserEnumsForPropertiesJsonSchema(users) {
            Object.keys($scope.propertiesJsonSchema).forEach((sectionName) => {
                if ($scope.propertiesJsonSchema[sectionName].getPropertyInfo(USER_ID_FIELD_NAME)) {
                    $scope.propertiesJsonSchema[sectionName].setEnum(USER_ID_FIELD_NAME, buildUserEnumSetupObject(users));
                }
            });
        }

        function isClusterNotChanged(newCluster, oldCluster) {
            return newCluster && oldCluster &&
                (newCluster.id === oldCluster.id) &&
                (newCluster.platformId === oldCluster.platformId);
        }

        function updatePropertiesJsonSchemaAndValues(newCluster, users) {
            var usedClusterValue = null;
            if (isClusterNotChanged(newCluster, lastPopulatedCluster)) {
                /**
                 * Restore user changed data if cluster's identity was not changed
                 */
                var currentData = convertJsonSchemaToClusterData($scope.propertiesJsonSchema);
                usedClusterValue = mergeChangesOnUpdatedSource(lastPopulatedCluster, newCluster, currentData);
            } else {
                usedClusterValue = newCluster;
            }
            lastPopulatedCluster = ng.copy(newCluster);

            var propertiesJson4Schema = prepareProperties4Schema(getSchemaForCurrentPlatformId(), usedClusterValue);

            var propertiesJsonSchema = propertiesJsonSchemaBuilder(getSchemaForCurrentPlatformId(), users);

            $scope.propertyJsonSchemaOrderedKeyArray = getSchemaOrderedKeys(getSchemaForCurrentPlatformId());
            var propertiesJsonSchemaKeys = Object.keys(propertiesJsonSchema);
            propertiesJsonSchemaKeys.forEach(function (schemaPropertyKey) {
                // live same references but with new content
                $scope.propertiesJsonSchema[schemaPropertyKey] = propertiesJsonSchema[schemaPropertyKey]
                    .populate(propertiesJson4Schema[schemaPropertyKey]);
            });

            /**
             * New schema can have other set of properties,
             * so remove non-existing properties from $scope.propertiesJsonSchema object
             * @type {Array.<*>}
             */
            deleteNonExistingKeysFromOldObject($scope.propertiesJsonSchema, propertiesJsonSchemaKeys);
        }

        function mergeChangesOnUpdatedSource(origCopy, newCopy, current) {
            return deepExtend({}, newCopy, objectDeepDiff(origCopy, current));
        }

        function setUpUsersEnums(schema, users, userFieldName) {
            let enumSetupObject = buildUserEnumSetupObject(users);

            let result = Object.assign({}, schema);
            result.properties[userFieldName].enum = enumSetupObject.enum;
            result.properties[userFieldName].enumLabels = enumSetupObject.enumLabels;

            return result;
        }

        function buildUserEnumSetupObject(users) {
            let propertyEnum = (users || []).map(function (user) {
                return user.id;
            });
            propertyEnum.unshift(null);
            let propertuEnumLabels = (users || []).reduce(function (host, user) {
                host[user.id] = user.name;
                return host;
            }, {});
            propertuEnumLabels[null] = '---';
            return {'enum': propertyEnum, 'enumLabels': propertuEnumLabels};
        }

        function save() {
            var cluster = $scope.cluster;

            deepExtend(cluster, convertJsonSchemaToClusterData($scope.propertiesJsonSchema));

            $scope.requesting = true;
            var event = $scope.$emit('update.cluster-info', cluster);
            event.deferredResult.then(function () {
                alertsManager.addAlertSuccess({
                    title: 'Success',
                    text: 'Cluster "' + cluster.title + '" has been successfully updated.'
                });

                updatePropertiesJsonSchemaAndValues($scope.cluster, $scope.users);

            }).catch(function (error) {
                alertsManager.addAlertError({
                    title: 'Cluster info saving error',
                    text: 'Cluster "' + cluster.title + '" has not been updated because of the error: ' + error.message
                });
            }).finally(function () {
                $scope.requesting = false;
            });
        }

        function convertJsonSchemaToClusterData(propertiesJsonSchema) {

            var clusterData = {};

            /**
             * Here we clean customData from old values
             */
            clusterData.customData = [];

            var activeSchemaPropertyKeys = getSchemaPropertyKeys(
                getSchemaForCurrentPlatformId());

            activeSchemaPropertyKeys.forEach(function (propertyKey) {

                var data = propertiesJsonSchema[propertyKey].toJSON();
                Object.keys(data).forEach(function(subKey) {
                    if (clusterData[propertyKey] === undefined) {
                        clusterData[propertyKey] = {};
                    }
                    clusterData[propertyKey][subKey] = data[subKey];
                });
            });

            return clusterData;
        }

        function getPlatformId() {
            return $scope.cluster && $scope.cluster.platformId;
        }

        function getSchemaForCurrentPlatformId() {
            return getSchema(getPlatformId());
        }

        function getSchema(platformId) {
            return ClustersStore.getMetadata(platformId)
        }

        function getSchemaPropertyKeys(schema) {
            return Object.keys(schema);
        }

        function getSchemaOrderedKeys(schema) {
            return Object.keys(schema).map(key => ({ key, order: schema[key].order}))
                .sort(({order: orderA}, {order: orderB}) => orderA > orderB)
                .map(({key}) => key);
        }

        function propertiesJsonSchemaBuilder(schema, users) {
            var propertiesJsonSchema = {};
            if (schema) {
                Object.keys(schema).forEach((propertyName) => {
                    propertiesJsonSchema[propertyName] = buildFunction(schema[propertyName], users);
                    if (!platformWriteAccess) {
                        setAllFieldsReadonly(propertiesJsonSchema[propertyName]);
                    }
                });
            }
            return propertiesJsonSchema;

            function buildFunction(schemaPropertySection, users) {
                let finalSchema;
                if (schemaPropertySection.properties && schemaPropertySection.properties[USER_ID_FIELD_NAME]) {
                    finalSchema = setUpUsersEnums(schemaPropertySection, users, USER_ID_FIELD_NAME);
                } else {
                    finalSchema = schemaPropertySection;
                }
                return jsonSchemaBuilder.createSchema(finalSchema);
            }

            function setAllFieldsReadonly(propertiesJsonSchema) {
                const schema = propertiesJsonSchema.$meta.schema;
                if (schema.type === "object") {
                    Object.keys(schema.properties).forEach((key) => {
                        schema.properties[key].readonly = true;
                    });
                } else if (schema.type === "array") {
                    schema.additionalItems = false;
                    const properties = schema.items.properties;
                    Object.keys(properties).forEach((key) => {
                        properties[key].readonly = true;
                    });
                }

            }
        }

        function prepareProperties4Schema(schema, cluster) {
            var propertiesJson4Schema = {};
            if (schema) {
                Object.keys(schema).forEach((propertyName) => {
                    propertiesJson4Schema[propertyName] = prepareProperties4SchemaFunctionFactory(propertyName)(cluster);
                });
            }
            return propertiesJson4Schema;
        }

    }
});
