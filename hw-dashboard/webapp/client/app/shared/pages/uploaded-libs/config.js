define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('uploaded-libs', {
            templateUrl: dapConfig.pathToShared + '/pages/uploaded-libs/views/index.html',
            controller: 'shared.pages.UploadedLibsController'
        });
    }

});
