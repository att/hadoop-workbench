define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('user-settings.pages.access-keys', {
            templateUrl: dapConfig.pathToApp + '/user-settings/pages/access-keys/views/index.html',
            controller: 'user-settings.pages.AccessKeysPageController'
        });
    }
});
