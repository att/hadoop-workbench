define(function (require) {
    "use strict";

    require("../ngModule").controller("oozie.widgets.optionsEditor.indexController", indexController);

    var ng = require("angular");
    indexController.$inject = ["$scope"];
    function indexController($scope) {

        var schemaInstance, fileManagerEvents = $scope.$new(true);

        ng.extend($scope, {
            showFileBrowser: false,
            fileManagerEvents: fileManagerEvents,
            fileBrowserButtonsDisabled: false,
            selectedFile: null
        });

        $scope.$watch('node', function () {
            // when node changes hide file browser
            $scope.showFileBrowser = false;
        });

        ng.extend($scope, {
            selectFile: function () {
                $scope.showFileBrowser = false;
                // path is added to the property without leading slash
                var fullPath = $scope.selectedFile.fullPath.replace(/^\//, "");
                schemaInstance.value = schemaInstance.schema.pathPrefix !== undefined ? schemaInstance.schema.pathPrefix + "/" + fullPath : fullPath;
                $scope.selectedFile = null;
            },
            exitFileSelectionMode: function () {
                $scope.showFileBrowser = false;
                $scope.selectedFile = null;
            }
        });

        fileManagerEvents.$on('path-updated', (event, item) => {
            if ($scope.selectedFile && $scope.selectedFile.fullPath !== item) {
                $scope.selectedFile = null;
            }
        });

        fileManagerEvents.$on('file-selected', (event, item) => {
            event.preventDefault();
            $scope.selectedFile = item;
        });

        fileManagerEvents.$on('dir-selected', (event, item) => {
            event.preventDefault();
            $scope.selectedFile = item;
        });

        fileManagerEvents.$on('item-created', (event, item) => {
            $scope.$emit('item-created.options-editor', item);
        });

        fileManagerEvents.$on('create-item-mode-change', (event, enabled) => {
            $scope.fileBrowserButtonsDisabled = enabled;
        });

        $scope.removeConnection = function (connection) {
            $scope.$emit("connection-remove.options-editor", connection);
        };

        $scope.removeNode = function (node) {
            $scope.$emit("node-remove.options-editor", node);
        };

        $scope.$on('select-file.file-ref', function (event, data) {
            event.stopPropagation();
            schemaInstance = data.property;
            $scope.showFileBrowser = true;
        });

        $scope.$on('open-file.file-ref', function (event, data) {
            event.stopPropagation();
            // files in agent start with a leading slash
            var path = "/" + data.property.value.replace(data.property.schema.pathPrefix, "").replace(/^\//, "");
            var file = {
                path: path,
                type: data.property.schema.fileType,
                defaultFile: data.property.schema.defaultFile
            };
            $scope.$emit('open-file.options-editor', file);
        });
    }
});
