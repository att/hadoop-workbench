/*jshint maxparams: 11*/
import {TYPE_CDH, TYPE_HDP} from '../../../../../plugins/platform/constants/platform-types';
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('flume-widget.IndexController', Controller);

    Controller.$inject = [
        '$scope',
        'dashboard.models.TabPage',
        'dashboard-isolated-widget-accessor.WidgetStore',
        'loadedAgent',
        'flume.FileManager',
        'flume.restService',
        'file-browser.file-helper',
        'main.alerts.alertsManagerService',
        '$q',
        'dashboard.WidgetsActions',
        'core.lockProvider',
        'dashboard-isolated-widget-accessor.WidgetActions',
        'shared.jsonSchemaBuilder',
        'flume.ComponentSaver'
    ];
    function Controller($scope, TabPage, WidgetStore, agentContainer, FileManager, restService, fileHelper, alertsManagerService, $q, WidgetsActions, lockProvider, WidgetAccessorActions, jsonSchemaBuilder, ComponentSaver) {
        var self = this;
        var fileManager = null;
        var $dashboardWidget = WidgetStore.getWidget();
        var lock = lockProvider.getInstance();
        var source = $dashboardWidget.params.source;
        $dashboardWidget.title = agentContainer.name + (agentContainer.agentName ? ': ' + agentContainer.agentName : '');
        $dashboardWidget.icon = 'icon-flume-' + agentContainer.platform.type.toLowerCase();
        var waitingExport = false;

        ng.extend($scope, {
            widget: $dashboardWidget,
            downloadUrl: ""
        });

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

        init();

        function init() {
            fileManager = new FileManager(WidgetStore.getWidget().params.source);
            fileManager.init(agentContainer.files);

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
                        var file = agentContainer.files.filter(function (file) {
                            return fileHelper.normalizePath(file.path).indexOf('conf/flume.properties') !== -1;
                        })[0];
                        if (file) {
                            waitingExport = true;
                            WidgetAccessorActions.updateWidgetProgressBarMessage("Exporting component...");
                            $scope.downloadUrl = restService.getPipelineDownloadPath(source, file.path);
                        }
                    }
                    closeActionMenu(true);
                }
            });

            setupStatusBarTabs();

            setupTabs();

            bindToEvents();

            openPipelineFile();
        }

        function setupStatusBarTabs() {
            var statusBarTabs = [];
            statusBarTabs.push({label: 'Platform', value: source.platform.title});
            statusBarTabs.push({label: 'Cluster', value: source.cluster.title});
            statusBarTabs.push({label: 'Service', tooltip: 'Service Name', value: source.service.title});

            var componentNameValue = agentContainer.name ? agentContainer.name : '';
            if (componentNameValue) {
                statusBarTabs.push({label: 'Component', tooltip: 'Component Name', value: componentNameValue});
            }

            WidgetAccessorActions.updateWidgetStatusBarTabs(statusBarTabs);
        }

        function setupTabs() {
            var infoJsonSchema = jsonSchemaBuilder.createSchema({
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
                    service: {
                        type: 'string',
                        readonly: true,
                        title: 'Service'
                    },
                    component: {
                        type: 'string',
                        readonly: true,
                        title: 'Component'
                    }
                }
            }).populate({
                platform: source.platform.title,
                cluster: source.cluster.title,
                service: source.service.title,
                component: agentContainer.name
            });

            $scope.widget.leftTabManager.addTab(TabPage.factory({
                name: "info-viewer",
                params: {
                    sections: [infoJsonSchema]
                }
            }), '', 'Info', 'b-oozie-plugin__flowchart-widget__info-icon', true);

            $scope.widget.leftTabManager.addTab(TabPage.factory({
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

            let icon = isPlatformCloudera(source) ? 'b-flume-plugin__instances-icon-cdh' :
                isPlatformHDP(source) ? 'b-flume-plugin__instances-icon-hdp' : 
                'b-flume-plugin__instances-icon-cdh';
            $scope.widget.leftTabManager.addTab(TabPage.factory({
                name: 'flume-instances'
            }), '', 'Instances', icon, true);

            $scope.widget.leftTabManager.setActive(-1);
        }

        function bindToEvents() {
            $scope.$on('hide.left-tab-panel', hideLeftTabsPanel);
            /////////////////////
            $scope.$on('open-file.file-browser', function (event, file) {
                event.stopPropagation();

                openNewTabOrHighlightExistedOne(file);
            });

            $scope.$on('save-file', function (event, file) {
                event.stopPropagation();
                $scope.showPreloader = true;
                restService.saveFile('v1.0', WidgetStore.getWidget().params.source, file)
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

            $scope.$on('show-plugin-preloader', function () {
                $scope.showPreloader = true;
            });

            $scope.$on('hide-plugin-preloader', function () {
                $scope.showPreloader = false;
            });
        }

        function pullLibraries() {
            return restService.pullServiceInstance('v1.0', source.platform.id, source.cluster.id, source.service.id, source.module.id)
                .then(function () {
                    fileManager.updateFiles();
                    return restService.getAgent('v1.0', source);
                });
        }

        function pushLibraries() {
            return restService.pushServiceInstance('v1.0', source.platform.id, source.cluster.id, source.service.id, source.module.id);
        }

        function hideLeftTabsPanel() {
            WidgetStore.getWidget().leftTabManager.setActive(-1);
        }

        function openNewTabOrHighlightExistedOne(file) {
            var allTabs = WidgetStore.getWidget().tabManager.getTabs();
            var existedTab = allTabs.filter(function (tab) {
                return tab.page.params.file && tab.page.params.file.path === file.path;
            })[0];

            if (existedTab) {
                WidgetStore.getWidget().tabManager.setActive(allTabs.indexOf(existedTab));
                return;
            }

            if (lock.isExists(file.path)) {
                return;
            }

            if (fileHelper.normalizePath(file.path).indexOf('conf/flume.properties') !== -1) {
                let componentSaver = new ComponentSaver(source);
                componentSaver.registerBeforeSaveInterceptor(() => $scope.showPreloader = true);
                componentSaver.registerAfterSaveInterceptor(() => {
                    fileManager.updateFiles();
                    $scope.showPreloader = false;
                });

                var tabIndex = WidgetStore.getWidget().tabManager.addTab(TabPage.factory({
                    name: "flume-pipeline-page",
                    params: {
                        file: file,
                        fileManager: fileManager,
                        source: WidgetStore.getWidget().params.source,
                        agentName: agentContainer.agentName,
                        agent: agentContainer,
                        isDeployed: true,
                        sharedActions: {
                            pullLibraries: pullLibraries,
                            pushLibraries: pushLibraries
                        },
                        componentSaver: componentSaver,
                        isPlatformHDP: isPlatformHDP(source)
                    }
                }), 'Pipeline', '', '', true);
                WidgetStore.getWidget().tabManager.setActive(tabIndex);
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
            return restService.getFile('v1.0', WidgetStore.getWidget().params.source, file.path).then(function (fileData) {
                var data = ng.extend({}, file, fileData);
                var tabIndex = WidgetStore.getWidget().tabManager.addTab(TabPage.factory({
                    name: "file-text-viewer",
                    params: {
                        file: data
                    }
                }), tabName, file.path);
                WidgetStore.getWidget().tabManager.setActive(tabIndex);
            });
        }

        function openPipelineFile() {
            agentContainer.files.forEach(function (file) {
                if (fileHelper.normalizePath(file.path).indexOf('conf/flume.properties') !== -1) {
                    openNewTabOrHighlightExistedOne(file);
                }
            });
        }

        function confirmAndDeleteModule() {
            var d = $q.defer();
            var module = source.module;

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

            function confirmWaitAndForceDeleteModule() {
                var d = $q.defer();
                var module = source.module;

                // confirm deletion
                alertsManagerService.addAlerts([
                    {
                        type: "confirm",
                        title: module.id ? module.id : module.name,
                        text: "Stop all flume instances and delete module? This could take long time.<br>" +
                        "Press \"Ok & Wait\" to continue or \"Cancel\" to stop them manually.",
                        buttons: [
                            {
                                text: "Ok & Wait",
                                style: "action",
                                action: waitAndDeleteModule
                            },
                            {
                                text: "Cancel",
                                style: "cancel",
                                action: function (close) {
                                    close();
                                }
                            }
                        ]
                    }
                ]);
            }

            function waitAndDeleteModule(close) {
                deleteModule(close, true);
            }

            function deleteModule(close, forceDelete) {
                close();
                $scope.showPreloader = true;
                var module = source.module;
                restService.removeModule(source, forceDelete)
                    .then(function () {
                        var successMsg = {
                            type: "success",
                            title: "Delete",
                            text: "Module " + module.name + " has been successfully deleted"
                        };
                        alertsManagerService.addAlertSuccess(successMsg);
                        WidgetsActions.removeWidget($dashboardWidget, true);
                        d.resolve();
                    }, function (error) {
                        if (!forceDelete && error.message == 'All instances must be stopped') {
                            confirmWaitAndForceDeleteModule();
                        } else {
                            var errorMsg = {
                                type: "error",
                                title: "Delete",
                                text: "Module " + module.name + " has not been deleted because: " + error.message
                            };
                            alertsManagerService.addAlertError(errorMsg);
                        }
                        d.resolve();
                    })
                    .finally(function () {
                        $scope.showPreloader = false;
                    });
            }

            return d.promise;
        }

        /**
         *  Determine platform type CDH (Cloudera)
         * @param source {Object}
         * @returns {boolean}
         */
        function isPlatformCloudera(source) {
            return source && source.platform && source.platform.type === TYPE_CDH ? true : false;
        }

        /**
         *  Determine platform type HDP (Hortonworks)
         * @param source {Object}
         * @returns {boolean}
         */
        function isPlatformHDP(source) {
            return source && source.platform && source.platform.type === TYPE_HDP ? true : false;
        }

    }
});
