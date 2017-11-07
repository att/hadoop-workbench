define(function (require) {
    "use strict";

    var ng = require('angular');
    var $ = require('jquery');
    require('../ngModule').controller('shared.pages.UploadedLibsController', Controller);

    Controller.$inject = [
        '$scope',
        'core.get-file-uploader',
        'main.alerts.alertsManagerService',
        '$widgetParams'
    ];
    function Controller($scope, GetFileUploader, alertsManager, $widgetParams) {
        //scope fields
        var fileManager = $widgetParams.params.fileManager;
        fileManager.updateFiles();
        ng.extend($scope, {
            files: processFiles(fileManager.getLibraryFiles()),
            fileUploader: GetFileUploader.create({
                onAfterAddingFile: uploadLibraryFile
            }),
            showPushPullButtons: $widgetParams.params.enablePushPull,
            showLibraryPreloader: false
        });
        ng.extend($scope, {
            filesTotalSize: processFilesTotalSize($scope.files)
        });
        //scope methods
        ng.extend($scope, {
            deleteFile: function (file) {
                alertsManager.addAlertInfo({
                    type: "confirm",
                    title: 'Confirmation',
                    text: 'Are you sure you want to delete file "' + file.data.path + '"?',
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                $scope.showLibraryPreloader = true;
                                fileManager.deleteFile({path: file.data.path}).then(function () {
                                    alertsManager.addAlertSuccess({
                                        title: 'Success',
                                        text: 'File "' + file.data.path + '" has been successfully deleted.'
                                    });
                                }).catch(function (response) {
                                    alertsManager.addAlertError({
                                        title: 'Error',
                                        text: 'File "' + file.data.path + '" has not been deleted because of error: ' + response.message
                                    });
                                }).finally(function () {
                                    $scope.showLibraryPreloader = false;
                                });
                            }
                        },
                        {
                            text: "No",
                            style: "cancel",
                            action: function (close) {
                                close();
                            }
                        }]
                });
            },
            pull: function () {
                $scope.showLibraryPreloader = true;
                $widgetParams.params.actions.pullLibraries().then(function () {
                    alertsManager.addAlertSuccess({
                        title: 'Success',
                        text: 'Pull operation succeeded.'
                    });
                }).catch(function () {
                    alertsManager.addAlertError({
                        title: 'Error',
                        text: 'Pull operation failed.'
                    });
                }).finally(function () {
                    $scope.showLibraryPreloader = false;
                });
            },
            push: function () {
                $scope.showLibraryPreloader = true;
                $widgetParams.params.actions.pushLibraries().then(function () {
                    alertsManager.addAlertSuccess({
                        title: 'Success',
                        text: 'Push operation succeeded.'
                    });
                }).catch(function () {
                    alertsManager.addAlertError({
                        title: 'Error',
                        text: 'Push operation failed.'
                    });
                }).finally(function () {
                    $scope.showLibraryPreloader = false;
                });
            }
        });

        fileManager.on('file-manager-files-updated', function (event, files) {
            $scope.files = processFiles(fileManager.getLibraryFiles());
            $scope.filesTotalSize = processFilesTotalSize($scope.files);
        });

        function processFiles(files) {
            return files.map(function (f) {
                return {
                    data: f,
                    name: f.path.replace(/^(.{0,}\/)/, ''),
                    size: f.size
                };
            });
        }

        /**
         * Calculate total size of all files
         * 
         * @param {Array} files
         * @returns {*}
         */
        function processFilesTotalSize(files) {
            return files.reduce(function (prev, currentItem) {
                return isNaN(prev) ? 0 : prev + currentItem.size;
            }, 0);
        }

        function uploadLibraryFile(uploaderFileItem) {
            var file = uploaderFileItem.file;
            var fileExists = fileManager.libraryFileExists(file.name);
            if (fileExists) {
                alertsManager.addAlertWarning({
                    title: 'Warning',
                    text: 'A file with such name is already uploaded. Do you want to replace it?',
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                upload();
                            }
                        },
                        {
                            text: "No",
                            style: "cancel",
                            action: function (close) {
                                close();
                                uploaderFileItem.remove();
                            }
                        }
                    ]
                });
            } else {
                upload();
            }
            function upload() {
                $scope.showLibraryPreloader = true;
                fileManager.uploadLibraryFile(uploaderFileItem).then(function () {
                    alertsManager.addAlertSuccess({
                        title: 'Success',
                        text: 'File "' + uploaderFileItem.file.name + '" has been successfully uploaded.'
                    });
                }).catch(function (response) {
                    alertsManager.addAlertError({
                        title: 'Error',
                        text: 'File "' + uploaderFileItem.file.name + '" has not been uploaded because of error: ' + response.message
                    });
                }).finally(function () {
                    $scope.showLibraryPreloader = false;
                });

            }
        }
    }
});
