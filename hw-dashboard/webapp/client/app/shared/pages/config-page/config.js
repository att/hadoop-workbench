define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('config-page', {
            templateUrl: dapConfig.pathToShared + '/pages/config-page/views/index.html',
            controller: 'shared.pages.ConfigPageController',
            resolve: {}
        });
    }

});
