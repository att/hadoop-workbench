define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('user-settings.pages.aws-provision-settings-properties', {
            templateUrl: dapConfig.pathToApp + '/user-settings/pages/aws-provision-settings-properties/views/index.html',
            controller: 'userSettings.pages.awsProvisionSettingsPropertiesPageController'
        });
    }
});
