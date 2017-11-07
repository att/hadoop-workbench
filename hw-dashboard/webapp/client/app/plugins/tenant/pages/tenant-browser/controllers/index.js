define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('tenant.pages.TenantBrowserPageController', Controller);

    let types = require('shared/widgets/json-schema/services/types');

    Controller.$inject = [
        '$scope',
        'dashboard.models.TabPage',
        '$widgetParams'
    ];
    function Controller($scope, TabPage, $widgetParams) {

        let params = $widgetParams.params;

        // extend properties
        ng.extend($scope, {
            loading: false,
            selectedContainer: null
        });

        // extend methods
        ng.extend($scope, {

            onTenantClicked: function (templateContainer, $event) {
                $event.stopPropagation();
                $scope.selectTenantContainer(templateContainer);
            },
            openContainer: function (templateContainer) {
                if (templateContainer) {
                    $scope.$emit('open-component.tenant-browser', templateContainer);
                } else {
                    throw new Error('No tenant is selected');
                }
            },
            deployComponent: function (component) {
                if (component) {
                        $scope.$emit('deploy-component.tenant-browser', component);
                    } else {
                        throw new Error('No component is selected');
                    }
            },
            deselectAll: function () {
                $scope.selectedContainer = null;
            },
            selectTenantContainer: function (templateContainer) {
                $scope.selectedContainer = templateContainer;
                $widgetParams.page.rightTabManager.setActive(propertiesTabIndex);
            },
            onRemoveTemplate: $widgetParams.params.actions.onRemoveTemplate || angular.noop,
            //onUpdateTemplate: $widgetParams.params.onUpdateTemplate || angular.noop,
            backgroundClicked: function (event) {
                event.stopPropagation();
                $scope.deselectAll();
            }
        });

        $scope.tenant = params.tenant;
        $scope.templates = params.templates;
        $scope.params = params;

        var widgetInParams = {};
        widgetInParams = Object.assign(widgetInParams, {
            tenant: $scope.tenant,
            selectedContainer: $scope.selectedContainer,
            actions: $widgetParams.params.actions
        });

        var uploadTab = TabPage.factory({
            active: true,
            name: 'tenant.pages.tenant-upload',
            params: $scope.tenant
        });
        var uploadTabIndex = $widgetParams.page.rightTabManager.addTab(uploadTab, '', 'Upload', 'b-tenant-upload-icon', false);

        var propertiesTabIndex = $widgetParams.page.rightTabManager.addTab(TabPage.factory({
            active: true,
            name: 'tenant.pages.tenant-properties',
            params: widgetInParams
        }), '', 'Properties', 'b-tenant-options-icon', false);

        $widgetParams.page.rightTabManager.setActive(uploadTabIndex);

        setupWatchers();

        function setupWatchers() {
            $scope.$watch('params.tenant', tenant => {
                $scope.tenant = tenant;
                widgetInParams = Object.assign(widgetInParams, {
                    tenant: tenant
                });
            });
            $scope.$watch('params.templates', templates => {
                $scope.templates = templates;
                widgetInParams = Object.assign(widgetInParams, {
                    templates: templates
                });
                $scope.selectedContainer = null;
            });
            $scope.$watch('selectedContainer', template => {
                widgetInParams = Object.assign(widgetInParams, {
                    selectedContainer: template
                });
            });
        }


    }
});
