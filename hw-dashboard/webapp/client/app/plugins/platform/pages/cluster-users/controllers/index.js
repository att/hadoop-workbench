/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('platform.pages.cluster-info.ClusterUsersPageController', Controller);

    Controller.$inject = [
        '$scope',
        'platform-manager-widget.cluster-info.ClusterUsersStore',
        'platform-manager-widget.Widget.PlatformsStore',
        'platform-manager-widget.cluster-info.ClusterUsersActions',
        '$widgetParams',
        'main.alerts.alertsManagerService',
        'platform.pages.cluster-info.cluster-users.models.ClusterUser',
        'platformWriteAccess'
    ];
    function Controller($scope, ClusterUsersStore, PlatformsStore, ClusterUsersActions, $widgetParams, alertsManager, ClusterUser, platformWriteAccess) {

        let clusterCredentials = ClusterUsersStore.getClusterCredentials();

        ng.extend($scope, {
            platformId: clusterCredentials.platformId,
            clusterId: clusterCredentials.clusterId,
            users: ClusterUsersStore.getUsers(),
            keys: PlatformsStore.getAccessKeys("keytab"),
            user: null,
            platformWriteAccess: platformWriteAccess
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
                    promise = ClusterUsersActions.updateUser($scope.user, $scope.platformId, $scope.clusterId);
                } else {
                    operation = "created";
                    promise = ClusterUsersActions.createUser($scope.user, $scope.platformId, $scope.clusterId);
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
                    homePath: user.homePath,
                    team: user.team
                };
            },
            removeUser: function (user) {
                alertsManager.addAlertInfo({
                    type: "confirm",
                    title: 'Confirmation',
                    text: 'Are you sure you want to delete a user "' + user.name + '"?',
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                $scope.requesting = true;
                                ClusterUsersActions.removeUser($scope.platformId, $scope.clusterId, user.id).catch(function (error) {
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

        $scope.$listenTo(ClusterUsersStore, 'change', function () {
            let clusterCredentials = ClusterUsersStore.getClusterCredentials();

            $scope.users = ClusterUsersStore.getUsers();
            $scope.platformId = clusterCredentials.platformId;
            $scope.clusterId = clusterCredentials.clusterId;
        });

        $scope.$listenTo(PlatformsStore, 'change', function () {
            $scope.keys = PlatformsStore.getAccessKeys("keytab");
        });
    }
});
