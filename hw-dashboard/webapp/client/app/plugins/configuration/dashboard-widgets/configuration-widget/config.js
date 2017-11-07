define(function (require) {
    "use strict";

    require('./ngModule').config(configurationConfig);

    configurationConfig.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function configurationConfig($widgetProvider, dapConfig) {
        $widgetProvider.widget('configuration-widget', {
            templateUrl: dapConfig.pathToPlugins + '/configuration/dashboard-widgets/configuration-widget/views/index.html',
            controller: 'configuration-widget.IndexController',
            resolve: {
                $dashboardWidget: ['dashboard-isolated-widget-accessor.WidgetStore', function (WidgetStore) {
                    return WidgetStore.getWidget();
                }],
                filesContainer: ['configuration.restService', function (restService) {
                    return restService.getAllFiles();
                }],
                fileManager: ['filesContainer', 'configuration.FileManager', function (filesContainer, FileManager) {
                    return FileManager.factory(filesContainer.files);
                }],
                settingsWriteAccess : ['$rootScope', function ($rootScope) {
                    return $rootScope.currentUser.features.indexOf('APP_SETTINGS_WRITE') !== -1;
                }]
            }
        });
    }
});
