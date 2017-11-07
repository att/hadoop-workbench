/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('create-tenant-widget.IndexController', SearchController);

    SearchController.$inject = [
        '$scope',
        'dashboard-isolated-widget-accessor.WidgetStore',
        "tenant.redux-actions",
        '$widgetParams',
        'dashboard.WidgetsActions',
        '$ngRedux'
    ];
    function SearchController($scope, WidgetStore, tenantActions, $widgetParams, WidgetsActions, $ngRedux) {

        var dashboardWidget = WidgetStore.getWidget();
        dashboardWidget.title = 'Create New Tenant';
        dashboardWidget.fullWidth = true;
        dashboardWidget.hSize = 3;

        ng.extend($scope, {
            tenantName: $widgetParams.tenantName || "",
            description: $widgetParams.description || "",
            version: $widgetParams.version || "1.0",
            error: null,
            isPosting: false,
            showValidationErrors: false
        });

        let $cuid;
        ng.extend($scope, {
            save: function () {
                if ($scope.tenantForm.$valid) {
                    $cuid = $cuid || require('cuid')();
                    $ngRedux.dispatch(tenantActions.createTenant({
                        name: $scope.tenantName,
                        description: $scope.description,
                        version: $scope.version,
                        $cuid
                    }));
                } else {
                    $scope.showValidationErrors = true;
                }
            }
        });


        let unsubscribe = $ngRedux.connect(state => {
            if (!$cuid) {
                return {};
            }
            let tenant = state.data.tenant.tenants[$cuid];
            if (!tenant) {
                return {};
            }
            if (tenant.id) {
                unsubscribe();
                WidgetsActions.addWidget({
                    widgetName: 'tenant-browser',
                    params: {
                        tenantCuid: tenant.$cuid,
                        tenantId: tenant.id,
                        tenant: tenant
                    }
                }, {
                    before: dashboardWidget
                });
                WidgetsActions.removeWidget(dashboardWidget, true);
            }

            return {
                isPosting: tenant.$meta.isPosting,
                error: tenant.$meta.error
            };
        })($scope);
        $scope.$on('$destroy', unsubscribe);
    }
});
