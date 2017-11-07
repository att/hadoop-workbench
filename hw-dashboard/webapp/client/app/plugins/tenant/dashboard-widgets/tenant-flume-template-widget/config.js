define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('tenant-flume-template-widget', {
            templateUrl: dapConfig.pathToPlugins + '/tenant/dashboard-widgets/tenant-flume-template-widget/views/index.html',
            controller: 'tenant-flume-template-widget.IndexController',
            resolve: {
                componentDescriptor: ['$widgetParams', function ($widgetParams) {
                    return $widgetParams.componentDescriptor;
                }],
                fileManager: ["tenant.FileManager", "componentDescriptor", "flume.restService", function (FileManager, componentDescriptor, restService) {
                    return new FileManager(componentDescriptor.info.id, restService);
                }],
                component: [
                    'componentDescriptor',
                    'tenant.restService',
                    "fileManager",
                    function (componentDescriptor, restService, fileManager) {
                        return restService.getFlumeComponent('v1.0', componentDescriptor.info.id).then(function (component) {
                            fileManager.init(component.files);
                            return component;
                        });
                }],
                tenant: [
                    'componentDescriptor',
                    'tenant.restService',
                    function (componentDescriptor, restService) {
                        return restService.getTenant('v1.0', componentDescriptor.info.tenantId).then(function (tenant) {
                            return tenant;
                        });
                    }
                ]
            }
        });
    }
});
