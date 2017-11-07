/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('user-settings.pages.AccessKeysPageController', Controller);

    Controller.$inject = [
        '$scope',
        '$widgetParams',
        'main.alerts.alertsManagerService',
        'core.get-file-uploader',
        'userSettings.restService',
        'dashboard.models.PageControl'
    ];
    function Controller($scope, $widgetParams, alertsManager, GetFileUploader, restService, PageControl) {
        ng.extend($scope, {
            showAddKeyFormFlag: false,
            key: null,
            showValidationErrors: false,
            keys: $widgetParams.params.keys,
            fileUploader: GetFileUploader.create({
                queueLimit: 1,
                autoUpload: false,
                removeAfterUpload: true,
                headers: {
                    Authorization: localStorage.token
                },
                onAfterAddingFile: function (file) {
                    $scope.requesting = true;
                    restService.uploadAccessKey(file)
                        .then(function (key) {
                            alertsManager.addAlertSuccess({
                                title: "Access key operation success",
                                text: "Access key has been successfully uploaded"
                            });

                            let index = -1;
                            $scope.keys.forEach(function (k, i) {
                                if (k.id === key.id) {
                                    index = i;
                                }
                            });

                            if (~index) {
                                $scope.keys.splice(index, 1);
                            }

                            $scope.keys.push(key);
                        })
                        .catch(function (error) {
                            alertsManager.addAlertError({
                                title: "Key upload error",
                                text: "Key has not been uploaded because of the error: " + error.message
                            });
                        })
                        .finally(function () {
                            $scope.requesting = false;
                        });
                }
            })
        });

        ng.extend($scope, {
            requesting: false,
            showAddKeyForm: function () {
                $scope.showAddKeyFormFlag = true;
                $scope.key = {
                    principal: "",
                    password: ""
                };
            },
            hideAddKeyForm: function () {
                $scope.showAddKeyFormFlag = false;
                $scope.key = null;
                $scope.showValidationErrors = false;
                $scope.newItemForm.$setPristine();
                $scope.newItemForm.$setUntouched();
            },
            saveKey: function () {
                if ($scope.newItemForm.$invalid) {
                    $scope.showValidationErrors = true;
                    return;
                }
                $scope.requesting = true;
                restService.createAccessKey($scope.key).then(function (key) {
                    $scope.hideAddKeyForm();
                    alertsManager.addAlertSuccess({
                        title: "Access key operation success",
                        text: "Access key has been successfully created"
                    });

                    let index = -1;
                    $scope.keys.forEach(function (k, i) {
                        if (k.id === key.id) {
                            index = i;
                        }
                    });

                    if (~index) {
                        $scope.keys.splice(index, 1);
                    }

                    $scope.keys.push(key);
                }).catch(function (error) {
                    alertsManager.addAlertError({
                        title: "Access key operation error",
                        text: "Access key has not been created because of the error: " + error.message
                    });
                }).finally(function () {
                    $scope.requesting = false;
                });
            },
            removeKey: function (key) {
                alertsManager.addAlertInfo({
                    type: "confirm",
                    title: 'Confirmation',
                    text: 'Are you sure you want to delete a key "' + key.name + '"?',
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                $scope.requesting = true;
                                restService.removeAccessKey(key.id)
                                    .then(function () {
                                        let index = $scope.keys.indexOf(key);
                                        $scope.keys.splice(index, 1);
                                        alertsManager.addAlertSuccess({
                                            title: "Access key operation success",
                                            text: "Access key has been successfully deleted"
                                        });
                                    })
                                    .catch(function (error) {
                                        alertsManager.addAlertError({title: "Key deletion error", text: error.message});
                                    })
                                    .finally(function () {
                                        $scope.requesting = false;
                                    });
                            }
                        },
                        {
                            text: "No",
                            style: "cancel",
                            action: function (close) {
                                close();
                            }
                        }
                    ]
                });
            }
        });

        /**
         * Adds placeholder to right tabs to fill empty space on the placeholder of "Save" icon
         */
        setUpControls();

        function setUpControls() {
            var saveControl = PageControl.factory({
                label: '',
                tooltip: '',
                icon: 'b-user-settings__access-keys__icon-save-invisible',
                action: function () {}
            });
            $widgetParams.page.addControl(saveControl);
        }

    }
});
