require('../ngModule').controller('tenant.pages.BrowserController', BrowserController);

let types = require('shared/widgets/json-schema/services/types');

BrowserController.$inject = [
    '$scope',
    'main.alerts.alertsManagerService',
    'dashboard.models.PageControl',
    'tenant.models.TenantContainer',
    '$widgetParams',
    'core.utils.string-format',
    '$ngRedux',
    'tenant.redux-actions'
];
function BrowserController($scope, alertsManager, PageControl, TenantContainer, $widgetParams, stringFormat, $ngRedux, tenantActions) {
    let {dispatch} = $ngRedux;
    let page = $widgetParams.page;
    let tenant = $widgetParams.params.tenant;
    // scope fields
    angular.extend($scope, {
        tenant: tenant,
        templates: $widgetParams.params.templates,
        selectedContainer: null,
        splitWidgets: true,
        widgets: {
            tenantList: {
                active: true
            },
            uploadTenant: {
                active: true
            }
        },
        uploadOptions: {
            apiVersion: 'v1.0',
            onSuccessItem: function (item, response, status, headers) {
                if (status === 200) {
                    var newTemplates = TenantContainer.processApiResponse(response.data.templates);
                    dispatch(tenantActions.getTemplates($scope.uploadOptions.tenantId));

                    var successMessageTemplate = 'Template{0} "{1}" {2} been successfully uploaded';
                    var successMessageText = stringFormat(
                        successMessageTemplate,
                        newTemplates.length > 1 ? 's' : '',
                        newTemplates.map(function (t) {
                            return t.info.name;
                        }).join('", "'),
                        newTemplates.length > 1 ? 'have' : 'has'
                    );

                    alertsManager.addAlertSuccess({
                        title: 'Success',
                        text: successMessageText
                    });
                }
            },
            onErrorItem: function (item, response, status, headers) {
                var message = response.message || 'unknown error';
                alertsManager.addAlertError({
                    title: "Upload failed",
                    text: "Tenant has not been uploaded on server because of error: " + message
                });
            },
            tenantId: tenant ? tenant.id : null
        },
        editTenantOptions: {
            tenantId: tenant ? tenant.id : null
        },
        containerPropertiesOrder: ["type", "id", "name", "description", "version"]

    });

    // scope methods
    angular.extend($scope, {
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
            toggleShowWidget('uploadTenant', true);
        },
        selectTenantContainer: function (templateContainer) {
            $scope.selectedContainer = templateContainer;
            toggleShowWidget('containerProperties', true);
        },
        onRemoveTemplate: $widgetParams.params.onRemoveTemplate || angular.noop,
        onUpdateTemplate: $widgetParams.params.onUpdateTemplate || angular.noop,
        backgroundClicked: function (event) {
            event.stopPropagation();
            $scope.deselectAll();
            if ($scope.widgets.containerProperties.active) {
                toggleShowWidget('containerProperties', false);
            }
        }
    });

    this.onParamChanged = (param, newVal)=> {
        switch (param) {
            case 'params':
                $scope.tenant = newVal.tenant;
                $scope.uploadOptions.tenantId = $scope.tenant ? $scope.tenant.id : null;
                $scope.editTenantOptions.tenantId = $scope.tenant ? $scope.tenant.id : null;
                $scope.templates = newVal.templates || [];
                $scope.selectedContainer = $scope.selectedContainer
                    ? $scope.templates.filter(template => template.info.id === $scope.selectedContainer.info.id)[0] || null
                    : null;
                $scope.onRemoveTemplate = newVal.onRemoveTemplate || angular.noop;
                $scope.onUpdateTemplate = newVal.onUpdateTemplate || angular.noop;
        }
    };

    //set tabs
    var uploadTenantTab = PageControl.factory({
        label: 'Upload',
        tooltip: 'Upload',
        type: 'tab',
        icon: 'b-tenant-upload-icon',
        css: 'b-tenant-upload-tab',
        active: true,
        enable: true,
        action: toggleShowWidget.bind(null, "uploadTenant", false)
    });
    var containerPropertiesTab = PageControl.factory({
        label: '',
        tooltip: 'Properties',
        type: 'tab',
        icon: 'b-oozie-plugin__options-editor-widget__icon',
        active: false,
        enable: true,
        action: toggleShowWidget.bind(null, "containerProperties", false)
    });
    page.addControl(uploadTenantTab);
    page.addControl(containerPropertiesTab);
    $scope.widgets.uploadTenant = uploadTenantTab;
    $scope.widgets.containerProperties = containerPropertiesTab;
    $scope.widgets.uploadTenant.active = true;

    function toggleShowWidget(widgetName, keepActive) {
        var widgetsToHide = {
            uploadTenant: ["containerProperties"],
            containerProperties: ["uploadTenant"]
        };

        if (!angular.isUndefined($scope.widgets[widgetName])) {
            var isCurrentlyActive = $scope.widgets[widgetName].active === true;
            if (isCurrentlyActive && !keepActive) {
                $scope.widgets[widgetName].active = false;
                $scope.splitWidgets = false;
            } else {
                $scope.widgets[widgetName].active = true;
                $scope.splitWidgets = true;
                if (!angular.isUndefined(widgetsToHide[widgetName])) {
                    widgetsToHide[widgetName].forEach(function (widgetNameToHide) {
                        $scope.widgets[widgetNameToHide].active = false;
                    });
                }
            }
        }
    }
}
