define(function (require, exports, module) {
    "use strict";

    require('../../ngModule').component('json-schema-undefined', {
        pathPrefix: '/app/shared/widgets/json-schema/',
        controller: NumberController,
        scope: {
            instance: '=',
            removable: '='
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
