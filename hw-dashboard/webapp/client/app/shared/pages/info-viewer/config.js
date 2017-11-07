define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('info-viewer', {
            templateUrl: dapConfig.pathToShared + '/pages/info-viewer/views/index.html',
            controller: 'shared.pages.InfoViewerController',
            scope: {
                'params.savedAt': '=',
                'params.data': '='
            }
        });
    }
});
