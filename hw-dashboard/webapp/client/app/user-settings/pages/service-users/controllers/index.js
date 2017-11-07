/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('user-settings.pages.ServiceUsersPageController', Controller);

    Controller.$inject = [
        '$scope',
        '$widgetParams',
        'main.alerts.alertsManagerService',
        'user-settings.pages.service-users.models.ServiceUser',
        'userSettings.restService',
        'dashboard.models.PageControl'
    ];
    function Controller($scope, $widgetParams, alertsManager, User, restService, PageControl) {
        ng.extend($scope, {
            users: $widgetParams.params.users,
            keys: $widgetParams.params.keys,
            user: null
        });

        ng.extend($scope, {
            requesting: false,
            showAddUserForm: function () {
                $scope.user = {
                    id: null,
                    name: "",
                    keyId: null,
                    homePath: ""
                };
            },
            hideAddUserForm: function () {
                $scope.user = null;
            },
            saveUser: function () {
                var promise, operation;
                $scope.requesting = true;
                if ($scope.user.id !== null) {
                    operation = "updated";
                    promise = restService.updateServiceUser($scope.user).then((user) => {
                        let index = -1;
                        $scope.users.some((u, i) => {
                            if (u.id === $scope.user.id) {
                                index = i;
                                return true;
                            } else {
                                return false;
                            }
                        });
                        $scope.users.splice(index, 1);
                        $scope.users.push(user);
                    });
                } else {
                    operation = "created";
                    promise = restService.createServiceUser($scope.user).then((user) => {
                        $scope.users.push(user);
                    });
                }

                promise.then(function () {
                    $scope.user = null;
                    alertsManager.addAlertSuccess({
                        title: "User operation success",
                        text: "User have been successfully " + operation
                    });
                }).catch(function (error) {
                    alertsManager.addAlertError({
                        title: "User operation error",
                        text: "User have not been " + operation + " because of the error: " + error.message
                    });
                }).finally(function () {
                    $scope.requesting = false;
                });
            },
            editUser: function (user) {
                $scope.user = {
                    id: user.id,
                    name: user.name,
                    keyId: user.keyId,
                    homePath: user.homePath
                };
            },
            removeUser: function (user) {
                alertsManager.addAlertInfo({
                    type: "confirm",
                    title: 'Confirmation',
                    text: 'Are you sure you want to delete a user "' + user.title + '"?',
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                $scope.requesting = true;
                                restService.removeServiceUser(user.id)
                                    .then(function () {
                                        let index = $scope.users.indexOf(user);
                                        $scope.users.splice(index, 1);
                                        alertsManager.addAlertSuccess({
                                            title: "User operation success",
                                            text: "User have been successfully deleted"
                                        });
                                    })
                                    .catch(function (error) {
                                        alertsManager.addAlertError({
                                            title: "User deletion error",
                                            text: error.message
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

        /**
         * Adds placeholder to right tabs to fill empty space on the placeholder of "Save" icon
         */
        setUpControls();

        function setUpControls() {
            var saveControl = PageControl.factory({
                label: '',
                tooltip: '',
                icon: 'b-user-settings__service-users__icon-save-invisible',
                action: function () {}
            });
            $widgetParams.page.addControl(saveControl);
        }

    }
});
