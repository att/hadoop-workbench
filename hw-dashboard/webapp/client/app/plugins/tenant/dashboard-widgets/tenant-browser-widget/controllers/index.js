import {getCuidById} from '../../../reducers/tenants';
import { ERROR_TYPE_TENANT_NOT_EMPTY } from '../../../constants/error-types';

require('../ngModule').controller('tenant-browser-widget.IndexController', IndexController);

IndexController.$inject = [
    '$scope',
    'dashboard-isolated-widget-accessor.WidgetStore',
    'dashboard.models.TabPage',
    "dashboard.WidgetsActions",
    "$widgetParams",
    "tenant.restService",
    "main.alerts.alertsManagerService",
    "$q",
    '$ngRedux',
    'tenant.redux-actions'
];
function IndexController($scope, WidgetStore, TabPage, WidgetsActions, $widgetParams, restService, alertsManager, $q, $ngRedux, tenantActions) {
    let {dispatch} = $ngRedux;
    let browserPage;
    var $dashboardWidget = WidgetStore.getWidget();

    let tenantId = $widgetParams.tenantId;

    angular.extend($scope, {
        $dashboardWidget: $dashboardWidget,
        showPreloader: false,
        tenant: null,
        templates: [],
        tenantCuid: null,
        isDeletingTenant: false
    });

    init();

    function init() {
        if (!tenantId) {
            alert('Tenant ID should be provided');
            return;
        }
        dispatch(tenantActions.getTenant(tenantId));
        dispatch(tenantActions.getTemplates(tenantId));

        $scope.tenantCuid = getCuidById(tenantId);

        bindStateToScope();
        setupTabPages();
        setupPluginActions();


        setupWatchers();
    }

    function setupTabPages() {
        let removeTemplateAlert;
        browserPage = TabPage.factory({
            name: 'tenant-page',
            params: {
                tenant: $scope.tenant,
                templates: $scope.templates.concat([]),
                actions: {
                    onUpdateTenant(component){
                        component.info.$cuid = getCuidById(tenantId);
                        angular.extend(component.info, component.properties.getPropertyInfo());
                        dispatch(tenantActions.updateTenant(component.info));
                    },
                    onRemoveTemplate(template){
                        if (removeTemplateAlert) {
                            alertsManager.closeAlert(removeTemplateAlert);
                        }
                        // confirm deletion
                        removeTemplateAlert = alertsManager.addAlertInfo({
                            type: "warning",
                            title: template.info.name,
                            text: "Do you really want to delete the component?",
                            buttons: [
                                {
                                    text: "Yes",
                                    style: "action",
                                    action: close => {
                                        close();
                                        dispatch(tenantActions.deleteTemplate(template));
                                    }
                                },
                                {
                                    text: "No",
                                    style: "cancel",
                                    action: function (close) {
                                        close();
                                    }
                                }
                            ]
                        });
                    },
                    onUpdateTemplate(component){
                        angular.extend(component.info, component.properties.getPropertyInfo());
                        dispatch(tenantActions.updateTenantComponent(component));
                    }
                }
            }
        });
        $dashboardWidget.tabManager.setActive($dashboardWidget.tabManager.addTab(browserPage, '', '', '', true));
    }

    function setupPluginActions() {
        $dashboardWidget.addPluginAction({
            name: "Create component",
            handler: function (closeActionMenu) {
                WidgetsActions.addWidget({
                    widgetName: 'create-tenant-component',
                    params: {
                        sharedData: {
                            container: angular.copy($scope.tenant)
                        }
                    }
                }, {before: $dashboardWidget});
                closeActionMenu(true);
            }
        });

        let removeTenantConfirm;
        $dashboardWidget.addPluginAction({
            name: "Delete tenant",
            handler: function (close) {
                close();

                if (removeTenantConfirm) {
                    alertsManager.closeAlert(removeTenantConfirm);
                }

                removeTenantConfirm = alertsManager.addAlerts([
                    {
                        type: "confirm",
                        title: $scope.tenant.info.name ? $scope.tenant.info.name : $scope.tenant.id,
                        text: 'Do you really want to delete the tenant "' + ($scope.tenant.info.name ? $scope.tenant.info.name : $scope.tenant.id) + '" ?',
                        buttons: [
                            {
                                text: "Yes",
                                style: "action",
                                action: close => {
                                    close();
                                    $scope.isDeletingTenant = true;
                                    dispatch(tenantActions.deleteTenant($scope.tenant));
                                }
                            },
                            {
                                text: "No",
                                style: "cancel",
                                action: close => close()
                            }
                        ]
                    }
                ]);

            }
        });

    }

    function setupWatchers() {
        $scope.$watch('tenant', tenant => {
            if (tenant) {
                browserPage.params = Object.assign({}, browserPage.params, {tenant: tenant});

                $scope.showPreloader = tenant.$meta.busy;
                $scope.templates = retrieveTemplates($ngRedux.getState(), (tenant.info && tenant.info.id) || tenant.id);

                $dashboardWidget.title = (tenant.info && tenant.info.name) || tenant.name;
                $dashboardWidget.secondaryTitle = (tenant.info && tenant.info.version) || tenant.version;
            } else if ($scope.isDeletingTenant) {
                var l;
                WidgetsActions.removeWidget($dashboardWidget, true);
            }

        });

        $scope.$watch('templates', templates => {
            browserPage.params = Object.assign({}, browserPage.params, {templates: templates.concat([])});
        });

        $scope.$on('open-component.tenant-browser', function (event, template) {
            event.stopPropagation();
            var widgetName = template.info.type;
            WidgetsActions.addWidget({
                widgetName: widgetName === "flume" ? "tenant-flume-template" : "tenant-workflow-template",
                params: {
                    componentDescriptor: template
                }
            }, {before: $dashboardWidget});
        });

        $scope.$on("deploy-component.tenant-browser", function (event, template) {
            event.stopPropagation();
            WidgetsActions.addWidget({
                widgetName: "tenant-component-deployment",
                params: {
                    componentDescriptor: template
                }
            }, {before: $dashboardWidget});
        });
    }

    function bindStateToScope() {
        let unsubscribe = $ngRedux.connect(onStateChange)($scope);
        $scope.$on('$destroy', unsubscribe);
    }


    let lastTemplates,
        lastTenants,
        lastError;

    function onStateChange(state) {

        let allTemplates = state.data.tenant.templates;
        let allTenants = state.data.tenant.tenants;
        let result = {};
        if (lastTenants !== allTenants) {
            lastTenants = allTenants;
            result.tenant = retrieveTenant(state, $scope.tenantCuid);

            if (result.tenant !== undefined) {
                var meta = result.tenant.$meta;
                if (meta.error !== null && lastError !== meta.error) {
                    lastError = meta.error;
                    if (meta.isDeleting) {
                        if (meta.errorType != ERROR_TYPE_TENANT_NOT_EMPTY) {
                            alertsManager.addAlertError({
                                title: 'Tenant delete error',
                                text: result.tenant.$meta.error
                            });
                        }
                        if (meta.errorType == ERROR_TYPE_TENANT_NOT_EMPTY) {
                            let tenantName = result.tenant.name ? result.tenant.name : result.tenant.id;

                            alertsManager.addAlerts([
                                {
                                    type: "warning",
                                    title: "Tenant delete confirmation",
                                    text: "Tenant is not empty!<br>" +
                                        "Do you really want to delete the tenant '" + tenantName + "' with all its content?<br>" +
                                        "All components will be lost.",
                                    buttons: [
                                        {
                                            text: "Yes",
                                            style: "action",
                                            action: close => {
                                                close();
                                                dispatch(tenantActions.deleteTenantForce(result.tenant));
                                            }
                                        },
                                        {
                                            text: "No",
                                            style: "cancel",
                                            action: function (close) {
                                                close();
                                            }
                                        }
                                    ]
                                }
                            ]);
                        }
                    }
                }
            }
        }

        if (lastTemplates !== allTemplates) {
            lastTemplates = allTemplates;
            result.templates = retrieveTemplates(state, tenantId);
        }
        return result;
    }

    function retrieveTemplates(state, tenantId) {
        let allTemplates = state.data.tenant.templates;
        return Object.keys(allTemplates)
            .filter(cuid => allTemplates[cuid].info.tenantId === tenantId)
            .map(cuid => allTemplates[cuid])
    }

    function retrieveTenant(state, cuid) {
        return state.data.tenant.tenants[cuid];
    }
}
