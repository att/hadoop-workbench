/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('platform.pages.AccessKeysPageController', Controller);

    Controller.$inject = [
        '$scope',
        'platform-manager-widget.cluster-info.ClusterUsersStore',
        'core.get-file-uploader',
        'platform-manager-widget.Widget.PlatformsStore',
        'platform-manager-widget.Widget.PlatformsActions',
        '$widgetParams',
        'main.alerts.alertsManagerService',
        'platformWriteAccess'
    ];
    function Controller($scope, ClusterUsersStore, GetFileUploader, PlatformsStorage, PlatformsActions, $widgetParams, alertsManager, platformWriteAccess) {
        ng.extend($scope, {
            showAddKeyFormFlag: false,
            key: null,
            showValidationErrors: false,
            requesting: false,
            mode: $widgetParams.params.mode,
            platformId: $widgetParams.params.platformId,
            clusterId: $widgetParams.params.clusterId,
            title: $widgetParams.params.mode === "PEM" ? "SSH keys" : "Hadoop service keys",
            files: PlatformsStorage.getAccessKeys($widgetParams.params.mode),
            platformWriteAccess: platformWriteAccess,
            fileUploader: GetFileUploader.create({
                queueLimit: 1,
                autoUpload: false,
                removeAfterUpload: true,
                headers: {
                    Authorization: localStorage.token
                },
                onAfterAddingFile: function (fileItem) {
                    $scope.requesting = true;
                    PlatformsActions.uploadAccessKey(fileItem, $scope.mode === 'PEM', $scope.platformId, $scope.clusterId)
                        .catch(function (error) {
                            alertsManager.addAlertError({
                                title: "Key upload error",
                                text: "Key has not been uploaded"
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
                PlatformsActions.createAccessKey($scope.key, $scope.platformId, $scope.clusterId)
                    .catch(function (error) {
                        alertsManager.addAlertError({
                            title: "Access key operation error",
                            text: "Access key has not been created because of the error: " + error.message
                        });
                    })
                    .finally(function () {
                        $scope.requesting = false;
                        $scope.hideAddKeyForm();
                    });
            },
            deleteFile: function (file) {
                alertsManager.addAlertInfo({
                    type: "confirm",
                    title: 'Confirmation',
                    text: 'Are you sure you want to delete a key file "' + file.name + '"?',
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                $scope.requesting = true;
                                PlatformsActions.removeAccessKey(file, $scope.platformId, $scope.clusterId)
                                    .catch(function (error) {
                                        alertsManager.addAlertError({
                                            title: "Key delete error",
                                            text: "Key has not been deleted"
                                        });
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
                        }]
                });
            }
        });

        $scope.$listenTo(ClusterUsersStore, 'change', function () {
            let clusterCredentials = ClusterUsersStore.getClusterCredentials();

            $scope.platformId = clusterCredentials.platformId;
            $scope.clusterId = clusterCredentials.clusterId;
        });

        $scope.$listenTo(PlatformsStorage, 'change', function () {
            $scope.files = PlatformsStorage.getAccessKeys($widgetParams.params.mode);
        });
    }
});
