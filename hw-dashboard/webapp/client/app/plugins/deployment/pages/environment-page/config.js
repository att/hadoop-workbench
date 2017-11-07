define(function (require) {
    "use strict";

    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('deployment-environment-page', {
            templateUrl: dapConfig.pathToPlugins + '/deployment/pages/environment-page/views/index.html',
            controller: 'deployment.pages.EnvironmentPageController'
        });
    }
});
