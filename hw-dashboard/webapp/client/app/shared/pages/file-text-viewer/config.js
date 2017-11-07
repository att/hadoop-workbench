define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('file-text-viewer', {
            templateUrl: dapConfig.pathToShared + '/pages/file-text-viewer/views/index.html',
            controller: 'shared.pages.FileTextViewerController',
            resolve: {
                loadedFile: ['$widgetParams', function($widgetParams){
                    if(typeof $widgetParams.params.getFile === 'function'){
                        return $widgetParams.params.getFile();
                    } else {
                        return $widgetParams.params.file;
                    }
                }],
                readonly: ['$widgetParams', function($widgetParams){
                    if ($widgetParams.params.readonly) {
                        return $widgetParams.params.readonly;
                    }

                    return false;
                }]
            }
        });
    }

});
