define(function (require) {
    'use strict';

    var ng = require('angular');
    require('../ngModule').controller('user-settings-widget.IndexController', IndexController);

    IndexController.$inject = [
        "$scope",
        "userSettings.storage",
        "user-settings.pages.aws-provision-settings-properties.storageKeys",
        "main.alerts.alertsManagerService",
        "$state",
        'dashboard-isolated-widget-accessor.WidgetStore',
        'dashboard.models.TabPage'
    ];
    function IndexController($scope, storage, awsProvisionStorageKeys, alertsManagerService, $state, WidgetStore, TabPage) {

        var widget = WidgetStore.getWidget();

        ng.extend($scope, {
            widget: widget
        });

        ng.extend($scope, {});

        $scope.$on('save.user-settings', saveSettings);
        $scope.$on('save.aws-provision-settings', saveAwsProvisionSettings);

        widget.tabManager.addTab(TabPage.factory({
            name: "user-settings.pages.settings-page"
        }), '', '', '', true);

        function saveSettings(event, settings) {
            ng.forEach(settings, function (value, key) {
                storage.set(key, value);
            });
            storage.save().then(function () {
                alertsManagerService.addAlertSuccess({
                    title: 'Success',
                    text: 'Settings have been successfully updated'
                });
            }, function (errorMessage) {
                alertsManagerService.addAlertError({
                    title: 'Error',
                    text: 'Settings not been saved because of error: ' + errorMessage
                });
            });
        }

        function saveAwsProvisionSettings(event, settings) {
            storage.set(awsProvisionStorageKeys.AWS_PROVISION, settings);
            storage.save().then(function () {
                alertsManagerService.addAlertSuccess({
                    title: 'Success',
                    text: 'AWS provision Settings have been successfully updated'
                });
            }, function (errorMessage) {
                alertsManagerService.addAlertError({
                    title: 'Error',
                    text: 'AWS provision Settings not been saved because of error: ' + errorMessage
                });
            });
        }

    }
});
