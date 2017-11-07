define(function (require, exports, module) {
    "use strict";

    require('../../ngModule').component('json-schema-string', {
        pathPrefix: '/app/shared/widgets/json-schema/',
        controller: StringController,
        scope: {
            instance: '=',
            removable: '=',
            readonly: '=',
            focus: '=',
            first: '='
        }
    });

    StringController.$inject = [
        '$scope',
        'params'
    ];
    function StringController($scope, params) {
        $scope.instance = params.instance;
        $scope.showPassword = false;
        $scope.isPathEditModeEnabled = false;
        $scope.restrictions = params.instance.schema.restrictions || [];
        $scope.error = false;

        $scope.toggleShowPassword = function () {
            $scope.showPassword = !$scope.showPassword;
        };

        $scope.selectFile = function () {
            $scope.$emit('select-file.file-ref', {
                property: $scope.instance
            });
        };

        $scope.openFile = function () {
            $scope.$emit('open-file.file-ref', {
                property: $scope.instance
            });
        };

        $scope.removeFile = function () {
            $scope.instance.value = '';
        };

        $scope.editPath = function () {
            $scope.isPathEditModeEnabled = true;
        };

        $scope.exitPathEditMode = function () {
            $scope.isPathEditModeEnabled = false;
        };

    }
});
