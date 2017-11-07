/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('userSettings.pages.awsProvisionSettingsPropertiesPageController', Controller);

    Controller.$inject = [
        '$scope',
        'userSettings.storage',
        'user-settings.pages.aws-provision-settings-properties.storageKeys',
        '$widgetParams',
        'shared.jsonSchemaBuilder',
        'dashboard.models.PageControl'
    ];
    function Controller($scope, storage, awsProvisionStorageKeys, $widgetParams, jsonSchemaBuilder, PageControl) {
        var schema = createJsonSchema();

        var awsProvisionSettings = storage.get(awsProvisionStorageKeys.AWS_PROVISION) || null;
        ng.extend($scope, {
            page: $widgetParams.page,
            settings: awsProvisionSettings,
            propertiesJsonSchema: jsonSchemaBuilder.createSchema(schema),
        });

        ng.extend($scope, {
            save: save
        });

        setUpControls();

        function setUpControls() {
            var saveControl = PageControl.factory({
                label: '',
                tooltip: 'Save',
                icon: 'b-aws-provision-settings-properties__icon-save',
                action: save
            });
            $widgetParams.page.addControl(saveControl);

            $scope.propertiesJsonSchema.populate($scope.settings);
        }

        function save() {
            //extract data from jsonSchema
            var settingsData = $scope.propertiesJsonSchema.toJSON();

            $scope.$emit('save.aws-provision-settings', settingsData);
        }


        function createJsonSchema() {
            // return generateSchema();
            return {
                "title": "AWS Region keys",
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "us-east-1": {
                        "title": "US East (N. Virginia)",
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "title": {"type": "string"},
                            "privateKey": {"type": "string", "isPassword": true},
                            "publicKey": {"type": "string"}
                        }
                    },
                    "us-west-2": {
                        "title": "US West (Oregon)",
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "title": {"type": "string"},
                            "privateKey": {"type": "string", "isPassword": true},
                            "publicKey": {"type": "string"}
                        }
                    },
                    "us-west-1": {
                        "title": "US West (N. California)",
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "title": {"type": "string"},
                            "privateKey": {"type": "string", "isPassword": true},
                            "publicKey": {"type": "string"}
                        }
                    },
                    "eu-west-1": {
                        "title": "EU (Ireland)",
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "title": {"type": "string"},
                            "privateKey": {"type": "string", "isPassword": true},
                            "publicKey": {"type": "string"}
                        }
                    },
                    "eu-central-1": {
                        "title": "EU (Frankfurt)",
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "title": {"type": "string"},
                            "privateKey": {"type": "string", "isPassword": true},
                            "publicKey": {"type": "string"}
                        }
                    },
                    "ap-southeast-1": {
                        "title": "Asia Pacific (Singapore)",
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "title": {"type": "string"},
                            "privateKey": {"type": "string", "isPassword": true},
                            "publicKey": {"type": "string"}
                        }
                    },
                    "ap-northeast-1": {
                        "title": "Asia Pacific (Tokyo)",
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "title": {"type": "string"},
                            "privateKey": {"type": "string", "isPassword": true},
                            "publicKey": {"type": "string"}
                        }
                    },
                    "ap-southeast-2": {
                        "title": "Asia Pacific (Sydney)",
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "title": {"type": "string"},
                            "privateKey": {"type": "string", "isPassword": true},
                            "publicKey": {"type": "string"}
                        }
                    },
                    "ap-northeast-2": {
                        "title": "Asia Pacific (Seoul)",
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "title": {"type": "string"},
                            "privateKey": {"type": "string", "isPassword": true},
                            "publicKey": {"type": "string"}
                        }
                    },
                    "ap-south-1": {
                        "title": "Asia Pacific (Mumbai)",
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "title": {"type": "string"},
                            "privateKey": {"type": "string", "isPassword": true},
                            "publicKey": {"type": "string"}
                        }
                    },
                    "sa-east-1": {
                        "title": "South America (Sao Paulo)",
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "title": {"type": "string"},
                            "privateKey": {"type": "string", "isPassword": true},
                            "publicKey": {"type": "string"}
                        }
                    }
                }
            };

            /**
             * Use if regions added
             * @returns {{title: string, type: string, additionalProperties: boolean, properties: {}}}
             */
            function generateSchema() {
                var enumLabels = {
                    "us-east-1": "US East (N. Virginia)",
                    "us-west-2": "US West (Oregon)",
                    "us-west-1": "US West (N. California)",
                    "eu-west-1": "EU (Ireland)",
                    "eu-central-1": "EU (Frankfurt)",
                    "ap-southeast-1": "Asia Pacific (Singapore)",
                    "ap-northeast-1": "Asia Pacific (Tokyo)",
                    "ap-southeast-2": "Asia Pacific (Sydney)",
                    "ap-northeast-2": "Asia Pacific (Seoul)",
                    "ap-south-1": "Asia Pacific (Mumbai)",
                    "sa-east-1": "South America (Sao Paulo)"
                };

                var regionElement = {
                    "title": "",
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "title": {
                            "type": "string"
                        },
                        "privateKey": {
                            "type": "string",
                            "isPassword": true
                        },
                        "publicKey": {
                            "type": "string"
                        }
                    }
                };
                var schema = {
                    "title": "AWS Region keys",
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {}
                };
                Object.keys(enumLabels).forEach(function (key) {
                    schema.properties[key] = ng.copy(regionElement);
                    schema.properties[key].title = enumLabels[key];
                });
                return schema;
            }
        }
    }
});
