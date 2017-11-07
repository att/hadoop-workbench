import {getCuidById} from '../../../reducers/tenants';
import {getOozieTemplateCuidById} from '../../../reducers/oozieTemplates';
import {FILE_WORKFLOW_XML, FILE_CONFIG_DEFAULT_XML, FILE_COORDINATOR_CONFIG_XML} from '../../../../oozie/constants/file-names';

require('../ngModule').controller('tenant-workflow-template-widget.IndexController', IndexController);

IndexController.$inject = [
    "$scope",
    '$q',
    "dashboard-isolated-widget-accessor.WidgetStore",
    "dashboard.models.TabPage",
    "componentDescriptor",
    "file-browser.file-helper",
    "oozie.restService",
    "tenant.restService",
    "restGetRawFileFunction",
    "main.alerts.alertsManagerService",
    "dashboard.WidgetsActions",
    "fileManager",
    'core.lockProvider',
    'dashboard-isolated-widget-accessor.WidgetActions',
    // @TODO: @cleanup: remove widgetUiControl commented code
    // 'core.widgetUiControl',
    // 'shared.pages.configPropertiesEditor.widgetUiActions',
    'shared.jsonSchemaBuilder',
    '$ngRedux',
    'tenant.redux-actions',
    'tenant.OozieComponentSaver'
];
// @TODO: @cleanup: remove widgetUiControl commented code
function IndexController($scope, $q, WidgetStore, TabPage, componentDescriptor, fileHelper, oozieRestService, tenantRestService, restGetRawFileFunction, alertsManagerService, WidgetsActions, fileManager, lockProvider, WidgetAccessorActions, /*widgetUiControl, configPropertiesEditorWidgetUiActions, */jsonSchemaBuilder, $ngRedux, tenantActions, ComponentSaver) {
    let {dispatch} = $ngRedux;
    let $dashboardWidget = WidgetStore.getWidget();
    let lock = lockProvider.getInstance();
    let infoViewerPage, tabIndexFileManager;

    let isTenantLoaded = false;
    let isTenantDeleted = false;

    let isTemplateLoaded = false;
    let isDeletingOozieTemplate = false;
    let isTemplateDeleted = false;
    let isTemplateLoadingError = false;

    let isTenantAndTemplateLoaded = false;
    let tenant = null;
    let tenantCuid = null;
    let component = null;

    angular.extend($scope, {
        $dashboardWidget: $dashboardWidget,
        showPreloader: true,
        downloadUrl: "",
        templateCuid: null
    });

    var componentDescriptorInfoId = componentDescriptor.info.id;

    var waitingExport = false,
        defaultConfigFileLocation = "/" + FILE_CONFIG_DEFAULT_XML,
        defaultCoordinatorConfigFileLocation = "/" + FILE_COORDINATOR_CONFIG_XML;
    let tenantId = componentDescriptor.info.tenantId;

    init();

    function init() {
        if (!tenantId) {
            console.log('Tenant ID should be provided');
            return;
        }
        dispatch(tenantActions.getTenant(tenantId));
        dispatch(tenantActions.getTemplateOozie(componentDescriptorInfoId));

        tenantCuid = getCuidById(tenantId);
        $scope.templateCuid = getOozieTemplateCuidById(componentDescriptorInfoId);

        bindStateToScope();

        setupPluginActions();

        setupWatchers();

        setupExternalEventsSubsribers();
    }

    function bindStateToScope() {
        var unsubscribe = $ngRedux.connect(onStateChange)($scope);
        $scope.$on('$destroy', unsubscribe);
    }

    let lastError;

    function onStateChange(state) {
        var result = {};
        var currentComponent = retrieveOozieTemplate(state, $scope.templateCuid);
        var currentTenant = retrieveTenant(state, tenantCuid);

        if (currentTenant === undefined) {
            if (isTenantLoaded) {
                isTenantDeleted = true;
            }
        } else {
            if (!isTenantLoaded && !currentTenant.$meta.busy && !currentTenant.$meta.error ) {
                tenant = currentTenant;
                isTenantLoaded = true;
            }
        }

        if (currentComponent === undefined) {
            if (isTemplateLoaded && !isTemplateDeleted) {
                isTemplateDeleted = true;
                if (isDeletingOozieTemplate) {
                    WidgetsActions.removeWidget($dashboardWidget, true);
                } else {
                    showAlertWarningComponentDeleted();
                }
                $scope.showPreloader = false;
            }
        } else {
            let meta = currentComponent.$meta;
            if (meta.busy === true) {
                // none
            } else if (meta.error && (lastError !== meta.error)) {
                lastError = meta.error;
                isTemplateLoadingError = true;
                if (meta.isGetting) {
                    $scope.errorMessage = lastError;
                }
                WidgetAccessorActions.onWidgetLoadError(lastError);
                $scope.showPreloader = false;
            } else {
                if (!isTemplateLoaded && !isTemplateLoadingError) {
                    isTemplateLoaded = true;
                    component = currentComponent;
                    let files;

                    if (component.isFilesWrapped) {
                        files = [];
                    } else {
                        files = component.files;
                    }

                    fileManager.init(files);
                    // first time load
                    $dashboardWidget.title = component.name;
                    $dashboardWidget.secondaryTitle = component.version;
                }
            }

        }

        if (isTenantLoaded && isTemplateLoaded) {
            if (!isTenantAndTemplateLoaded) {
                isTenantAndTemplateLoaded = true;
                setupTabPages();

                //init in progress
                openWorkflowXmlFile();

                setupStatusBarTabs(component);
                $scope.showPreloader = false;
            }
        }

        return result;
    }

    angular.extend($scope, {
        onExportSuccess: function () {
            waitingExport = false;
            WidgetAccessorActions.updateWidgetProgressBarMessage("");
            alertsManagerService.addAlertSuccess({
                title: 'Success',
                text: 'Oozie component has been successfully exported'
            });
        },
        onExportError: function (error) {
            waitingExport = false;
            WidgetAccessorActions.updateWidgetProgressBarMessage("");
            alertsManagerService.addAlertError({
                title: 'Error',
                text: 'Oozie component has not been exported because of the error: ' + error.message
            });
        },
        close: function () {
            WidgetsActions.removeWidget($dashboardWidget);
        }
    });

    function showAlertWarningComponentDeleted() {
        alertsManagerService.addAlertWarning({
            title: 'Component was deleted',
            text: 'Component "' + componentDescriptor.info.name || componentDescriptor.info.id + '" was deleted.'
        });
    }

    function setupTabPages() {

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
                team: {
                    type: 'string',
                    readonly: false,
                    title: 'Team'
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
                id: {
                    type: 'string',
                    readonly: true,
                    title: 'Id'
                },
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
        infoViewerPage = TabPage.factory({
            name: "info-viewer",
            params: {
                sections: [
                    componentInfoJsonSchema,
                    tenantInfoJsonSchema
                ],
                editSections: [componentInfoJsonSchema],
                data: [component, tenant.info],
                onUpdate: function (sectionsToUpdate) {
                    $scope.showPreloader = true;
                    var json = sectionsToUpdate[0].toJSON();
                    oozieRestService.updateTenantComponent(component.id, json)
                        .then(function () {
                            component = angular.extend(component, json);
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

        tabIndexFileManager = $dashboardWidget.leftTabManager.addTab(TabPage.factory({
            name: "file-browser",
            params: {
                fileManager: fileManager
            }
        }), '', 'File Manager', 'b-oozie-plugin__flowchart-widget__files-icon', true);

        $dashboardWidget.leftTabManager.setActive(-1);

    }

    function setupPluginActions() {

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
                var saverNonRoot = new ComponentSaver(componentDescriptor.info.id);
                saverNonRoot.registerBeforeSaveInterceptor(() => $scope.showPreloader = true);
                saverNonRoot.registerAfterSaveInterceptor(function (fulfilled) {
                    $scope.showPreloader = false;
                    fileManager.updateFiles();
                    if (fulfilled) {
                        // none
                    } else {
                        alertsManagerService.addAlertError({
                            title: "Component deployment",
                            text: "Can't deploy component if it's not properly saved"
                        })
                    }
                });
                $scope.$broadcast('tenant-workflow-template.save-component', saver);
                $scope.$broadcast('tenant-workflow-template.save-component.non-root', saverNonRoot);
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
                        if (isTemplateDeleted) {
                            showAlertWarningComponentDeleted();
                        } else if (isTemplateLoaded) {
                            $scope.showPreloader = true;
                            isDeletingOozieTemplate = true;
                            dispatch(tenantActions.deleteOozieTemplate(component));
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
                    waitingExport = true;
                    WidgetAccessorActions.updateWidgetProgressBarMessage("Exporting component...");
                    $scope.downloadUrl = oozieRestService.getTenantWorkflowDownloadPath(componentDescriptor.info.id, FILE_WORKFLOW_XML);
                }
                closeActionMenu(true);
            }
        });

    }

    function setupWatchers() {

        $scope.$on('save-file', function (event, file) {
            event.stopPropagation();
            $scope.showPreloader = true;
            oozieRestService.saveTenantFile('v1.0', componentDescriptor.info.id, file)
                .then(function () {
                    $scope.$broadcast('save-file-success', file);
                    alertsManagerService.addAlertSuccess({
                        title: 'Success',
                        text: 'File "' + file.path + '" has been successfully saved.'
                    });
                }, function (error) {
                    var errorMessage = angular.isString(error) ? error : error && angular.isString(error.message) ? error.message : 'Unknown error';
                    alertsManagerService.addAlertError({
                        title: 'Error',
                        text: 'File "' + file.path + '" has not been saved because of error: ' + errorMessage
                    });
                })
                .finally(function () {
                    $scope.showPreloader = false;
                });
        });

        $scope.$on('save.config', function (event, data) {
            let configFile = findConfigDefaultFile();
            saveConfig(event, configFile.path, data.config);
        });

        $scope.$on('hide.left-tab-panel', function (event) {
            event.stopPropagation();
            $dashboardWidget.leftTabManager.setActive(-1);
        });

        $scope.$on('open-file.file-browser', function (event, file) {
            event.stopPropagation();
            openNewTabOrHighlightExistedOne(file);
        });

        $scope.$on('open-file.oozie-workflow', function (event, file, nodeSubtype) {
            event.stopPropagation();
            openNewTabOrHighlightExistedOne(file, false, false, nodeSubtype);
        });

    }

    function setupExternalEventsSubsribers() {
        fileManager.on('file-manager-file-deleted', function (event, file) {
            var allTabs = $dashboardWidget.tabManager.getTabs();
            var existedTab = allTabs.filter(function (tab) {
                return tab.page.params.file && tab.page.params.file.path === file.path;
            })[0];

            if (existedTab) {
                $dashboardWidget.tabManager.removeTab(allTabs.indexOf(existedTab));
            }
        });

/*
 // @TODO: @cleanup: remove widgetUiControl commented code
        widgetUiControl.on(configPropertiesEditorWidgetUiActions.OPEN_CONFIG_DEFAULT_TEXT, function (event, params) {
            openConfigDefaultXmlFileAsText();
        });
*/
    }

    function openNewTabOrHighlightExistedOne(file, doNotSetFocus, openAsText, nodeSubtype) {
        var fileOpenedFromSubworkflowNodeProperties = file.type === "file" && nodeSubtype === "sub-workflow";

        var isWorkflowFile = fileOpenedFromSubworkflowNodeProperties || fileHelper.normalizePath(file.path) === FILE_WORKFLOW_XML;

        var allTabs = $dashboardWidget.tabManager.getTabs();
        var existedTab = allTabs.filter(function (tab) {
            return tab.page.params.file && tab.page.params.file.path === file.path;
        })[0];

        if (existedTab && !doNotSetFocus) {
            if (isWorkflowFile) {
                var replaceWithWorkflowPage = existedTab.page.name === "file-text-viewer" && fileOpenedFromSubworkflowNodeProperties;
                if (replaceWithWorkflowPage) {
                    $dashboardWidget.tabManager.removeTab(allTabs.indexOf(existedTab)).then(addWorkflowPage);
                    return;
                }
            }
            $dashboardWidget.tabManager.setActive(allTabs.indexOf(existedTab));
            return;
        }

        if (lock.isExists(file.path)) {
            return;
        }

        if (isWorkflowFile) {
            addWorkflowPage();
        } else {
            let isConfigDefault = isFilePathIsConfigDefaultXml(file.path);
            let isCoordinatorConfigDefault = isFilePathIsCoordinatorConfigDefaultXml(file.path);
            if (isConfigDefault || isCoordinatorConfigDefault) {
                var tabName = 'Global Properties';
                lock.add(file.path);
                if (openAsText) {
                    openFileAsTextLocked(file, false, tabName);
                } else {
                    oozieRestService.getTenantFileAsConfig('v1.0', componentDescriptor.info.id, file.path).then(function (data) {
                        let title = isCoordinatorConfigDefault ? 'Coordinator Config': 'Workflow Config';
                        var editorPage = TabPage.factory({
                            name: 'config-page',
                            params: {
                                title: title,
                                readonly: false,
                                configItems: data.content.config,
                                file: {
                                    path: file.path,
                                    text: data.text
                                },
                                noDescriptionOnCreate: false,
                                noDescriptionOnView: true
                            }
                        });
                        var index = $dashboardWidget.tabManager.addTab(editorPage, tabName);
                        if (!doNotSetFocus) {
                            $dashboardWidget.tabManager.setActive(index);
                        }
                        lock.remove(file.path);
                    }, function () {
                        openFileAsTextLocked(file, false, tabName);
                    });
                }
            } else {
                lock.add(file.path);
                openFileAsText(file, doNotSetFocus).then(function () {
                    lock.remove(file.path);
                }, function () {
                    lock.remove(file.path);
                });
            }
        }

        function addWorkflowPage() {
            let title, tooltip;

            let lastOccurrence = file.path.lastIndexOf("/");
            title = file.path.substr(lastOccurrence + 1);
            tooltip = file.path;

            let componentSaver = new ComponentSaver(componentDescriptor.info.id);
            componentSaver.registerBeforeSaveInterceptor(() => $scope.showPreloader = true);
            componentSaver.registerAfterSaveInterceptor(() => {
                $scope.showPreloader = false;
                fileManager.updateFiles();
            });
            var page = TabPage.factory({
                name: "oozie-workflow-page",
                params: {
                    isTenantComponent: true,
                    isFileOpenedFromSubworkflowNodeProperties: fileOpenedFromSubworkflowNodeProperties,
                    componentId: componentDescriptor.info.id,
                    file: file,
                    files: component.files,
                    fileManager: fileManager,
                    restGetRawFileFunction: restGetRawFileFunction,
                    componentSaver: componentSaver,
                    ideTabTitleChangerCallback: ideTabTitleChangerCallback
                }
            });

            var tabIndex = $dashboardWidget.tabManager.addTab(page, title, tooltip, '');
            if (!doNotSetFocus) {
                $dashboardWidget.tabManager.setActive(tabIndex);
            }
            function ideTabTitleChangerCallback(newTitle) {
                var workflowTabIndex = $dashboardWidget.tabManager.getIndexByPage(page);
                var workflowTab = $dashboardWidget.tabManager.getTab(workflowTabIndex);
                workflowTab.label = newTitle;
            }
        }

        function openFileAsTextLocked(file, doNotSetFocus, tabName) {
            lock.add(file.path);
            openFileAsText(file, doNotSetFocus, tabName).then(function () {
                lock.remove(file.path);
            }, function () {
                lock.remove(file.path);
            });
        }
    }

    function openFileAsText(file, doNotSetFocus, tabName) {
        if (tabName === undefined) {
            let lastOccurrence = file.path.lastIndexOf("/");
            if (lastOccurrence !== -1) {
                tabName = file.path.substr(lastOccurrence + 1);
            } else {
                tabName = file.path;
            }
        }

        var defer = $q.defer();
        var tabIndex = $dashboardWidget.tabManager.addTab(TabPage.factory({
            name: "file-text-viewer",
            params: {
                getFile: () => restGetRawFileFunction(file).finally(defer.resolve),
                file: {
                    path: file.path
                }
            }
        }), tabName, file.path);
        if (!doNotSetFocus) {
            $dashboardWidget.tabManager.setActive(tabIndex);
        }
        return defer.promise;
    }

    function openWorkflowXmlFile() {
        var file = findWorkflowFile(component);
        if (file) {
            let lastOccurrence = file.path.lastIndexOf("/");
            if (lastOccurrence !== -1) {
                file.path = file.path.substr(lastOccurrence + 1);
            }
            openNewTabOrHighlightExistedOne(file);
        }
    }

/*
 // @TODO: @cleanup: remove widgetUiControl commented code
    function openConfigDefaultXmlFileAsText() {
        var file = findConfigDefaultFile();
        if (file) {
            openNewTabOrHighlightExistedOne(file, false, true);
        }
    }
*/

    function findWorkflowFile(component) {
        return component.files.filter(function (f) {
            return f.path.includes(FILE_WORKFLOW_XML);
        })[0];
    }

    function findConfigDefaultFile() {
        return component.files.filter(function (f) {
            return fileHelper.normalizePath(f.path) === fileHelper.normalizePath(FILE_CONFIG_DEFAULT_XML);
        })[0];
    }

    function findCoordinatorConfigDefaultFile() {
        return component.files.filter(function (f) {
            return fileHelper.normalizePath(f.path) === fileHelper.normalizePath('/' + FILE_COORDINATOR_CONFIG_XML);
        })[0];
    }

    function isFilePathIsConfigDefaultXml(filePath) {
        return fileHelper.normalizePath(filePath) === fileHelper.normalizePath('/' + FILE_CONFIG_DEFAULT_XML);
    }

    function isFilePathIsCoordinatorConfigDefaultXml(filePath) {
        return fileHelper.normalizePath(filePath) === fileHelper.normalizePath('/' + FILE_COORDINATOR_CONFIG_XML);
    }

    function uploadFile(path, file) {
        var defer = $q.defer();
        var existedFile = fileHelper.findFile(path, component.files);
        if (existedFile) {
            alertsManagerService.addAlertWarning({
                title: 'Warning',
                text: 'A file with such name is already uploaded. Do you want to replace it?',
                buttons: [
                    {
                        text: "Yes",
                        style: "action",
                        action: function (close) {
                            close();
                            upload();
                        }
                    },
                    {
                        text: "No",
                        style: "cancel",
                        action: function (close) {
                            close();
                            file.remove();
                            defer.resolve();
                        }
                    }
                ]
            });
        } else {
            upload();
        }

        function upload() {
            file.url = oozieRestService.getTenantUploadFileUrl('v1.0', componentDescriptor.info.id, path);
            file.onSuccess = function (response) {
                alertsManagerService.addAlertSuccess({
                    title: 'Success',
                    text: 'File "' + path + '" has been successfully uploaded.'
                });
                var newFile = response.data;
                if (!$scope.$$phase && newFile) {
                    $scope.$apply(function () {
                        fileHelper.removeFile(newFile.path, component.files);
                        component.files.push(newFile);
                        defer.resolve(newFile);
                    });
                }
            };
            file.onError = function (response, status, headers) {
                alertsManagerService.addAlertError({
                    title: 'Error',
                    text: 'File "' + path + '" has not been uploaded because of error: ' + response
                });
                defer.reject(response);
            };
            file.upload();
        }

        return defer.promise;
    }

    function setupStatusBarTabs(component) {
        var statusBarTabs = [];
        statusBarTabs.push({
            label: 'Component',
            value: component.name +
            ( component.version != '' ? ': ' + component.version : '')
        });
        statusBarTabs.push({
            label: 'Tenant',
            value: tenant.info.name +
            ( tenant.version != '' ? ':' + tenant.version : '')
        });

        WidgetAccessorActions.updateWidgetStatusBarTabs(statusBarTabs);
    }

    function onComponentUpdated(component) {
        $dashboardWidget.title = component.name;
        $dashboardWidget.secondaryTitle = component.version;
        infoViewerPage.params.data = [component, tenant];
        setupStatusBarTabs(component);
    }

    function saveConfig(event, configFile, configData) {
        event.stopPropagation();
        $scope.showPreloader = true;
        oozieRestService.saveTenantFileAsConfig('v1.0', componentDescriptor.info.id, configFile, configData)
            .then(function () {
                alertsManagerService.addAlertSuccess({
                    title: 'Config default save success',
                    text: 'Config "' + configFile + '" has not been successfully saved'
                });
            })
            .catch(function (error) {
                var errorMessage = angular.isString(error) ? error : error && angular.isString(error.message) ? error.message : 'Unknown error';
                alertsManagerService.addAlertError({
                    title: 'Error',
                    text: 'Config "' + configFile + '" has not bee saved because of error: ' + errorMessage
                });
            })
            .finally(function () {
                $scope.showPreloader = false;
            });

    }

    function retrieveOozieTemplate(state, cuid) {
        return state.data.tenant.oozieTemplates[cuid];
    }

    function retrieveTenant(state, cuid) {
        return state.data.tenant.tenants[cuid];
    }
}
