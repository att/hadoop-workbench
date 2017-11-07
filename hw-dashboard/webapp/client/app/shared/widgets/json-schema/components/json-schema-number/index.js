define(function (require, exports, module) {
    "use strict";

    require('../../ngModule').component('json-schema-number', {
        pathPrefix: '/app/shared/widgets/json-schema/',
        controller: NumberController,
        scope: {
            instance: '=',
            removable: '=',
            readonly: '=',
            focus: '='
        }
    });

    NumberController.$inject = [
        '$scope',
        'params'
    ];
    function NumberController($scope, params) {
        $scope.instance = params.instance;
    }
});
