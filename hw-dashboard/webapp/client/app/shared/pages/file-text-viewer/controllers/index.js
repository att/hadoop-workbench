define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('shared.pages.FileTextViewerController', Controller);

    Controller.$inject = [
        '$scope',
        '$widgetParams',
        'dashboard.models.PageControl',
        'loadedFile',
        'readonly'
    ];
    function Controller($scope, $widgetParams, PageControl, file, isReadonly) {
        var page = $widgetParams.page;

        if (file.statusText && file.message) {
            file.errorMessage = file.statusText + ': ' +  file.message;
            ng.extend($scope, {
                file: file
            });

            return;
        }
        //scope fields
        ng.extend($scope, {
            file: file,
            savedFileText: file.text,
            options: {
                mode: getExt(file.path),
                lineNumbers: true,
                lineWrapping: true
            }
        });

        $scope.$watch('[file.text, savedFileText]', function () {
            page.setDirty($scope.file.text !== $scope.savedFileText);
        });
        $scope.$on('save-file-success', function (event, savedFile) {
            if (savedFile === file) {
                $scope.savedFileText = savedFile.text;
            }
        });

        setupPageControls();

        function setupPageControls() {
            var saveModuleCtrl = new PageControl({
                type: 'button',
                icon: 'b-oozie-plugin__flowchart-widget__save-icon',
                label: '',
                tooltip: 'Save',
                enable: true,
                action: saveFile,
                styleAsTab: false
            });
            page.controls.splice(0);
            if (!isReadonly) {
                page.addControl(saveModuleCtrl);
            }
        }

        function saveFile() {
            $scope.$emit('save-file', file);
        }

        function getExt(path) {
            var lastIndex = path.lastIndexOf(".");
            var extensionResult = path.substr(lastIndex + 1);
            switch (extensionResult) {
                case 'hql':
                    return 'text/x-hive';
                case 'sql':
                    return 'text/x-sql';
                case 'xml':
                    return 'text/xml';
                case 'pig':
                    return 'text/x-pig';
                case 'properties':
                    return 'text/x-properties';
                case 'sh':
                    return 'text/x-sh';
                case 'py':
                    return 'text/x-python';
                default:
                    return 'plain/text';
            }
        }
    }
});
