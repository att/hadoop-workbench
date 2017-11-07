define(function (require, exports, module) {
    "use strict";

    require('../../ngModule').component('json-schema-array', {
        pathPrefix: '/app/shared/widgets/json-schema/',
        controller: ArrayController,
        scope: {
            instance: '=',
            level: '@',
            readonly: '=',
            focus: '='
        }
    });

    ArrayController.$inject = [
        '$scope',
        'params'
    ];
    function ArrayController($scope, params) {
        $scope.level = params.level || 1;

        $scope.onRemove = function (index, item) {
            $scope.instance.value = immutableSplice($scope.instance.value, index, 1);
        };
        $scope.addAnother = function () {
            $scope.instance.addItem();
            $scope.focus = true;
        };
        this.onParamChanged = function (param, newValue, oldValue) {
            $scope.level = params.level || 1;
        }
    }

    function immutableSplice(arr, start, deleteCount) {
        var _len = arguments.length;
        var items = new Array(_len > 3 ? _len - 3 : 0);
        for (var _key = 3; _key < _len; _key += 1) {
            items[_key - 3] = arguments[_key];
        }
        return [].concat(arr.slice(0, start), items, arr.slice(start + deleteCount));
    }
});
