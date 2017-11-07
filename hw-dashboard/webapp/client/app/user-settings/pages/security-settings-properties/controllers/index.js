/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('userSettings.pages.SecuritySettingsPropertiesPageController', Controller);

    Controller.$inject = [
        '$scope',
        'userSettings.storage',
        '$widgetParams',
        'shared.jsonSchemaBuilder',
        'dashboard.models.PageControl'
    ];
    function Controller($scope, storage, $widgetParams, jsonSchemaBuilder, PageControl) {
        var schema = createJsonSchema();
        let serviceUsers = $widgetParams.page.params.users;

        ng.extend($scope, {
            page: $widgetParams.page,
            settings: {
                hdfsUserId: storage.get("hdfsUserId") || null,
                oozieUserId: storage.get("oozieUserId") || null,
                localUserAsService: storage.get("localUserAsService") || false,
            },
            propertiesJsonSchema: jsonSchemaBuilder.createSchema(schema),
            serviceUsers: serviceUsers || []
        });

        $scope.$watchCollection('serviceUsers', function (users) {
            addEnumsToSchema();
        });

        ng.extend($scope, {
            save: save
        });

        setUpControls();

        function setUpControls() {
            var saveControl = PageControl.factory({
                label: '',
                tooltip: 'Save',
                icon: 'b-security-settings-properties__icon-save',
                action: save
            });
            $widgetParams.page.addControl(saveControl);

            $scope.propertiesJsonSchema.populate($scope.settings);
        }

        function save() {
            //extract data from jsonSchema
            var settingsData = $scope.propertiesJsonSchema.toJSON();
            $scope.settings.hdfsUserId = settingsData.hdfsUserId !== 0 ? settingsData.hdfsUserId : null;
            $scope.settings.oozieUserId = settingsData.oozieUserId !== 0 ? settingsData.oozieUserId : null;
            $scope.settings.localUserAsService = !!settingsData.localUserAsService;

            $scope.$emit('save.user-settings', $scope.settings);
        }

        function addEnumsToSchema() {
            let enums = $scope.serviceUsers.map(function (user) {
                return user.id;
            });
            let enumLabels = $scope.serviceUsers.reduce(function (host, user) {
                host[user.id] = user.name;
                return host;
            }, {});

            enums.unshift(null);
            enumLabels[null] = '---';

            $scope.propertiesJsonSchema.setEnum('hdfsUserId', {enum: enums, enumLabels});
            $scope.propertiesJsonSchema.setEnum('oozieUserId', {enum: enums, enumLabels});
        }

        function createJsonSchema() {
            return {
                type: 'object',
                title: 'General',
                properties: {
                    localUserAsService: {
                        title: 'Use Local User',
                        type: 'boolean',
                        tooltip: 'Propagate local user to Hadoop services'
                    },
                    hdfsUserId: {
                        title: 'HDFS User',
                        type: 'number',
                        enum: [],
                        enumLabels: {}
                    },
                    oozieUserId: {
                        title: 'Oozie User',
                        type: 'number',
                        enum: [],
                        enumLabels: {}
                    }
                },
                dependencies: [
                    {
                        dependentFieldPath: 'hdfsUserId',
                        condition: {
                            controlFieldPath: 'localUserAsService',
                            operation: '==',
                            values: [
                                true
                            ]
                        },
                        conditionTrue: {
                            isHidden: true
                        },
                        conditionFalse: {
                            isHidden: false
                        }
                    },
                    {
                        dependentFieldPath: 'oozieUserId',
                        condition: {
                            controlFieldPath: 'localUserAsService',
                            operation: '==',
                            values: [
                                true
                            ]
                        },
                        conditionTrue: {
                            isHidden: true
                        },
                        conditionFalse: {
                            isHidden: false
                        }
                    }
                ]
            };
        }
    }
});
