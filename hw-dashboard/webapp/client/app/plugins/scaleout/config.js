define(function (require) {
    "use strict";

    require('./ngModule').config(configure);

    configure.$inject = ['dap.core.config', 'dap-widget.$widgetProvider'];
    function configure(dapConfig, $widgetProvider) {
        $widgetProvider
            .widget('scaleout', {
                templateUrl: dapConfig.pathToPlugins + '/scaleout/views/index.html'
            });
    }
});
