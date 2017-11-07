define(function (require) {
    "use strict";
    var ng = require('angular');
    require('../ngModule').controller('shared.pages.ConfigPropertiesEditorController', Controller);

    Controller.$inject = [
        '$scope',
        'userSettings.storage',
        '$widgetParams',
        'dashboard.models.PageControl',
        '$timeout',
        '$filter',
        'core.utils',
        'core.autocomplete-dictionary',
    ];
    function Controller($scope, storage, $widgetParams, PageControl, $timeout, $filter, utils, autocompleteDictionary) {

        ng.extend($scope, {
            configItems: $widgetParams.params.configItems,
            newItem: null,
            autocompleteChannelNewItem: {},
            autocompleteChannelExistingItem: {},
            activeSectionId: false,
            activeIndex: false,
            autocompleteConfig: getAutocompleteObj(),
            niAutocompleteData: $widgetParams.params.autocompleteData,
            niAutocompleteDataFiltered: [],
            newItemFormContainer: {},
            isNewConfigItemFormFieldKeyErrorVisible: false,
            newItemSectionId: null,
            newItemSectionOptions: null,
            configItemsKeys: [],
            readonly: $widgetParams.params.readonly,
            file: $widgetParams.params.file,
            noDescriptionOnView: $widgetParams.params.noDescriptionOnView,
            noDescriptionOnCreate: $widgetParams.params.noDescriptionOnCreate,
            isConfigDefaultError: $widgetParams.params.configItems === null,
            configItemsSection: getConfigItemsSection($widgetParams.params.isSingleSection, $widgetParams.params.isCollapsed),
            folded: {}
        });

        $scope.autocompleteChannelNewItem = ng.extend(
            $scope.autocompleteChannelNewItem,
            newAutocompleteChannel($scope.autocompleteChannelNewItem));

        $scope.autocompleteChannelExistingItem = ng.extend(
            $scope.autocompleteChannelExistingItem,
            newAutocompleteChannel($scope.autocompleteChannelExistingItem));

        /**
         * Initiate folding for config sections
         */
        $scope.configItemsSection.forEach(function (section) {
            $scope.folded[section.id] = section.hidden;
        });

        ng.extend($scope, {
            addNewBtnClicked: function (options, id) {
                $scope.newItemSectionOptions = options;
                $scope.newItemSectionId = id;
                if ($scope.readonly) {
                    return;
                }
                if ($scope.newItem && $scope.newItem.key) {
                    $scope.addProperty();
                }
                resetNewItem(options);
            },
            addProperty: function () {
                if ($scope.readonly) {
                    return;
                }
                $scope.configItems.push($scope.newItem);
                $scope.newItem = null;
                $timeout(function () {
                    resetNewItem($scope.newItemSectionOptions);
                });
            },
            cancelBtnClicked: function () {
                $scope.newItem = null;
                $scope.newItemSectionId = null;
                $scope.newItemSectionOptions = null;
            },
            goToConfigText: function () {
                $scope.$emit('open-file.oozie-workflow', $scope.file);
            },
            toggleFold: function (sectionId) {
                $scope.folded[sectionId] = !$scope.folded[sectionId];
            },
            removeProperty: function (item) {
                $scope.configItems.splice(utils.objectInArray($scope.configItems, item), 1);
            },
            selectNewItemValue: function (datalistItem) {
                $scope.autocompleteChannelNewItem.substituteValue = datalistItem.key;
            },
            selectExistingItemValue: function (datalistItem) {
                $scope.autocompleteChannelExistingItem.substituteValue = datalistItem.key;
            },
            setActiveSectionAndIndex: function (sectionId, index) {
                $scope.activeSectionId = sectionId;
                $scope.activeIndex = index;
            }
        });

        $widgetParams.page.on('config-default-updated', function (event, configDefault) {
            $scope.configItems = configDefault;
            $scope.isConfigDefaultError = configDefault === null
        });

        var saveCtrl = new PageControl({
            type: 'button',
            icon: 'b-oozie-plugin__flowchart-widget__save-icon',
            label: '',
            tooltip: 'Save',
            enable: true,
            action: save,
            styleAsTab: false
        });
        $widgetParams.page.addControl(saveCtrl);

        /**
         * Non blocking async operation.
         * Result is not required immediately after page load
         */
        fetchAutocompleteDictionaryAsync().then(function (data) {
            $scope.niAutocompleteData = data.properties;
        });

        /**
         * Fix for: DAP-1531 (ui) double cancel in oozie properties
         *
         * Warning!!!
         * Clicking on cancel button $scope.cancelBtnClicked
         * changes value of "newConfigItemForm.key.$touched" from false to true
         * And in template this value is used as part of ng-if directive:
         * >>>> <div ng-if="newConfigItemForm.key.$touched && newConfigItemForm.key.$invalid">
         * This cause rerender of DOM tree and STOPS onclick event propagation
         * AND as result $scope.cancelBtnClicked is not called.
         *
         * This code debounce "DOM change" and "onclick event"
         */
        $scope.$watch(verifyIsNewConfigItemFormFieldKeyErrorVisible, function () {
            $timeout(function () {
                $scope.isNewConfigItemFormFieldKeyErrorVisible = verifyIsNewConfigItemFormFieldKeyErrorVisible();
            }, 200);
        });

        function verifyIsNewConfigItemFormFieldKeyErrorVisible() {
            var form = $scope.newItemFormContainer.newConfigItemForm;
            if (form) {
                return form.key.$touched && form.key.$invalid;
            } else {
                return false;
            }
        }

        function save() {
            $scope.$emit('save.config', {
                config: $scope.configItems,
                file: $scope.file
            });
        }

        function resetNewItem(options) {
            if (options === undefined) {
                options = {};
            }
            $scope.newItem = ng.extend({
                key: '',
                value: '',
                description: ''
            }, options);

            $scope.autocompleteChannelNewItem.isActive = false;
            $scope.autocompleteChannelNewItem.substituteValue = false;
        }

        /**
         * @returns {Promise}
         */
        function fetchAutocompleteDictionaryAsync() {
            return autocompleteDictionary.getOozieMustacheDictionary();
        }

        function filterAutocompleteDataList(newVal, autocompleteChannel) {
            var filteredResults;
            /**
             * Show all options if no input was done buy user
             */
            if (newVal === null || newVal === false) {
                filteredResults = [];
            } else {
                filteredResults = $filter('filter')($scope.niAutocompleteData, {key: newVal});
            }
            setNewDataToArrayReference($scope.niAutocompleteDataFiltered, filteredResults);
            autocompleteChannel.isActive = filteredResults.length;
        }

        function setNewDataToArrayReference(existingArrayReference, newData) {
            /*
             * Save pointer to the existing array!
             */
            existingArrayReference.splice(0);
            existingArrayReference.push.apply(existingArrayReference, newData);
            return existingArrayReference;
        }

        function newAutocompleteChannel(autocompleteChannel) {
            return {
                isActive: false,
                applyAutocompletableValueCb: function (value) {
                    return filterAutocompleteDataList(value, autocompleteChannel);
                },
                substituteValue: false,
            }
        }

        /**
         * Config for Mustache autocomplete
         *
         * @returns {{start: string, startRegexEscaped: string, end: string, endRegexEscaped: string}}
         */
        function getAutocompleteObj() {
            return {
                start: "{{",
                startRegexEscaped: "\\{\\{",
                end: "}}",
                endRegexEscaped: "\\}\\}"
            }
        }

        function getConfigItemsSection(isSingleSection, isCollapsed) {
            var configItemsSectionMultiSectionDefault = [
                {
                    id: 'business',
                    title: $widgetParams.params.title,
                    filter: { business: true },
                    options: { business: true },
                    hidden: !!isCollapsed
                },
                {
                    id: 'advanced',
                    title: "Advanced " + $widgetParams.params.title,
                    filter: { business: '!true' },
                    /**
                     * Do not save this property cause it is non standard,
                     * it's our own extension
                     */
                    // options: { business: false },
                    hidden: !storage.get("showAdvancedConfigProperties")
                }
            ];
            var configItemsSectionSingleSectionDefault = [
                {
                    id: 'business',
                    title: $widgetParams.params.title,
                    filter: { },
                    options: { business: true },
                    hidden: !!isCollapsed
                }
            ];
            return isSingleSection ? configItemsSectionSingleSectionDefault : configItemsSectionMultiSectionDefault;
        }
    }
});
