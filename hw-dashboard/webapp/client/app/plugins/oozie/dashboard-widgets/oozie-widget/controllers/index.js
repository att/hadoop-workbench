/*jshint maxparams:14*/
import {getComponentCuidByIdObject} from '../../../reducers/oozieFlatTemplatesAndComponents';
import {TYPE_CDH} from '../../../../../plugins/platform/constants/platform-types';
import {FILE_WORKFLOW_XML, FILE_CONFIG_DEFAULT_XML, FILE_COORDINATOR_CONFIG_XML} from '../../../constants/file-names';
import {JOB_TYPE_WORKFLOW, JOB_TYPE_COORDINATOR} from '../../../constants/job-types';

let ng = angular;
require('../ngModule').controller('oozie-widget.IndexController', IndexController);

IndexController.$inject = [
    "$scope",
    "$widgetParams",
    "dashboard-isolated-widget-accessor.WidgetStore",
    "dashboard.models.TabPage",
    "oozie.restService",
    "restGetRawFileFunction",
    "platformMeta",
    "dashboard.widgets.DashboardWidget.TabManager.EVENTS",
    "dashboard.models.TabPage.EVENTS",
    "$q",
    'main.alerts.alertsManagerService',
    'file-browser.file-helper',
    "dashboard.WidgetsActions",
    "oozie.FileManager",
    'core.lockProvider',
    'dashboard-isolated-widget-accessor.WidgetActions',
    // @TODO: @cleanup: remove widgetUiControl commented code
    // 'core.widgetUiControl',
    // 'shared.pages.configPropertiesEditor.widgetUiActions',
    'shared.jsonSchemaBuilder',
    'oozie.JobPagesCoordinator',
    'oozie.ComponentSaver',
    '$ngRedux',
    'oozie.redux-actions'
];
function IndexController($scope, $widgetParams, WidgetStore, TabPage, restService, restGetRawFileFunction,
                         platformMeta, tabManagerEvents, tabPageEvents, $q, alertsManagerService, fileHelper,
                         WidgetsActions, FileManager, lockProvider,
                         WidgetAccessorActions, /*widgetUiControl, configPropertiesEditorWidgetUiActions,*/
                         // @TODO: @cleanup: remove widgetUiControl commented code
                         jsonSchemaBuilder, JobPagesCoordinator, ComponentSaver, $ngRedux, oozieReduxActions) {

    var source = $widgetParams.source;
    var workflow;
    var platformId = source.platform.id;
    var clusterId = source.cluster.id;
    var componentId = source.module.id;
    var idObject = {
        platformId: platformId,
        clusterId: clusterId,
        componentId: componentId
    };

    var componentInfoJsonSchema, platformInfoJsonSchema, tabIndexInfo, tabIndexFileManager, infoViewerPage;


    var $dashboardWidget = WidgetStore.getWidget();
    var lock = lockProvider.getInstance();
    var fileManager = new FileManager(source);
    ng.extend($scope, {
        $dashboardWidget: $dashboardWidget,
        showPreloader: true,
        errorMessage: '',
        downloadUrl: "",
        componentCuid: null
    });

    var waitingExport = false;
    var coordinator = new JobPagesCoordinator(source, 5000);

    ng.extend($scope, {
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
        }
    });

    init();

    function init() {
        $ngRedux.dispatch(oozieReduxActions.loadOozieModule(source));

        $scope.componentCuid = getComponentCuidByIdObject(idObject);
        bindStateToScope();

        setupStatusBarTabs();

    }

    function postInit() {
        // CALL after workflow load
        updateSourceVersion(source, workflow);

        onWorkflowUpdated(workflow);

        setupTabPages();

        setupPluginActions();
        openWorkflowXmlFile();

        setupScopeEvents();
        // @TODO: @cleanup: remove widgetUiControl commented code
        // setupWidgetUiControlEvents();

    }

    function bindStateToScope() {
        var unsubscribe = $ngRedux.connect(onStateChange)($scope);
        $scope.$on('$destroy', unsubscribe);
    }

    var isWorkflowWasLoaded = false;
    var lastWorkflow = null;

    function onStateChange(state) {
        var result = {};
        workflow = retrieveComponentByCuid(state, $scope.componentCuid);
        // workflow = retrieveComponentByIdObject(state, idObject);
        if (!isWorkflowWasLoaded) {
            if (workflow && !workflow.$meta.busy && workflow.$meta.isLoaded) {
                isWorkflowWasLoaded = true;
                $scope.showPreloader = false;
                postInit();
            } else if (workflow && workflow.$meta.error) {
                $scope.showPreloader = false;
                $scope.errorMessage = workflow.$meta.error;
            }
        } else {
            // deep object comparision on EACH stateChange !!!
            // hash optimisation is needed !!!!
            // @TODO: verify comparision operation
            if (!workflow.$meta.busy && !ng.equals(workflow, lastWorkflow)) {
            // if (!workflow.$meta.busy && workflow != lastWorkflow) {
                onWorkflowUpdated(workflow);
            }
        }
        lastWorkflow = workflow;
        return result;
    }

    function updateSourceVersion(source, container) {
        // always use version from container
        // and ignore version returned by flat modules list or tenant deployment response
        source.module.version = container.version;
    }

    function setupScopeEvents() {
        $scope.$on('save-file', function (event, file) {
            event.stopPropagation();
            $scope.showPreloader = true;
            restService.saveFile('v1.0', source, file)
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

        /**
         * works for "config-default.xml" and "coordinator-config.xml"
         */
        $scope.$on('save.config', function (event, data) {
            saveConfig(event, data.file.path, data.config);
        });

        $scope.$on('hide.left-tab-panel', function (event) {
            event.stopPropagation();
            $dashboardWidget.leftTabManager.setActive(-1);
        });

        $scope.$on('open-file.file-browser', function (event, file) {
            event.stopPropagation();
            openNewTabOrHighlightExistedOne(file);
        });

        $scope.$on('item-created.options-editor', function (event, file) {
            event.stopPropagation();
            fileManager.updateFiles();
        });

        $scope.$on('open-file.oozie-workflow', function (event, file, nodeSubtype) {
            event.stopPropagation();
            openNewTabOrHighlightExistedOne(file, false, false, nodeSubtype);
        });

    }


    function setupPluginActions() {
        $dashboardWidget.addPluginAction({
            name: "Delete component",
            handler: function (closeActionMenu) {
                closeActionMenu(true);
                confirmAndDeleteModule();
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
                    $scope.downloadUrl = restService.getWorkflowDownloadPath(source, FILE_WORKFLOW_XML);
                    waitingExport = true;
                    WidgetAccessorActions.updateWidgetProgressBarMessage("Exporting component...");
                }
                closeActionMenu(true);
            }
        });

    }


    function setupTabPages() {
        let platformInfo = {
            platform: platformMeta.title,
            cluster: source.cluster.title,
            hdfsPath: source.module.id
        };

        componentInfoJsonSchema = jsonSchemaBuilder.createSchema({
            title: 'Component',
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
                team: {
                    type: 'string',
                    readonly: false,
                    title: 'Team'
                }
            }
        });
        platformInfoJsonSchema = jsonSchemaBuilder.createSchema({
            title: 'Info',
            type: 'object',
            properties: {
                platform: {
                    type: 'string',
                    readonly: true,
                    title: 'Platform'
                },
                cluster: {
                    type: 'string',
                    readonly: true,
                    title: 'Cluster'
                },
                hdfsPath: {
                    type: 'string',
                    readonly: true,
                    title: 'HDFS Path'
                }
            }
        });

        infoViewerPage = TabPage.factory({
            name: "info-viewer",
            params: {
                sections: [componentInfoJsonSchema, platformInfoJsonSchema],
                editSections: [componentInfoJsonSchema],
                data: [workflow, platformInfo],
                onUpdate: function (sectionsToUpdate) {
                    $scope.showPreloader = true;
                    var json = sectionsToUpdate[0].toJSON();
                    restService.updateWorkflowMeta(source, {team: json.team})
                        .then(function () {
                            workflow = ng.extend(workflow, json);
                            onComponentUpdated(workflow, platformMeta);
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


        tabIndexInfo = $dashboardWidget.leftTabManager.addTab(infoViewerPage, '', 'Info', 'b-oozie-plugin__flowchart-widget__info-icon', true);

        tabIndexFileManager = $dashboardWidget.leftTabManager.addTab(TabPage.factory({
            name: "file-browser",
            params: {
                // files: fileManager // ??? how it could work in past ?????
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

        let jobTabIndex, coordinatorTabIndex;

        let isTabWithJobListFunction = index => index === coordinatorTabIndex || index === jobTabIndex;

        let iconCoordinator = source.platform.type === TYPE_CDH ? 'b-oozie-plugin__jobs__icon-coordinator-cdh' : 'b-oozie-plugin__jobs__icon-coordinator-hdp';
        coordinatorTabIndex = $dashboardWidget.leftTabManager.addTab(TabPage.factory({
            name: "oozie-jobs",
            params: {
                workflowFile: findWorkflowFile(workflow),
                files: workflow.files,
                fileManager: fileManager,
                workflow: workflow,
                coordinator: coordinator,
                restGetRawFileFunction: restGetRawFileFunction,
                visibleJobType: JOB_TYPE_COORDINATOR,
                isTabWithJobListFunction: isTabWithJobListFunction
            }
        }), '', 'Coordinator Jobs', iconCoordinator, true);

        let iconWorkflow = source.platform.type === TYPE_CDH ? 'b-oozie-plugin__jobs__icon-cdh' : 'b-oozie-plugin__jobs__icon-hdp';
        jobTabIndex = $dashboardWidget.leftTabManager.addTab(TabPage.factory({
            name: "oozie-jobs",
            params: {
                workflowFile: findWorkflowFile(workflow),
                files: workflow.files,
                fileManager: fileManager,
                workflow: workflow,
                coordinator: coordinator,
                visibleJobType: JOB_TYPE_WORKFLOW,
                isTabWithJobListFunction: isTabWithJobListFunction
            }
        }), '', 'Workflow Jobs', iconWorkflow, true);

        $dashboardWidget.leftTabManager.setActive(-1);

    }

    function onComponentUpdated(workflow, platformMeta) {
        infoViewerPage.params.data = [workflow, {
            platform: platformMeta.title,
            cluster: source.cluster.title,
            hdfsPath: source.module.id
        }];
    }


    function openNewTabOrHighlightExistedOne(file, doNotSetFocus, openAsText, nodeSubtype) {
        // @TODO: validate
        // possible error here file.type === "workflow", but should it be "file" ???
        // var fileOpenedFromSubworkflowNodeProperties = file.type === "workflow" && nodeSubtype === "sub-workflow";
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
                    restService.getFileAsConfig('v1.0', source, file.path).then(function (data) {
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
                        }
                    );
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

            let componentSaver = new ComponentSaver(source);
            componentSaver.registerBeforeSaveInterceptor(() => $scope.showPreloader = true);
            componentSaver.registerAfterSaveInterceptor(() => {
                $scope.showPreloader = false;
                fileManager.updateFiles();
            });
            var page = TabPage.factory({
                name: "oozie-workflow-page",
                params: {
                    file: file,
                    files: workflow.files,
                    isTenantComponent: false,
                    source: source,
                    workflowDescriptor: workflow,
                    fileManager: fileManager,
                    restGetRawFileFunction: restGetRawFileFunction,
                    componentSaver: componentSaver,
                    ideTabTitleChangerCallback: ideTabTitleChangerCallback
                }
            });

            var tabIndex = $dashboardWidget.tabManager.addTab(page, title, tooltip, '');
            var deregisterBeforeTabRemoveCallback = $dashboardWidget.tabManager.on(tabManagerEvents.BEFORE_TAB_REMOVE, function (event, params) {
                var result = page.notifySubscribers(tabPageEvents.BEFORE_PAGE_REMOVE, 3);
                var promise = $q.all(result).then(function () {
                    deregisterBeforeTabRemoveCallback();
                }, function () {
                    return $q.reject();
                });
                event.addDeferredResult(promise);
            });
            if (!doNotSetFocus) {
                $dashboardWidget.tabManager.setActive(tabIndex);
            }

            function ideTabTitleChangerCallback(newTitle) {
                var workflowTabIndex = $dashboardWidget.tabManager.getIndexByPage(page);
                var workflowTab = $dashboardWidget.tabManager.getTab(workflowTabIndex);
                workflowTab.label = newTitle;
            }

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
        var file = findWorkflowFile(workflow);

        if (file) {
            let lastOccurrence = file.path.lastIndexOf("/");
            if (lastOccurrence !== -1) {
                file.path = file.path.substr(lastOccurrence + 1);
            }

            openNewTabOrHighlightExistedOne(file);
        }
    }

    function findWorkflowFile(workflow) {
        return workflow.files.filter(function (f) {
            return f.path.includes(FILE_WORKFLOW_XML);
        })[0];
    }


    function isFilePathIsConfigDefaultXml(filePath) {
        return fileHelper.normalizePath(filePath) === fileHelper.normalizePath('/' + FILE_CONFIG_DEFAULT_XML);
    }

    function isFilePathIsCoordinatorConfigDefaultXml(filePath) {
        return fileHelper.normalizePath(filePath) === fileHelper.normalizePath('/' + FILE_COORDINATOR_CONFIG_XML);
    }

    function uploadFile(path, file) {
        var existingFile = fileManager.fileExists(path);
        if (existingFile) {
            alertsManagerService.addAlertWarning({
                title: 'Warning',
                text: 'A file with such name is already uploaded. Do you want to replace it?',
                buttons: [
                    {
                        text: "Yes",
                        style: "action",
                        action: function (close) {
                            close();
                            fileManager.uploadFile(file, path).then(function () {
                                alertsManagerService.addAlertSuccess({
                                    title: 'Success',
                                    text: 'File "' + path + '" has been successfully uploaded.'
                                });
                            }).catch(function (response) {
                                alertsManagerService.addAlertError({
                                    title: 'Error',
                                    text: 'File "' + path + '" has not been uploaded because of error: ' + response
                                });
                            });
                        }
                    },
                    {
                        text: "No",
                        style: "cancel",
                        action: function (close) {
                            close();
                            file.remove();
                        }
                    }
                ]
            });
        } else {
            fileManager.uploadFile(file, path).then(function () {
                alertsManagerService.addAlertSuccess({
                    title: 'Success',
                    text: 'File "' + path + '" has been successfully uploaded.'
                });
            }).catch(function (response) {
                alertsManagerService.addAlertError({
                    title: 'Error',
                    text: 'File "' + path + '" has not been uploaded because of error: ' + response
                });
            });
        }
    }

    function confirmAndDeleteModule() {
        var d = $q.defer();
        var module = source.module; // ? remove this line ??? // @TODO: verify!!!

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
                        action: deleteModule
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

        function deleteModule(close) {
            close();
            $scope.showPreloader = true;
            var module = source.module;
            var moduleNaming = $dashboardWidget.title;
            restService.removeModule(source)
                .then(function () {
                    var successMsg = {
                        type: "success",
                        title: "Delete",
                        text: "Module " + moduleNaming + "(" + module.id + ")" + " has been successfully deleted"
                    };
                    alertsManagerService.addAlertSuccess(successMsg);
                    WidgetsActions.removeWidget($dashboardWidget, true);
                    d.resolve();
                }, function (error) {
                    var errorMsg = {
                        type: "error",
                        title: "Delete",
                        text: "Module " + moduleNaming + "(" + module.id + ")" + " has not been deleted because: " + error.message
                    };
                    alertsManagerService.addAlertError(errorMsg);
                    d.resolve();
                })
                .finally(function () {
                    $scope.showPreloader = false;
                });
        }

        return d.promise;
    }

    function setupStatusBarTabs() {
        var statusBarTabs = [];
        statusBarTabs.push({label: 'Platform', value: source.platform.id});
        statusBarTabs.push({label: 'Cluster', value: source.cluster.id});
        statusBarTabs.push({label: 'Path', value: source.module.id});

        WidgetAccessorActions.updateWidgetStatusBarTabs(statusBarTabs);
    }

    function saveConfig(event, configFile, configData) {
        event.stopPropagation();
        $scope.showPreloader = true;
        restService.saveFileAsConfig('v1.0', source, configFile, configData)
            .then(function () {
                alertsManagerService.addAlertSuccess({
                    title: 'Config default save success',
                    text: 'Config "' + configFile + '" has not been successfully saved'
                });
            })
            .catch(function (error) {
                var errorMessage = ng.isString(error) ? error : error && ng.isString(error.message) ? error.message : 'Unknown error';
                alertsManagerService.addAlertError({
                    title: 'Error',
                    text: 'Config "' + configFile + '" has not been saved because of error: ' + errorMessage
                });
            })
            .finally(function () {
                $scope.showPreloader = false;
            });
    }


    // @TODO: move into reducer and include from it
    function retrieveComponentByCuid(state, cuid) {
        return state.data.oozie.components[cuid] ? state.data.oozie.components[cuid] : null;
    }


    // @TODO: move into reducer and include from it
    function onWorkflowUpdated(workflow) {
        $dashboardWidget.title = workflow.name;
        $dashboardWidget.secondaryTitle = workflow.version;
        $dashboardWidget.icon = 'icon-oozie-' + platformMeta.type.toLowerCase();
    }


}

