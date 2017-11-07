define(function (require, exports, module) {
    "use strict";

    require('../../ngModule').component('json-schema-boolean', {
        pathPrefix: '/app/shared/widgets/json-schema/',
        controller: BooleanController,
        scope: {
            instance: '=',
            removable: '=',
            readonly: '=',
            focus: '='
        }
    });

    BooleanController.$inject = [
        '$scope',
        'params'
    ];
    function BooleanController($scope, params) {
        $scope.instance = params.instance;
    }
});
