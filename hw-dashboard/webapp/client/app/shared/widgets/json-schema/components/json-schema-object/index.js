define(function (require, exports, module) {
    "use strict";

    require('../../ngModule').component('json-schema-object', {
        pathPrefix: '/app/shared/widgets/json-schema/',
        controller: ObjectController,
        scope: {
            instance: '=',
            level: '@',
            readonly: '=',
            focus: '=',
            order: '='
        }
    });

    ObjectController.$inject = [
        '$scope',
        'params'
    ];
    function ObjectController($scope, params) {
        $scope.instance = params.instance;
        $scope.level = params.level || 1;

        $scope.propertiesOrder = [];

        this.onParamChanged = function (param) {
            if (param === 'order' || param === 'instance') {
                calculatePropertiesOrder($scope.order);
            }
        };

        calculatePropertiesOrder($scope.order);

        function calculatePropertiesOrder(order) {
            order = order || [];
            if (Object.keys($scope.instance.properties).length === 0) {
                $scope.propertiesOrder = [];
                return;
            }
            var other = Object.keys($scope.instance.properties).filter(function (propName) {
                return order.indexOf(propName) === -1;
            });
            $scope.propertiesOrder = order.concat(other);
        }
    }
});
