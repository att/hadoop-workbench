/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('userSettings.pages.UserSettingsPropertiesPageController', Controller);

    Controller.$inject = [
        '$scope',
        'userSettings.storage',
        '$widgetParams',
        'shared.jsonSchemaBuilder',
        'dashboard.models.PageControl'
    ];
    function Controller($scope, storage, $widgetParams, jsonSchemaBuilder, PageControl) {
        var schema = createJsonSchema();

        ng.extend($scope, {
            page: $widgetParams.page,
            settings: {
                confirmWidgetRemoval: storage.get("confirmWidgetRemoval"),
                showPropertiesOnNodeCreate: storage.get("showPropertiesOnNodeCreate"),
                showAdvancedConfigProperties: storage.get("showAdvancedConfigProperties"),
                showSearchFilter: storage.get("showSearchFilter"),
                isSearchFilterStyleInline: storage.get("isSearchFilterStyleInline")
            },
            propertiesJsonSchema: jsonSchemaBuilder.createSchema(schema)
        });

        ng.extend($scope, {
            save: save
        });

        setUpControls();

        function setUpControls() {
            var saveControl = PageControl.factory({
                label: '',
                tooltip: 'Save',
                icon: 'b-user-settings-properties__icon-save',
                action: save
            });
            $widgetParams.page.addControl(saveControl);

            $scope.propertiesJsonSchema.populate($scope.settings);
        }

        function save() {
            //extract data from jsonSchema
            var settingsData = $scope.propertiesJsonSchema.toJSON();
            $scope.settings.confirmWidgetRemoval = settingsData.confirmWidgetRemoval;
            $scope.settings.showPropertiesOnNodeCreate = settingsData.showPropertiesOnNodeCreate;
            $scope.settings.showAdvancedConfigProperties = settingsData.showAdvancedConfigProperties;
            $scope.settings.showSearchFilter = settingsData.showSearchFilter;
            $scope.settings.isSearchFilterStyleInline = settingsData.isSearchFilterStyleInline;

            $scope.$emit('save.user-settings', $scope.settings);
        }

        function createJsonSchema() {
            return {
                type: 'object',
                title: 'General',
                properties: {
                    confirmWidgetRemoval: {
                        title: 'Confirm widget close',
                        type: 'boolean',
                        tooltip: 'Enables confirmation message for widget close action'
                    },
                    showPropertiesOnNodeCreate: {
                        title: 'Properties on create',
                        tooltip: 'Open properties panel automatically on element create during component editing in visual mode',
                        type: 'boolean'
                    },
                    showAdvancedConfigProperties: {
                        title: 'Expand advanced properties',
                        tooltip: 'Expand advanced properties by default',
                        type: 'boolean'
                    },
                    showSearchFilter: {
                        title: 'Show search filter',
                        tooltip: 'Show component search filter in main menu',
                        type: 'boolean'
                    },
                    isSearchFilterStyleInline: {
                        title: 'Inline search filter',
                        tooltip: 'Use inline style for search filter in main menu',
                        type: 'boolean'
                    }
                },
                dependencies: [
                    {
                        dependentFieldPath: 'isSearchFilterStyleInline',
                        condition: {
                            controlFieldPath: 'showSearchFilter',
                            operation: '==',
                            values: [
                                true
                            ]
                        },
                        conditionTrue: {
                            isHidden: false
                        },
                        conditionFalse: {
                            isHidden: true
                        }
                    }
                ]
            };
        }
    }
});
