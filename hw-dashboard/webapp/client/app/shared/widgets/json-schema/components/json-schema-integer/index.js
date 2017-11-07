define(function (require, exports, module) {
    "use strict";

    require('../../ngModule').component('json-schema-integer', {
        pathPrefix: '/app/shared/widgets/json-schema/',
        controller: IntegerController,
        scope: {
            instance: '=',
            removable: '=',
            readonly: '=',
            focus: '='
        }
    });

    IntegerController.$inject = [
        '$scope',
        'params'
    ];
    function IntegerController($scope, params) {
        $scope.instance = params.instance;
    }
});
