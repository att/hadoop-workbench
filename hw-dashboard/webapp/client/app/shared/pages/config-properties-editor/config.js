define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('config-properties-editor', {
            templateUrl: dapConfig.pathToShared + '/pages/config-properties-editor/views/index.html',
            controller: 'shared.pages.ConfigPropertiesEditorController',
            resolve: {
            }
        });
    }

});
