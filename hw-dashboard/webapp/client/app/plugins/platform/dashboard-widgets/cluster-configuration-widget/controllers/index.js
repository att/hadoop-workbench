define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('cluster-configuration.IndexController', Controller);

    Controller.$inject = [
        "$scope",
        "dashboard.models.TabPage",
        "$dashboardWidget",
        "fileManager",
        "main.alerts.alertsManagerService",
        "cluster-configuration.restService",
        "$widgetParams",
        "$q",
        'core.lockProvider',
        'platformWriteAccess'
    ];

    /*jshint maxparams: 11*/
    function Controller($scope, TabPage, $dashboardWidget, fileManager, alertsManagerService, restService, $widgetParams, $q, lockProvider, platformWriteAccess) {
        var platformId = $dashboardWidget.params.platformId;
        var clusterId = $dashboardWidget.params.clusterId;

        $dashboardWidget.title = clusterId + " configuration";

        var lock = lockProvider.getInstance();

        ng.extend($scope, {
            widget: $dashboardWidget,
            showPreloader: false
        });

        $scope.widget.leftTabManager.addTab(TabPage.factory({
            name: "file-browser",
            params: {
                fileManager: fileManager,
                isReadonly: !platformWriteAccess
            }
        }), '', 'File Manager', 'b-configuration-plugin__files-icon', true);

        $scope.$on('open-file.file-browser', function (event, file) {
            event.stopPropagation();
            openNewTabOrHighlightExisting(file);
        });

        $scope.$on('save-file', function (event, file) {
            event.stopPropagation();
            saveFile(file);
        });

        $scope.$on('hide.left-tab-panel', function (event) {
            event.stopPropagation();
            $dashboardWidget.leftTabManager.setActive(-1);
        });

        //TODO(maximk): remove this event when corresponding method is implemented in fileManager
        $scope.$on('upload-file.file-browser', function (event, data) {
            event.stopPropagation();
            var path = data.path + data.file.file.name;
            uploadFile(path, data.file);
        });

        var selectedFilePath = $widgetParams.file;
        if (typeof selectedFilePath !== undefined && fileManager.fileExists(selectedFilePath)) {
            openNewTabOrHighlightExisting({path: selectedFilePath});
            $dashboardWidget.leftTabManager.setActive(-1);
        }

        function openNewTabOrHighlightExisting(file, doNotSetFocus) {
            var allTabs = $dashboardWidget.tabManager.getTabs();
            var existedTab = allTabs.filter(function (tab) {
                return tab.page.params.file && tab.page.params.file.path === file.path;
            })[0];

            if (existedTab && !doNotSetFocus) {
                $dashboardWidget.tabManager.setActive(allTabs.indexOf(existedTab));
                return;
            }

            if (lock.isExists(file.path)) {
                return;
            }
            lock.add(file.path);
            restService.getFile(file.path, platformId, clusterId).then(function (fileData) {
                var data = ng.extend({}, file, fileData);
                var tabIndex = $dashboardWidget.tabManager.addTab(TabPage.factory({
                    name: "file-text-viewer",
                    params: {
                        file: data,
                        readonly: !platformWriteAccess
                    }
                }), file.path);
                if (!doNotSetFocus) {
                    $dashboardWidget.tabManager.setActive(tabIndex);
                }
                lock.remove(file.path);
            }, function () {
                lock.remove(file.path);
            });
        }

        function saveFile(file) {
            $scope.showPreloader = true;
            restService.saveFile(file.path, file.text, platformId, clusterId).then(function () {
                alertsManagerService.addAlertSuccess({
                    title: 'Success',
                    text: 'File "' + file.path + '" has been successfully saved.'
                });
            }).catch(function (error) {
                var errorMessage = ng.isString(error) ? error : error && ng.isString(error.message) ? error.message : 'Unknown error';
                alertsManagerService.addAlertError({
                    title: 'Error',
                    text: 'File "' + file.path + '" has not been saved because of error: ' + errorMessage
                });
            }).finally(function () {
                $scope.showPreloader = false;
            });
        }

        function uploadFile(path, file) {
            return $q(function (resolve, reject) {
                var fileExists = fileManager.fileExists(path);
                if (fileExists) {
                    alertsManagerService.addAlertWarning({
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
                                    resolve();
                                }
                            }
                        ]
                    });
                } else {
                    upload();
                }

                function upload() {
                    file.url = restService.getUploadFileUrl(path, platformId, clusterId);
                    file.onSuccess = function (response) {
                        alertsManagerService.addAlertSuccess({
                            title: 'Success',
                            text: 'File "' + path + '" has been successfully uploaded.'
                        });
                        var newFile = response.data;
                        if (!$scope.$$phase && newFile) {
                            $scope.$apply(function () {
                                fileManager.deleteLocalFile(newFile.path, workflow.files);
                                workflow.files.push(newFile);
                                resolve(newFile);
                            });
                        }
                    };
                    file.onError = function (response, status, headers) {
                        alertsManagerService.addAlertError({
                            title: 'Error',
                            text: 'File "' + path + '" has not been uploaded because of error: ' + response.message
                        });
                        reject(response);
                    };
                    file.upload();
                }
            });

        }
    }
});
