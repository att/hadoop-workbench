/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        var ng = require('angular');
        require('../ngModule').controller('tenant.pages.TenantPageContainerPageController', IndexController);

        var angular = require("angular");
        var tenantBrowser;

        IndexController.$inject = [
            '$scope',
            '$widgetParams',
            'dashboard.models.TabPage',
            "dashboard.models.TabPage.EVENTS"
        ];

        function IndexController($scope, $widgetParams, TabPage, TabPageEvents) {
            var page = $widgetParams.page;
            $scope.page = page;

            var widgetInParams = {};
            widgetInParams = Object.assign(widgetInParams, {
                tenant: $scope.page.params.tenant,
                templates: $scope.page.params.templates,
                actions: $scope.page.params.actions
            });

            tenantBrowser = TabPage.factory({
                name: 'tenant-browser',
                params: widgetInParams
            });
            var index = page.leftTabManager.addTab(tenantBrowser, '', '', '', true);
            page.leftTabManager.setActive(index);


            $scope.$watch('page.params', params => {
                widgetInParams = Object.assign(widgetInParams, {
                    tenant: $scope.page.params.tenant,
                    templates: $scope.page.params.templates
                });
            })

        }
    }
);
