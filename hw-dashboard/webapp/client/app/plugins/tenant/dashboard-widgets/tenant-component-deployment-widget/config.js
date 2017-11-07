define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('tenant-component-deployment-widget', {
            templateUrl: dapConfig.pathToPlugins + '/tenant/dashboard-widgets/tenant-component-deployment-widget/views/index.html',
            controller: 'tenant-component-deployment-widget.IndexController',
            resolve: {
                componentDescriptor: ['$widgetParams', function ({componentDescriptor = {}}) {
                    return componentDescriptor;
                }],
                deploymentDescriptor: ['$widgetParams', function ({deploymentDescriptor = {}}) {
                    return deploymentDescriptor;
                }]
            }
        });
    }
});
