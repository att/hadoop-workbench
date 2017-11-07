/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('userSettings.pages.SettingsUsersPageController', Controller);

    Controller.$inject = [
        '$scope',
        '$widgetParams',
        '$filter',
        'dashboard.models.PageControl',
        'userSettings.restService',
        'main.alerts.alertsManagerService'
    ];
    function Controller($scope, $widgetParams, $filter, PageControl, restService, alertsManagerService) {
        let usersData = $widgetParams.page.params.usersData;
        let rolesListObj = $widgetParams.page.params.rolesList;
        let currentUser = $widgetParams.page.params.currentUser;

        let userSettingsReadAccess = currentUser.features.indexOf('USER_SETTINGS_READ') !== -1;
        let userSettingsWriteAccess = currentUser.features.indexOf('USER_SETTINGS_WRITE') !== -1;

        if (!userSettingsReadAccess) {
            let errorMessage = `User \"${currentUser.login}\" unauthorized to read user settings`;
            ng.extend($scope, {
                errorMessage: errorMessage
            });

            return;
        }

        let addRoleTitle = userSettingsWriteAccess ? "Add role" : "";

        verifyAndTransformUserData(usersData, rolesListObj);

        ng.extend($scope, {
            page: $widgetParams.page,
            usersData: usersData,
            addRoleTitle: addRoleTitle,
            userSettingsWriteAccess: userSettingsWriteAccess,
            selectedAssignment: null,
            autocompleteConfig: getAutocompleteObj(),
            autocompleteRoles: rolesListObj.roles,
            autocompleteRolesFiltered: [],
            autocompleteChannelNewItem: {},
            autocompleteChannelExistingItem: {},
            saveUsers: function () {
                let userData = {
                    assignments: $scope.usersData.assignments.map((assignment) => {
                        return {
                            user: assignment.user,
                            roles: assignment.roles
                        }
                    })
                };

                restService.putUsersRolesAssignments(userData).then(
                     () =>
                        alertsManagerService.addAlertSuccess({
                            title: 'Success',
                            text: 'Settings have been successfully updated'
                        }),
                    (errorMessage)  =>
                        alertsManagerService.addAlertError({
                            title: 'Error',
                            text: 'Settings not been saved because of error: ' + errorMessage
                        })

                );
            },
            addUser: function () {
                let userName = generateUniqueName();
                $scope.usersData.assignments.push({
                    user: userName,
                    roles: [],
                    inputRoleHolder: ''
                });
            },
            removeUser: function (assignment) {
                let index = $scope.usersData.assignments.indexOf(assignment);
                $scope.usersData.assignments.splice(index, 1);
            },
            removeRole: function (assignment, role) {
                let index = assignment.roles.indexOf(role);
                assignment.roles.splice(index, 1);
            },
            isSelected: function (assignment) {
                return assignment === $scope.selectedAssignment;
            },
            select: function (assignment) {
                if (userSettingsWriteAccess) {
                    $scope.selectedAssignment = assignment;
                    filterAutocompleteDataList('', $scope.autocompleteChannelExistingItem);
                }
            },
            unselect: function (assignment) {
                if ($scope.selectedAssignment === assignment) {
                    $scope.addRoleCancel();
                }
            },
            selectValue: function (datalistItem) {
                if ($scope.selectedAssignment !== null) {
                    $scope.selectedAssignment.inputRoleHolder = datalistItem.key;
                    $scope.applyAutocomplete();
                }
            },
            cancelAddRole: function () {
                $scope.selectedAssignment.inputRoleHolder = '';
                $scope.selectedAssignment = null;
            },
            autocompleteRolesNotEmpty: function () {
                return $scope.autocompleteRoles.length !== 0;
            },
            applyAutocomplete: function () {
                let newRole = $scope.selectedAssignment.inputRoleHolder;
                let newRoleObj = {key: newRole};
                let autocompleteRolesPlain = $scope.autocompleteRoles.map((role) => role.key);

                if ($scope.selectedAssignment.roles.indexOf(newRole) === -1) {
                    $scope.selectedAssignment.roles.push(newRole);
                }

                if (autocompleteRolesPlain.indexOf(newRole) === -1) {
                    $scope.autocompleteRoles.push(newRoleObj);
                }

                $scope.selectedAssignment.inputRoleHolder = '';
                $scope.selectedAssignment = null;
            }
        });

        $scope.autocompleteChannelNewItem = ng.extend(
            $scope.autocompleteChannelNewItem,
            newAutocompleteChannel($scope.autocompleteChannelNewItem));

        $scope.autocompleteChannelExistingItem = ng.extend(
            $scope.autocompleteChannelExistingItem,
            newAutocompleteChannel($scope.autocompleteChannelExistingItem));

        /**
         * Adds placeholder to right tabs to fill empty space on the placeholder of "Save" icon
         */
        setUpControls();

        function verifyAndTransformUserData(userData, rolesListObj) {
            if (usersData.errorMessage) {
                alertsManagerService.addAlertError({
                    title: 'Error',
                    text: 'Unable to load roles assignments because of error: ' + usersData.errorMessage
                });
                usersData.assignments = [];
            } else {
                usersData.assignments = usersData.assignments.map((assignment) => {
                    return {
                        user: assignment.user,
                        roles: assignment.roles,
                        inputRoleHolder: ''
                    }
                });
            }

            if (rolesListObj.errorMessage) {
                alertsManagerService.addAlertError({
                    title: 'Error',
                    text: 'Unable to load roles list because of error: ' + rolesListObj.errorMessage
                });
                rolesListObj.roles = [];
            } else {
                rolesListObj.roles = rolesListObj.roles.map(role => {
                    return {
                        key: role
                    }
                });
            }
        }

        function setUpControls() {
            if (userSettingsWriteAccess) {
                var saveControl = PageControl.factory({
                    label: '',
                    tooltip: '',
                    icon: 'b-security-settings-properties__icon-save',
                    action: $scope.saveUsers
                });
                $scope.page.addControl(saveControl);
            }
        }

        function getAutocompleteObj() {
            return {
                start: "",
                startRegexEscaped: "",
                end: "",
                endRegexEscaped: ""
            }
        }

        function filterAutocompleteDataList(newVal, autocompleteChannel) {
            var filteredResults;
            /**
             * Show all options if no input was done buy user
             */
            if (newVal === null || newVal === false) {
                filteredResults = [];
            } else if (newVal === '') {
                filteredResults = $scope.autocompleteRoles
                    .filter((role) => $scope.selectedAssignment.roles.indexOf(role.key) === -1);
            } else {
                filteredResults = $filter('filter')($scope.autocompleteRoles, {key: newVal})
                    .filter((role) => $scope.selectedAssignment.roles.indexOf(role.key) === -1);
            }

            setNewDataToArrayReference($scope.autocompleteRolesFiltered, filteredResults);
            autocompleteChannel.isActive = filteredResults.length;
        }

        function setNewDataToArrayReference(existingArrayReference, newData) {
            /*
             * Save pointer to the existing array!
             */
            existingArrayReference.splice(0);
            existingArrayReference.push.apply(existingArrayReference, newData);
            return existingArrayReference;
        }

        function newAutocompleteChannel(autocompleteChannel) {
            return {
                isActive: false,
                applyAutocompletableValueCb: function (value) {
                    return filterAutocompleteDataList(value, autocompleteChannel);
                },
                substituteValue: false,
            }
        }

        function generateUniqueName () {
            let newName = "New user";
            let uniqueName = newName;
            let userNames = $scope.usersData.assignments.map((assignment) => assignment.user);

            for (let i = 2; userNames.indexOf(uniqueName) !== -1; ++i) {
                uniqueName = newName + ' ' + i;
            }

            return uniqueName;
        }
    }
});
