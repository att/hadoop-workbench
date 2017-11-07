define(function (require) {
    "use strict";

    require('./ngModule').config(configure);

    configure.$inject = [
        'dashboard.WidgetManagerProvider',
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function configure(DashboardManagerProvider, $widgetProvider, dapConfig) {
        $widgetProvider.widget('addService.search', {
            controller: 'addService.SearchController',
            templateUrl: dapConfig.pathToPlugins + '/addService/views/search.html'
        });

        $widgetProvider.widget('addService.searchTenant', {
            controller: 'addService.SearchTenantController',
            templateUrl: dapConfig.pathToPlugins + '/addService/views/search-tenant.html'
        });

        $widgetProvider.widget('addService.create', {
            controller: 'addService.CreateController',
            templateUrl: dapConfig.pathToPlugins + '/addService/views/create.html'
        });

        $widgetProvider.widget('addService.createTenant', {
            controller: 'addService.CreateTenantController',
            templateUrl: dapConfig.pathToPlugins + '/addService/views/create-tenant.html'
        });

        $widgetProvider.widget('addService.createTenantComponent', {
            controller: 'addService.CreateTenantComponentController',
            templateUrl: dapConfig.pathToPlugins + '/addService/views/create-tenant-component.html'
        });

        $widgetProvider.widget('addService.provisionPlatform', {
            controller: 'addService.ProvisionPlatformController',
            templateUrl: dapConfig.pathToPlugins + '/addService/views/provision-platform.html'
        });

        DashboardManagerProvider.widget('addService.search', {
            widget: 'addService.search',
            icon: 'icon-add-service'
        });

        DashboardManagerProvider.widget('addService.searchTenant', {
            widget: 'addService.searchTenant',
            icon: 'icon-add-service'
        });

        DashboardManagerProvider.widget('addService.create', {
            widget: 'addService.create',
            icon: 'icon-add-service'
        });

        DashboardManagerProvider.widget('create-tenant', {
            widget: 'addService.createTenant',
            icon: 'icon-tenant-browser'
        });

        DashboardManagerProvider.widget('create-tenant-component', {
            widget: 'addService.createTenantComponent',
            icon: 'icon-add-service'
        });

        DashboardManagerProvider.widget('provision-platform', {
            widget: 'addService.provisionPlatform',
            icon: 'icon-add-service'
        });
    }
});
