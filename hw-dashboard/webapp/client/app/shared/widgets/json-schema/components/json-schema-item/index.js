define(function (require, exports, module) {
    "use strict";

    require('../../ngModule').component('json-schema-item', {
        pathPrefix: '/app/shared/widgets/json-schema/',
        controller: ItemController,
        scope: {
            schemaItem: '=',
            onRemove: '&',
            removable: '=',
            level: '@',
            readonly: '=',
            focus: '=',
            order: '=',
            first: '='
        }
    });

    var dict = {
        object: 'json-schema-object',
        array: 'json-schema-array',
        string: 'json-schema-string',
        number: 'json-schema-number',
        integer: 'json-schema-integer',
        boolean: 'json-schema-boolean',
        'null': 'json-schema-null',
        'undefined': 'json-schema-undefined'
    };

    var needFold = [
        'json-schema-object',
        'json-schema-array'
    ];

    ItemController.$inject = [
        '$scope',
        'params'
    ];
    function ItemController($scope, params) {
        $scope.schemaItem = params.schemaItem;
        $scope.onRemove = params.onRemove;
        $scope.removable = params.removable;
        $scope.level = params.level || 1;

        $scope.folded = false;
        $scope.valueComponentName = getValueComponentName($scope.schemaItem);
        $scope.needFold = isFoldNeeded($scope.valueComponentName);
        $scope.needHide = false;

        if ($scope.schemaItem && $scope.schemaItem.instance && $scope.schemaItem.instance.onChangeCallback) {
            $scope.$watch(function () {
                return $scope.schemaItem.instance.getValue();
            }, function () {
                $scope.schemaItem.instance.onChangeCallback();
            });
        }

        $scope.$watch('schemaItem.instance.dependency.isHidden', function (isHidden) {
            $scope.needHide = isHidden;
        });

        $scope.toggleFold = function () {
            $scope.folded = !$scope.folded;
        };

        $scope.$watch('schemaItem.instance.schema.type', function (newType, oldType) {
            if (newType !== oldType) {
                if (newType) {
                    $scope.valueComponentName = getValueComponentName($scope.schemaItem);
                    $scope.needFold = isFoldNeeded($scope.valueComponentName);
                } else {
                    $scope.valueComponentName = null;
                    $scope.needFold = false;
                }
            }
        });

        function getValueComponentName(item) {
            var result = dict[item.instance && item.instance.schema.type ? item.instance.schema.type : 'undefined'];
            if (!result) {
                return dict['undefined'];
            }
            return result;
        }

        function isFoldNeeded(componentName) {
            return needFold.indexOf(componentName) > -1;
        }
    }
});
