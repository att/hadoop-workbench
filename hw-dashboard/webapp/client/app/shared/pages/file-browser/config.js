define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('file-browser', {
            templateUrl: dapConfig.pathToShared + '/pages/file-browser/views/index.html',
            controller: 'shared.pages.FileBrowserController',
            resolve: {
                fileManager: ['$widgetParams', function ($widgetParams) {
                    return $widgetParams.params.fileManager;
                }],
                isReadonly: ['$widgetParams', function ($widgetParams) {
                    if ($widgetParams.params.isReadonly) {
                        return $widgetParams.params.isReadonly;
                    }

                    return false;
                }]
            }
        });
    }

});
