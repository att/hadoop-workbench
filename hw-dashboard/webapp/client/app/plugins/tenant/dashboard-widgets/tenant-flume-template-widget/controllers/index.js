/*jshint maxparams:11*/
define(function (require) {
        "use strict";

        var ng = require('angular');
        require('../ngModule').controller('tenant-flume-template-widget.IndexController', controller);

        var angular = require("angular");

        controller.$inject = [
            "$scope",
            '$q',
            "dashboard-isolated-widget-accessor.WidgetStore",
            "dashboard.models.TabPage",
            "component",
            "componentDescriptor",
            "file-browser.file-helper",
            "flume.restService",
            "tenant.restService",
            "main.alerts.alertsManagerService",
            "dashboard.WidgetsActions",
            "fileManager",
            'core.lockProvider',
            'tenant',
            'dashboard-isolated-widget-accessor.WidgetActions',
            'shared.jsonSchemaBuilder',
            '$ngRedux',
            'tenant.redux-actions',
            'tenant.FlumeComponentSaver'
        ];

        function controller($scope, $q, WidgetStore, TabPage, component, componentDescriptor, fileHelper, flumeRestService, tenantRestService, alertsManagerService, WidgetsActions, fileManager, lockProvider, tenant, WidgetAccessorActions, jsonSchemaBuilder, $ngRedux, tenantActions, ComponentSaver) {
            var $dashboardWidget = WidgetStore.getWidget();
            var lock = lockProvider.getInstance();
            var flumeTemplateId = component.component.id;
            var tenantId = component.component.tenantId;
            var flumeTemplate = null;

            $scope.$dashboardWidget = $dashboardWidget;
            $scope.showPreloader = false;
            $scope.downloadUrl = "";
            $dashboardWidget.title = component.component.name;
            $dashboardWidget.secondaryTitle = component.component.version;
            var waitingExport = false;

            ng.extend($scope, {
                onExportSuccess: function () {
                    waitingExport = false;
                    WidgetAccessorActions.updateWidgetProgressBarMessage("");
                    alertsManagerService.addAlertSuccess({
                        title: 'Success',
                        text: 'Flume component has been successfully exported'
                    });
                },
                onExportError: function (error) {
                    waitingExport = false;
                    WidgetAccessorActions.updateWidgetProgressBarMessage("");
                    alertsManagerService.addAlertError({
                        title: 'Error',
                        text: 'Flume component has not been exported because of the error: ' + error.message
                    });
                }
            });


            bindStateToScope();

            function bindStateToScope() {
                var unsubscribe = $ngRedux.connect(onStateChange)($scope);
                $scope.$on('$destroy', unsubscribe);
            }

            var lastTemplates;

            function onStateChange(state) {
                var result = {};
                var allTemplates = state.data.tenant.templates;

                if (lastTemplates != allTemplates) {
                    lastTemplates = allTemplates;
                    flumeTemplate = retrieveTemplateByComponentId(state, tenantId, flumeTemplateId);
                }
                return result;
            }

            var componentInfoJsonSchema = jsonSchemaBuilder.createSchema({
                title: 'Component',
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        readonly: false,
                        title: 'Name'
                    },
                    version: {
                        type: 'string',
                        readonly: false,
                        title: 'Version'
                    },
                    description: {
                        type: 'string',
                        readonly: false,
                        title: 'Description'
                    }
                }
            });
            var tenantInfoJsonSchema = jsonSchemaBuilder.createSchema({
                title: 'Tenant',
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        readonly: true,
                        title: 'Name'
                    },
                    version: {
                        type: 'string',
                        readonly: true,
                        title: 'Version'
                    },
                    description: {
                        type: 'string',
                        readonly: true,
                        title: 'Description'
                    }
                }
            });

            var infoViewerPage = TabPage.factory({
                name: "info-viewer",
                params: {
                    sections: [
                        componentInfoJsonSchema,
                        tenantInfoJsonSchema
                    ],
                    editSections: [componentInfoJsonSchema],
                    data: [component.component, tenant],
                    onUpdate: function (sectionsToUpdate) {
                        $scope.showPreloader = true;
                        var json = sectionsToUpdate[0].toJSON();
                        flumeRestService.updateTenantComponent(component.component.id, json)
                            .then(function () {
                                component.component = ng.extend(component.component, json);
                                onComponentUpdated(component);
                                alertsManagerService.addAlertSuccess({
                                    title: 'Success',
                                    text: 'Template "' + json.name + '" has been successfully updated.'
                                });
                                infoViewerPage.params.savedAt = new Date();
                            }, function (error) {
                                alertsManagerService.addAlertError({
                                    title: 'Error',
                                    text: 'Template "' + json.name + '" has not been updated because of error: ' + error.message
                                });
                            })
                            .finally(function () {
                                $scope.showPreloader = false;
                            });
                    }

                }
            });
            $dashboardWidget.leftTabManager.addTab(infoViewerPage, '', 'Info', 'b-oozie-plugin__flowchart-widget__info-icon', true);

            $dashboardWidget.leftTabManager.addTab(TabPage.factory({
                name: "file-browser",
                params: {
                    fileManager: fileManager
                }
            }), '', 'File Manager', 'b-oozie-plugin__flowchart-widget__files-icon', true);

            fileManager.on('file-manager-file-deleted', function (event, file) {
                var allTabs = $dashboardWidget.tabManager.getTabs();
                var existedTab = allTabs.filter(function (tab) {
                    return tab.page.params.file && tab.page.params.file.path === file.path;
                })[0];

                if (existedTab) {
                    $dashboardWidget.tabManager.removeTab(allTabs.indexOf(existedTab));
                }
            });

            $dashboardWidget.leftTabManager.setActive(-1);

            $dashboardWidget.addPluginAction({
                name: "Deploy component",
                handler: function (closeActionMenu) {
                    closeActionMenu(true);
                    var saver = new ComponentSaver(componentDescriptor.info.id);
                    saver.registerBeforeSaveInterceptor(() => $scope.showPreloader = true);
                    saver.registerAfterSaveInterceptor(function (fulfilled) {
                        $scope.showPreloader = false;
                        fileManager.updateFiles();
                        if (fulfilled) {
                            WidgetsActions.addWidget({
                                widgetName: "tenant-component-deployment",
                                params: {
                                    componentDescriptor: componentDescriptor
                                }
                            }, {before: $dashboardWidget});
                        } else {
                            alertsManagerService.addAlertError({
                                title: "Component deployment",
                                text: "Can't deploy component if it's not properly saved"
                            })
                        }
                    });
                    $scope.$broadcast('tenant-flume-template.save-component', saver);
                }
            });

            $dashboardWidget.addPluginAction({
                name: "Delete component",
                handler: function (closeActionMenu) {
                    closeActionMenu(true);
                    confirmAndDeleteComponent();

                    function confirmAndDeleteComponent() {
                        var d = $q.defer();

                        // confirm deletion
                        alertsManagerService.addAlerts([
                            {
                                type: "confirm",
                                title: $dashboardWidget.title,
                                text: "Do you really want to delete the component?",
                                buttons: [
                                    {
                                        text: "Yes",
                                        style: "action",
                                        action: deleteComponent
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

                        function deleteComponent(close) {
                            close();
                            if (flumeTemplate) {
                                $scope.showPreloader = true;
                                $ngRedux.dispatch(tenantActions.deleteTemplate(
                                    flumeTemplate,
                                    true,
                                    function successCallback() {
                                        WidgetsActions.removeWidget($dashboardWidget, true);
                                    },
                                    function failureCalback() {
                                    },
                                    function finallyCallback() {
                                        $scope.showPreloader = false;
                                    }
                                ));
                            }
                        }

                        return d.promise;
                    }
                }
            });

            $dashboardWidget.addPluginAction({
                name: "Export component",
                handler: function (closeActionMenu) {
                    if (waitingExport) {
                        alertsManagerService.addAlertWarning({
                            title: 'Export in progress',
                            text: 'Cannot perform operation: waiting for previous export to complete'
                        });
                    } else {
                        var file = component.files.filter(function (file) {
                            return fileHelper.normalizePath(file.path).indexOf('conf/flume.properties') !== -1;
                        })[0];
                        if (file) {
                            waitingExport = true;
                            WidgetAccessorActions.updateWidgetProgressBarMessage("Exporting component...");
                            $scope.downloadUrl = flumeRestService.getTenantPipelineDownloadPath(componentDescriptor.info.id, file.path);
                        }
                    }
                    closeActionMenu(true);
                }
            });

            openPipelineFile();

            setupStatusBarTabs();

            $scope.$on('hide.left-tab-panel', function (event) {
                event.stopPropagation();
                $dashboardWidget.leftTabManager.setActive(-1);
            });

            $scope.$on('open-file.file-browser', function (event, file) {
                event.stopPropagation();
                openNewTabOrHighlightExistedOne(file);
            });

            $scope.$on('save-file', function (event, file) {
                event.stopPropagation();
                $scope.showPreloader = true;
                flumeRestService.saveTenantFile('v1.0', componentDescriptor.info.id, file)
                    .then(function () {
                        $scope.$broadcast('save-file-success', file);
                        alertsManagerService.addAlertSuccess({
                            title: 'Success',
                            text: 'File "' + file.path + '" has been successfully saved.'
                        });
                    }, function (error) {
                        var errorMessage = ng.isString(error) ? error : error && ng.isString(error.message) ? error.message : 'Unknown error';
                        alertsManagerService.addAlertError({
                            title: 'Error',
                            text: 'File "' + file.path + '" has not been saved because of error: ' + errorMessage
                        });
                    })
                    .finally(function () {
                        $scope.showPreloader = false;
                    });
            });

            function openNewTabOrHighlightExistedOne(file) {
                var allTabs = $dashboardWidget.tabManager.getTabs();
                var existedTab = allTabs.filter(function (tab) {
                    return tab.page.params.file && tab.page.params.file.path === file.path;
                })[0];

                if (existedTab) {
                    $dashboardWidget.tabManager.setActive(allTabs.indexOf(existedTab));
                    return;
                }

                if (lock.isExists(file.path)) {
                    return;
                }

                if (fileHelper.normalizePath(file.path).indexOf('conf/flume.properties') !== -1) {
                    let componentSaver = new ComponentSaver(componentDescriptor.info.id);
                    componentSaver.registerBeforeSaveInterceptor(() => $scope.showPreloader = true);
                    componentSaver.registerAfterSaveInterceptor(() => {
                        fileManager.updateFiles();
                        $scope.showPreloader = false;
                    });
                    var tabIndex = $dashboardWidget.tabManager.addTab(TabPage.factory({
                        name: "flume-pipeline-page",
                        params: {
                            isTenantComponent: true,
                            componentId: componentDescriptor.info.id,
                            file: file,
                            fileManager: fileManager,
                            agentName: component.agentName,
                            source: {},
                            componentSaver: componentSaver
                        }
                    }), 'Pipeline', '', '', true);
                    $dashboardWidget.tabManager.setActive(tabIndex);
                } else {
                    lock.add(file.path);
                    openFileAsText(file).then(function () {
                        lock.remove(file.path);
                    }, function () {
                        lock.remove(file.path);
                    });
                }
            }

            function openFileAsText(file) {
                let tabName;
                let lastOccurrence = file.path.lastIndexOf("/");
                if (lastOccurrence !== -1) {
                    tabName = file.path.substr(lastOccurrence + 1);
                } else {
                    tabName = file.path;
                }
                return flumeRestService.getTenantFile('v1.0', componentDescriptor.info.id, file.path).then(function (fileData) {
                    var data = ng.extend({}, file, fileData);
                    var tabIndex = $dashboardWidget.tabManager.addTab(TabPage.factory({
                        name: "file-text-viewer",
                        params: {
                            file: data
                        }
                    }), tabName, file.path);
                    $dashboardWidget.tabManager.setActive(tabIndex);
                });
            }

            function openPipelineFile() {
                component.files.forEach(function (file) {
                    if (fileHelper.normalizePath(file.path).indexOf('conf/flume.properties') !== -1) {
                        openNewTabOrHighlightExistedOne(file);
                    }
                });
            }

            function setupStatusBarTabs() {
                var statusBarTabs = [];
                statusBarTabs.push({
                    label: 'Component',
                    value: componentDescriptor.info.name +
                    ( componentDescriptor.info.version != '' ? ': ' + componentDescriptor.info.version : '')
                });
                statusBarTabs.push({
                    label: 'Tenant',
                    value: tenant.info.name +
                    ( tenant.version != '' ? ':' + tenant.version : '')
                });

                WidgetAccessorActions.updateWidgetStatusBarTabs(statusBarTabs);
            }

            function onComponentUpdated(component) {
                $dashboardWidget.title = component.component.name;
                $dashboardWidget.secondaryTitle = component.component.version;
                infoViewerPage.params.data = [component.component, tenant];
            }

            function retrieveTemplateByComponentId(state, tenantId, templateId) {
                let allTemplates = state.data.tenant.templates;
                let templateInArray = Object.keys(allTemplates)
                    .filter(cuid => (allTemplates[cuid].info.tenantId === tenantId && allTemplates[cuid].info.id === templateId));

                return templateInArray.length > 0 ? allTemplates[templateInArray[0]] : null;
            }

        }
    }
);
