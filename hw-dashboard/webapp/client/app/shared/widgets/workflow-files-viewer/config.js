define(function (require) {
    "use strict";

    require('./ngModule').config(workflowFilesViewerConfig);

    workflowFilesViewerConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function workflowFilesViewerConfig($widgetProvider, dapConfig) {
        $widgetProvider.widget('filesViewer', {
            controller: 'shared.filesViewerController',
            templateUrl: dapConfig.pathToShared + '/widgets/workflow-files-viewer/views/files.html',
            resolve: {
                savedFiles: ['$widgetParams', function ($widgetParams) {
                    return $widgetParams.saved || {title: '', sections: []};
                }],
                stagedFiles: ['$widgetParams', function ($widgetParams) {
                    return $widgetParams.staged || {title: '', sections: []};
                }]
            }
        });
    }

});
