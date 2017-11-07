/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('platform.pages.ServiceUsersPageController', Controller);

    Controller.$inject = [
        '$scope',
        'platform-manager-widget.ServiceUsersStore',
        'platform-manager-widget.Widget.PlatformsStore',
        'platform-manager-widget.ServiceUsersActions',
        '$widgetParams',
        'main.alerts.alertsManagerService',
        'platform.pages.service-users.models.ServiceUser'
    ];
    function Controller($scope, ServiceUsersStore, PlatformsStore, ServiceUsersActions, $widgetParams, alertsManager, ServiceUser) {
        ng.extend($scope, {
            users: ServiceUsersStore.getUsers(),
            keys: PlatformsStore.getAccessKeys("keytab"),
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
                    promise = ServiceUsersActions.updateUser($scope.user);
                } else {
                    operation = "created";
                    promise = ServiceUsersActions.createUser($scope.user);
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
                                ServiceUsersActions.removeUser(user.id).catch(function (error) {
                                    alertsManager.addAlertError({title: "User deletion error", text: error.message});
                                }).finally(function () {
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

        $scope.$listenTo(ServiceUsersStore, 'change', function () {
            $scope.users = ServiceUsersStore.getUsers();
        });

        $scope.$listenTo(PlatformsStore, 'change', function () {
            $scope.keys = PlatformsStore.getAccessKeys("keytab");
        });
    }
});
