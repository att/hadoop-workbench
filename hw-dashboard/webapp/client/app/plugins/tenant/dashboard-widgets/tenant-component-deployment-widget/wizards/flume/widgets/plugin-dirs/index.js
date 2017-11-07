define(function (require) {
    "use strict";

    require('../../ngModule').controller('deploy-component.wizards.flume.pluginDirsController', pluginDirsController);
    let ng = require("angular");

    pluginDirsController.$inject = [
        '$scope',
        '$widgetParams',
        'directories',
        '$filter'
    ];
    function pluginDirsController($scope, $widgetParams, dirs, $filter) {
        ng.extend($scope, {
            data: $widgetParams.data,
            stepNumber: $widgetParams.stepNumber,
            searchString: '',
            dirsFiltered: [],
            showCustomDirectoryInput: false,
            dirs: dirs.reduce((combined, dir)=> {
                let value = `${dir}/${$widgetParams.data.service.title}/${$widgetParams.data['flume-component']}`;
                combined.push({value: value});
                return combined;
            }, [])
        });

        ng.extend($scope, {
            selectDirectory: (dir) => {
                $scope.showCustomDirectoryInput = false;
                $scope.data.pluginDir = dir;
            },
            addCustomDirectory: () => {
                $scope.showCustomDirectoryInput = true;
                $scope.data.pluginDir = {value: ""};
            },
            title: () => {
                return "Select plugin dir";
            }
        });

        if ($scope.data.pluginDir) {
            let pluginDirExists = $scope.dirs.some((dir) => $scope.data.pluginDir.value === dir.value);
            if (!pluginDirExists) {
                $scope.showCustomDirectoryInput = true;
            }
        }

        $scope.$watch('searchString', function (searchString) {
            var list = $filter('filter')($scope.dirs, {value: searchString});
            $scope.dirsFiltered.splice(0);
            $scope.dirsFiltered.push.apply($scope.dirsFiltered, list);
        });

        $scope.showValidationErrors = false;
        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });
    }
});
