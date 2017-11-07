define(function (require) {
    "use strict";

    var ng = require("angular");
    require("../ngModule").controller("flume.widgets.optionsEditor.indexController", indexController);

    indexController.$inject = [
        "$scope",
        "$timeout",
        "flume.models.NodeProperty",
        "core.autocomplete-dictionary",
    ];
    function indexController($scope, $timeout, NodeProperty, autocompleteDictionary) {

        $scope.propertyKeys = [];

        $scope.newPropertyObject = null;

        $scope.nodeIdFieldSetFocus = 0;

        $scope.removeConnection = function (connection) {
            $scope.$emit("connection-remove.options-editor", connection);
        };

        $scope.addNewPropertyBtnClicked = function () {
            resetAndFocusNewPropertyObject();
        };

        $scope.cancelBtnClicked = function () {
            $scope.newPropertyObject = null;
        };

        $scope.addNewProperty = function () {
            var initData = {
                key: $scope.newPropertyObject.key,
                value: $scope.newPropertyObject.value
            };
            var property = NodeProperty.factory(initData);
            $scope.node.properties.push(property);
            $scope.newPropertyObject = null;
            $timeout(resetAndFocusNewPropertyObject);
        };

        $scope.removeProperty = function (property) {
            if (!property.isRemovable) {
                return false;
            }

            var indexInProperties = $scope.node.properties.indexOf(property);
            if (indexInProperties >= 0) {
                $scope.node.properties.splice(indexInProperties, 1);
            }
        };

        $scope.updateNodeCounters = function () {
            $scope.$emit('update-node-counters');
        };

        /**
         * Autocomplete helpers
         */
        ng.extend($scope, {
            activeIndex: false,
            niAutocompleteData: [],
            setActiveIndex: function (index) {
                $scope.activeIndex = index;
            },
        });

        $scope.$watch('node', function () {
            $scope.newPropertyObject = null;
        });

        /**
         * Symbol "." is allowed for id by received pattern
         * But scheme is broken by this value,
         * So it will be substituted by "_" symbol
         */
        $scope.$watch(function () {
            var testedStr = $scope.node && $scope.node.id || '';
            var regexp = /\./;
            return regexp.test(testedStr);
        }, function (hasDots) {
            if (hasDots) {
                var str = "" + $scope.node.id;
                $scope.node.id = str.replace(/\./g, '_');
                /**
                 * Set focus on node.id field to the end of string
                 * by using "focus-it" directive
                 */
                $scope.nodeIdFieldSetFocus++;
            }
        });

        $scope.$watchCollection('node.properties', function (newCollection) {
            newCollection = newCollection || [];
            $scope.propertyKeys = newCollection.map(function (item) {
                return item.key;
            });
        });

        /**
         * Non blocking async operation.
         * Result is not required immediately after page load
         */
        fetchAutocompleteDictionaryAsync().then(function (data) {
            $scope.niAutocompleteData = data.properties;
        });

        /**
         * @returns {Promise}
         */
        function fetchAutocompleteDictionaryAsync() {
            return autocompleteDictionary.getFlumeMustacheDictionary();
        }

        function resetAndFocusNewPropertyObject() {
            $scope.newPropertyObject = {
                key: '',
                value: ''
            };
        }
    }
});
