define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('tenant.pages.TenantPropertiesPageController', Controller);

    Controller.$inject = [
        '$scope',
        '$widgetParams',
        'dashboard.models.PageControl',
        'restrictionsService'
    ];
    function Controller($scope, $widgetParams, PageControl, restrictionsService) {
        var saveControl;

        let page = $widgetParams.page;
        let params = $widgetParams.params;

        ng.extend($scope, {
            requesting: false,
            page: $widgetParams.page,
            isReadonly: false,
            containerPropertiesOrder: ["type", "id", "name", "description", "version"]
        });

        ng.extend($scope, {
            save: save
        });

        $scope.tenant = params.tenant;
        $scope.selectedContainer = params.selectedContainer;
        $scope.params = params;

        setUpControls();
        setupWatchers();

        function setupWatchers() {
            $scope.$watch('params.selectedContainer', selectedContainer => {
                $scope.selectedContainer = selectedContainer;
            });
            $scope.$watch('params.tenant', tenant => {
                $scope.tenant = tenant;
            });
        }

        function setUpControls() {
            saveControl = PageControl.factory({
                label: '',
                tooltip: 'Save',
                icon: 'b-tenant-save-icon',
                action: save
            });
            $widgetParams.page.addControl(saveControl);

        }

        function save() {
            var isRestricted = $scope.tenant.properties.isRestrictedValue();
            if (isRestricted === false) {
                if ($scope.selectedContainer) {
                    $widgetParams.params.actions.onUpdateTemplate($scope.selectedContainer);
                } else {
                    $widgetParams.params.actions.onUpdateTenant($scope.tenant);
                }
            }
        }

    }
});
