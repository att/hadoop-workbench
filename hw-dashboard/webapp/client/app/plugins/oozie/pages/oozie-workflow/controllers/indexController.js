/*jshint maxparams:19*/
define(function (require) {
    "use strict";

    require('../ngModule').controller('oozieWorkflow.indexController', indexController);
    // @TODO: maybe were is some better way to include this file?
    var types = require('../../../../../shared/widgets/json-schema/services/types');

    var angular = require("angular");

    indexController.$inject = [
        '$scope',
        '$q',
        'oozie.restService',
        "oozie.services.nodeFactory",
        "oozie.services.connectionFactory",
        "main.alerts.alertsManagerService",
        "restrictionsServiceInstance",
        "module",
        "workflowFiles",
        "nodesMetadata",
        "oozie.nodeIdGenerator",
        "dashboard.models.TabPage",
        "dashboard.models.TabPage.EVENTS",
        "dashboard.models.PageControl",
        '$widgetParams',
        'core.get-file-uploader',
        'loadedWorkflow',
        'userSettings.storage',
        'dashboard-isolated-widget-accessor.WidgetStore',
        'dashboard-isolated-widget-accessor.WidgetActions',
        '$rootScope',
        "$timeout",
        'core.utils',
        'generateUUID'
    ];

    function indexController($scope, $q, restService, nodeFactory, connectionFactory, dashboardAlertsManager,
                             restrictionsServiceInstance, module, workflowFiles, nodesMetadata, NodeIdGenerator, TabPage, pageEvents,
                             PageControl, $widgetParams, getFileUploader, loadedWorkflow, userSettingsStorage,
                             WidgetStore, WidgetAccessorActions, $rootScope, $timeout, utils, generateUUID) {
        if (!loadedWorkflow) {
            //means that workflow has not been loaded. Show error message instead of the workflow
            $scope.goToTextTab = $widgetParams.params.openTextViewTab || angular.noop;
            $scope.loadDataError = true;
            return this;
        }

        var dashboardWidget = WidgetStore.getWidget();
        var alertTitle = dashboardWidget.title;
        var page = $widgetParams.page;
        var file = $widgetParams.params.file;
        var componentSaver = $widgetParams.params.componentSaver;
        var fileManager = $widgetParams.params.fileManager;
        var removeAlerts = [];
        var isTenantComponent = $widgetParams.params.isTenantComponent;
        var source = isTenantComponent ? {
            isTenantComponent: $widgetParams.params.isTenantComponent,
            componentId: $widgetParams.params.componentId
        } : $widgetParams.params.source;

        var clipboard = utils.clipboard();
        var fileBuffer = {};
        var ideTabTitleChangerCallback = $widgetParams.params.ideTabTitleChangerCallback;
        if (ideTabTitleChangerCallback) {
            ideTabTitleChangerCallback(loadedWorkflow.path);
        }

        WidgetAccessorActions.updateWidgetHotkeyBindings(clipboard.hotkeyBindings({
            copySelection: copySelection,
            pasteSelection: pasteSelection,
            clearSelection: clearSelection,
            deleteNode: deleteNode
        }));

        page.on(pageEvents.BEFORE_PAGE_REMOVE, function (event, params) {
            var defer = $q.defer();
            event.addDeferredResult(defer.promise);

            var message = {
                type: "confirm",
                title: "Some title",
                text: "Do you really want to remove the page?",
                delay: 5000,
                buttons: [
                    {
                        text: "Yes",
                        style: "action",
                        action: function (close) {
                            defer.resolve();
                            close();
                        }
                    },
                    {
                        text: "No",
                        style: "cancel",
                        action: function (close) {
                            defer.reject();
                            close();
                        }
                    }
                ]
            };
            dashboardAlertsManager.addAlerts([message]);
        });

        var tabIndexes = {
            alerts: -1,
            addNode: -1,
            nodeProperties: -1
        };

        var nodeIdGenerator = NodeIdGenerator.factory(module.getNodes());

        var isFileOpenedFromSubworkflowNodeProperties = $widgetParams.params.isFileOpenedFromSubworkflowNodeProperties;
        $scope.alertTitle = alertTitle;
        $scope.workflowFiles = $widgetParams.params.files;

        $scope.showPreloader = false;
        $scope.workflowNodeTemplates = [];
        $scope.fileUploader = getFileUploader.create({
            onAfterAddingFile: function (fileItem) {
                var urlContainer = {
                    path: 'lib/',
                    file: fileItem
                };
                $scope.$emit('upload-file.file-browser', urlContainer);
            }
        });

        // data shared between widgets
        $scope.selectedModule = module; // holds module which is set as a model for flowchart widget
        $scope.metrics = {};
        $scope.isAutoRefresh= false;
        $scope.refreshInterval = 5000;

        $scope.dashboardWidgetContainer = {
            dashboardWidget: dashboardWidget
        };

        // TODO(maximk): refactor this to contain simple reference to node not wrapped inside object
        $scope.selectedNodeContainer = {
            node: null
        };
        $scope.multipleSelectedNodeContainer = {};

        $scope.nodesMetadata = nodesMetadata;
        $scope.nodesMetadata[0].title = "Flow Control";
        $scope.nodesMetadata[1].title = "Action";

        $scope.validationMessages = [];
        $scope.nodeValidatorCallback = getNodeValidatorFactory();
        $scope.removeAlert = removeAlert;
        $scope.selectedConnection = null;

        // workaround to address jsPlumb requirement to have nodes drawn when configuring endpoints
        var renderedNodesCount = 0;
        $scope.moduleConnections = [];

        $scope.$on("endpoints-configured.js-plumb-item", function (event) {
            event.stopPropagation();

            renderedNodesCount += 1;
            if ($scope.selectedModule.getNodes().length === renderedNodesCount) {
                $scope.moduleConnections = $scope.selectedModule.getConnections();
            }
        });

        // TODO(maximk): refactor this into events sent by widgets
        // callbacks shared with flowchart widget to manage nodes and connections of a selected module
        $scope.addNewConnection = function (connection) {
            var srcEndpointUuid = connection.endpointUuids.from;
            var targetEndpointUuid = connection.endpointUuids.to;

            var connectionConnectorTypes = determineConnectorType(connection, srcEndpointUuid, targetEndpointUuid);
            var fromEpConnectorType = connectionConnectorTypes.from;

            var newConnection = null;

            try {
                newConnection = connectionFactory.getConnectionInstance(connection.from, connection.to, fromEpConnectorType);
            } catch (e) {
                console.log('failed to create connection because of the error: ' + e.message);
            }

            if (newConnection) {
                newConnection.$connection = connection.connection;
                $scope.selectedModule.addConnections([newConnection]);
            }
        };
        $scope.copyConnection = function (connection) {
            var srcEndpointUuid = connection.endpointUuids.from;
            var targetEndpointUuid = connection.endpointUuids.to;

            connection.from.endpoints = [{id: srcEndpointUuid, connectorType: connection.connectors.from}];
            connection.to.endpoints = [{id: targetEndpointUuid, connectorType: connection.connectors.to}];

            $scope.addNewConnection(connection);
        };
        $scope.removeNode = function (node) {
            var createdFromTemplate = node.templateId;
            if (createdFromTemplate) {
                var templateIndex = -1;
                $scope.selectedModule.usedTemplates.some(function (template, index) {
                    if (template.id === node.templateId) {
                        templateIndex = index;
                        return true;
                    }
                    return false;
                });
                console.assert(templateIndex !== -1, "Node has template ID, but it's not found in selected module templates");
                $scope.selectedModule.usedTemplates.splice(templateIndex, 1);
            }

            $scope.selectedModule.removeNodes([node]);
            $scope.selectedNodeContainer.node = null;

            delete $scope.multipleSelectedNodeContainer[node.id];
        };

        $scope.removeConnection = function (connection) {
            if ($scope.selectedConnection !== null && connection.connection === $scope.selectedConnection.$connection) {
                if (connection.connection.endpoints) {
                    connection.connection.endpoints.forEach(function (endpoint) {
                        endpoint.canvas.classList.remove("selected");
                    });
                }
                if (connection.connection.canvas) {
                    connection.connection.canvas.classList.remove("selected");
                }
                $scope.selectedConnection = null;
            }

            $scope.selectedModule.removeConnections([connection]);
        };

        $scope.deleteConnectionRequest = function (connection) {
            if (connection) {
                confirmAndRemoveConnection(connection);
            }
        };

        function checkNodeById(id, callback) {
            callback = callback || function(){};
            var errors = [],
                message = {
                type: "error",
                message: "Can't add node! Node '" + id + "' already exist"
                };
            errors.push(message);
            var result = {
                valid : false,
                errors : errors
            };

            $scope.selectedModule.getNodes().forEach(
                (node) => {
                    if (node["subtype"] === id) {
                        if (id == "start" || id == "end") {
                            callback(true, result);
                        }
                    }
                }
            );
        }

        $scope.loadTenantsList = function (node) {
            return restService.loadTenantsList(node.name, node.version);
        };

        $scope.widgets = setupPageControls();

        startTimers();

        // bind to widget events (syntax is "eventname.widgetname") to conduct validation
        // these events are going to be a replacement for widget callbacks used above
        $scope.$on("connectionadd.flowchart", function (event, connection) {
            event.stopPropagation();

            var result = validateConnectionAddition(connection);

            if (!result.valid) {
                event.preventDefault();
            }

            var resultTransition = validateModuleTransitionRestrictions(connection);
            if (!resultTransition.valid) {
                event.preventDefault();
            }

            var messagesCount = $scope.validationMessages.length;
            $scope.validationMessages.splice(0, messagesCount);

            var errors = [];
            (result.errors.concat(resultTransition.errors)).forEach(function (error) {
                var message = {
                    type: "error",
                    title: alertTitle,
                    text: error.message,
                    delay: 5000
                };
                errors.push(message);
            });

            dashboardAlertsManager.addAlerts(errors);

        });

        $scope.$on("connection-moved.flowchart", function (event, {info, connection}) {
            event.stopPropagation();

          var result = validateConnectionAddition(connection);

            if (!result.valid) {
                event.preventDefault();
            }

            var resultTransition = validateModuleTransitionRestrictions(connection);
            if (!resultTransition.valid) {
                event.preventDefault();
            }

            try {
                var c = $scope.selectedModule.getConnections();
                c.forEach(function (v, i, con) {
                    if (con[i].$connection["id"] === info.connection["id"]) {
                        c.splice(i, 1);
                    }
                });
            } catch (e) {
                console.log(e);
            }

        });

        // TODO(maximk): this function seems redundant and is not called from anywhere - check
        $scope.$on("node-remove.options-editor", function (event, node) {
            event.stopPropagation();

            $scope.selectedModule.removeNodes([node]);
            $scope.selectedNodeContainer.node = null;
        });
        $scope.$on("node-remove-confirm.flowchart", function (event, node) {
            if (node.endpoints) {
                var endpoints = node.endpoints;
                if (!angular.isUndefined(endpoints)) {
                    endpoints.forEach(function (endpoint) {
                        $scope.$emit("endpoint-delete.jsPlumbRemoveNode", endpoint);
                        jsPlumb.deleteEndpoint(endpoint.ep);
                    });
                }
            }
            $scope.removeNode(node);
        });
        $scope.$on("connection-select.flowchart", function (event, jsPlumbConnection) {
            event.stopPropagation();

            var connection = null;
            $scope.selectedModule.getConnections().some(function (c) {
                if (c.$connection === jsPlumbConnection) {
                    connection = c;
                    return true;
                } else {
                    return false;
                }
            });

            $scope.selectedNodeContainer.node = null;
            $scope.selectedConnection = connection;

            console.assert(connection !== null, "No matching connection for jsPlumbConnection found");
        });

        $scope.$on("connection-deselect.flowchart", function (event, jsPlumbConnection) {
            event.stopPropagation();
            if (jsPlumbConnection.$connection) {
                if (jsPlumbConnection.$connection.endpoints) {
                    jsPlumbConnection.$connection.endpoints.forEach(function (endpoint) {
                        endpoint.canvas.classList.remove("selected");
                    });
                }
                if (jsPlumbConnection.$connection.canvas) {
                    jsPlumbConnection.$connection.canvas.classList.remove("selected");
                }
            }
            $scope.selectedConnection = null;
        });

        $scope.$on("connection-remove.flowchart", function (event, jsPlumbConnection) {
            event.stopPropagation();
            $scope.deleteConnectionRequest(jsPlumbConnection);
            $scope.selectedConnection = null;
        });

        $scope.$on("node-deselect.flowchart", function (event, node, multipleSelection) {
            event.stopPropagation();

            $scope.selectedNodeContainer.node = null;
            $scope.selectedConnection = null;

            removeSelectionFromNodes();
        });

        $scope.$on("node-select.flowchart", function (event, node, multipleSelection) {
            event.stopPropagation();

            $scope.selectedConnection = null;

            if (!multipleSelection) {

                $scope.selectedNodeContainer.node = node;

                removeSelectionFromNodes();
                $scope.multipleSelectedNodeContainer[node.id] = node;

            } else {

                // mark current selected node
                if ($scope.selectedNodeContainer.node) {
                    var nodeId = $scope.selectedNodeContainer.node.id;
                    $scope.multipleSelectedNodeContainer[nodeId] = $scope.selectedNodeContainer.node;
                    $scope.multipleSelectedNodeContainer[nodeId].isMultipleSelected = true;
                }

                // mark clicked node
                $scope.selectedNodeContainer.node = null;
                node.isMultipleSelected = !node.isMultipleSelected;

                if (node.isMultipleSelected) {
                    $scope.multipleSelectedNodeContainer[node.id] = node;
                } else {
                    delete $scope.multipleSelectedNodeContainer[node.id];
                }

            }

            if (Object.keys($scope.multipleSelectedNodeContainer).length > 1) {
                $scope.selectedNodeContainer.node = null;
            } else {
                var firstNodeKey = Object.keys($scope.multipleSelectedNodeContainer);
                $scope.selectedNodeContainer.node = $scope.multipleSelectedNodeContainer[firstNodeKey[0]];
            }

        });

        $scope.$on("node-double-clicked", function (event, node) {
            let propertyInfo, path, emit = false;

            event.preventDefault();
            switch (node.subtype) {
                case "sub-workflow": {
                    propertyInfo = node.properties.Advanced.getPropertyInfo('sub-workflow.app-path');
                    let file = node.properties.Advanced.getValue('sub-workflow.app-path');
                    path = file.replace(propertyInfo.pathPrefix, "").replace(/^\//, "");

                    var subworkflowNodeWithoutPath = path === "";
                    if (subworkflowNodeWithoutPath) {
                        showNoPathSpecifiedErrors([node], "sub-workflow", "workflow");
                        return;
                    }

                    emit = true;
                    break;
                }
                case "hive": {
                    let version = node.version.replace(/\./g, "_");
                    propertyInfo = node.properties.Advanced.getPropertyInfo("hive_" + version + ".script");
                    let file = node.properties.Advanced.getValue("hive_" + version + ".script");
                    path = file.replace(propertyInfo.pathPrefix, "");

                    let hiveNodeWithoutPath = path === "";
                    if (hiveNodeWithoutPath) {
                        showNoPathSpecifiedErrors([node], "hive", "hive script");
                        return;
                    }

                    emit = true;
                    break;
                }
                case "shell": {
                    let version = node.version.replace(/\./g, "_");
                    propertyInfo = node.properties.Advanced.getPropertyInfo("shell_" + version + ".file");
                    let files = node.properties.Advanced.getValue("shell_" + version + ".file");
                    let file = files.filter((file) => {
                        return file !== "";
                    })[0];
                    path = file ? file.replace(propertyInfo.pathPrefix, "") : "";

                    let shellNodeWithoutPath = path === "";
                    if (shellNodeWithoutPath) {
                        showNoPathSpecifiedErrors([node], "shell", "shell script");
                        return;
                    }

                    emit = true;
                    break;
                }
                case "pig": {
                    propertyInfo = node.properties.Advanced.getPropertyInfo('pig.script');
                    let file = node.properties.Advanced.getValue('pig.script');
                    path = file ? file.replace(propertyInfo.pathPrefix, "") : "";

                    let pigNodeWithoutPath = path === "";
                    if (pigNodeWithoutPath) {
                        showNoPathSpecifiedErrors([node], "pig", "pig script");
                        return;
                    }

                    emit = true;
                    break;
                }
                default: {
                    //do nothing
                }
            }

            if (emit) {
                $scope.$emit('open-file.oozie-workflow', {
                    path: "/" + path,
                    type: propertyInfo.fileType,
                    defaultFile: propertyInfo.defaultFile
                }, node.subtype);
            }

            function showNoPathSpecifiedErrors(nodes, nodeName, fileName) {
                $scope.validationMessages.length = 0;
                nodes.forEach(function (node) {
                    var message = {
                        type: "error",
                        text: "Path to " + fileName + " file is not specified"
                    };

                    message.action = function () {
                        $scope.selectedNodeContainer.node = node;
                    };

                    $scope.validationMessages.push(message);
                });

                dashboardAlertsManager.addAlerts([
                    {
                        type: "error",
                        title: "Linked files missing",
                        text: "No path to " + fileName + " file specified for the " + nodeName + " node",
                        action: function (close) {
                            close();
                            showAlertsTab();
                        }
                    }
                ]);
            }
        });

        var saveComponentEventName = isFileOpenedFromSubworkflowNodeProperties ?
            "tenant-workflow-template.save-component.non-root" :
            "tenant-workflow-template.save-component";
        $scope.$on(saveComponentEventName, function (event, saver) {
            saveOrUpdateModule(saver);
        });

        function startTimers() {
            if (!isTenantComponent) {
                fetchMetricsRequest();
            }
        }

        function processComponentSaverResults(results) {
            results.resolved.forEach((operation) => {
                if (!operation.hideSuccessNotification) {
                    dashboardAlertsManager.addAlertSuccess({
                        title: "Component save success",
                        text: `The file ${operation.name} has been successfully saved`
                    })
                }
            });

            results.rejected.forEach((operation) => {
                if (!operation.hideErrorNotification) {
                    dashboardAlertsManager.addAlertError({
                        title: "Component save error",
                        text: `The file ${operation.name} has not been saved because of the error: ${operation.reason}`
                    })
                }
            });
        }

        function setupPageControls() {
            var saveModuleCtrl = new PageControl({
                type: 'button',
                icon: 'b-oozie-plugin__flowchart-widget__save-icon',
                label: '',
                tooltip: 'Save',
                enable: true,
                styleAsTab: false,
                action: saveModule
            });

            var refreshMetricsCtrl = PageControl.factory({
                type: 'button',
                icon: 'b-oozie-plugin__flowchart-widget__refresh-icon',
                label: '',
                tooltip: 'Refresh Metrics',
                enable: true,
                action: fetchMetricsRequest,
                styleAsTab: false
            });


            var copyControl = PageControl.factory({
                name: 'copy-button',
                label: '',
                tooltip: 'Copy',
                type: 'button',
                icon: 'b-oozie-plugin__flowchart-widget__copy-icon',
                css: '',
                enable: true,
                hidden: true,
                styleAsTab: false,
                action: copySelection
            });

            var pasteControl = PageControl.factory({
                name: 'paste-button',
                label: '',
                tooltip: 'Paste',
                type: 'button',
                icon: 'b-oozie-plugin__flowchart-widget__paste-icon',
                css: '',
                enable: true,
                hidden: true,
                styleAsTab: false,
                action: pasteSelection
            });

            page.addControl(saveModuleCtrl);
            page.addControl(refreshMetricsCtrl);
            page.addControl(copyControl);
            page.addControl(pasteControl);

            var nodePropertiesPage = TabPage.factory({
                name: 'oozie-node-properties',
                params: {
                    node: $scope.selectedNodeContainer.node,
                    connection: $scope.selectedConnection,
                    configDefaultFile: $widgetParams.params.configDefaultFile,
                    coordinatorConfigDefaultFile: $widgetParams.params.coordinatorConfigDefaultFile,
                    removeConnection: confirmAndRemoveConnection,
                    deleteConnectionRequest: confirmAndRemoveConnection,
                    module: $scope.selectedModule,
                    source: source
                }
            });
            var uploadedLibsPage = TabPage.factory({
                name: 'uploaded-libs',
                params: {
                    fileManager: fileManager,
                    enablePushPull: false
                }
            });


            nodePropertiesPage.on('file-open', function (event, file) {
                $scope.$emit("open-file.oozie-workflow", file);
            });
            nodePropertiesPage.on('pageLoadSuccess', function (event) {
                nodePropertiesPage.notifySubscribers('oozie-node-selected', $scope.selectedNodeContainer.node);
                nodePropertiesPage.notifySubscribers('oozie-connection-selected', $scope.selectedConnection);
            });
            nodePropertiesPage.on('pageLoadSuccess', function (event) {
                nodePropertiesPage.notifySubscribers('oozie-node-selected', $scope.selectedNodeContainer.node);
                nodePropertiesPage.notifySubscribers('oozie-connection-selected', $scope.selectedConnection);
            });
            $scope.$watch('selectedNodeContainer.node', function (newNode) {
                nodePropertiesPage.notifySubscribers('oozie-node-selected', newNode);
            });
            $scope.$watch('selectedConnection', function (newConnection) {
                nodePropertiesPage.notifySubscribers('oozie-connection-selected', newConnection);
            });
            $scope.$watch(function () {
                return Object.keys($scope.multipleSelectedNodeContainer).length > 0;
            }, function () {
                toggleCopyPasteButtons();
            });

            var addNodePage = TabPage.factory({
                name: 'oozie-add-node',
                params: {
                    nodesMetadata: nodesMetadata,
                    loadTenantsList: $scope.loadTenantsList
                }
            });
            addNodePage.on("node-add", function (event, nodeData) {

                var result = {}, checker = false, addErrors = {};
                checkNodeById(nodeData.name, (res, errors) => {
                    checker = res;
                    addErrors = errors;
                });

                result =  checker ? addErrors : validateNodeAddition(nodeData);

                if (result.valid) {
                    var useEmptyConstructor = nodeData.canHaveTemplates === false || nodeData.template === null;
                    if (useEmptyConstructor) {
                        newEmptyNodePreProcessor(nodeData).then(function (propertiesString) {
                            createNewNode(nodeData.groupName, nodeData.name, nodeData.version, propertiesString)
                        });
                    } else {
                        $scope.showPreloader = true;
                        var tenantTemplateLoaded = restService.loadTenantTemplate(nodeData.template.id);
                        tenantTemplateLoaded.then(function (data) {
                            var templateProperties = data.properties;
                            createNewNode(nodeData.groupName, nodeData.name, nodeData.version, templateProperties, nodeData.template.id);
                            updateWorkflowUsedFilesData(nodeData.template.id, data);
                        }).finally(function () {
                            $scope.showPreloader = false;
                        });
                    }
                } else {
                    showNodeAddValidationErrors(result.errors);
                }
            });

            var alertsPage = TabPage.factory({
                name: 'oozie-alerts',
                params: {
                    validationMessages: $scope.validationMessages,
                    removeAlert: $scope.removeAlert
                }
            });

            tabIndexes.addNode = page.rightTabManager.addTab(addNodePage, '', 'Add Node', 'b-oozie-plugin__node-selector-widget__icon', true);
            tabIndexes.nodeProperties = page.rightTabManager.addTab(nodePropertiesPage, '', 'Properties', 'b-oozie-plugin__options-editor-widget__icon', true);
            tabIndexes.alerts = page.rightTabManager.addTab(alertsPage, '', 'Alerts', 'b-oozie-plugin__alerts-container-widget__icon', true);
            tabIndexes.uploadedLibs = page.rightTabManager.addTab(uploadedLibsPage, '', 'Libraries', 'b-oozie-plugin__libraries-widget__icon', true);

            page.rightTabManager.setActive(tabIndexes.nodeProperties);

            return {
                saveModule: saveModuleCtrl
            };
        }

        function fetchMetricsRequest() {
            return restService.getMetrics($widgetParams.params.source).then((metrics) => {
                // assignment
                if (metrics && metrics.assignments && metrics.assignments.length > 0) {

                    Object.keys($scope.metrics).forEach((nodeId) => {
                        $scope.metrics[nodeId].splice(0);
                    });
                    metrics.assignments.forEach((assignment) => {
                        if (!$scope.metrics[assignment.nodeId]) {
                            $scope.metrics[assignment.nodeId] = [];
                        }
                        $scope.metrics[assignment.nodeId].push(assignment);
                    })
                }
            })
                .catch(() => {})
                .finally(function () {
                    refreshMetrics();
                });
        }

        function refreshMetrics() {
            if ($scope.refreshIntervalTimeout) {
                $timeout.cancel($scope.refreshIntervalTimeout);
            }

            if ($scope.isAutoRefresh) {
                $scope.refreshIntervalTimeout = $timeout(function () {
                    if ($scope.isAutoRefresh) {
                        fetchMetricsRequest();
                    }
                }, $scope.refreshInterval);
            }
        }

        function showAlertsTab() {
            page.rightTabManager.setActive(tabIndexes.alerts);
        }

        function showNodePropertiesTab() {
            page.rightTabManager.setActive(tabIndexes.nodeProperties);
        }

        function saveModule() {
            var module = $scope.selectedModule;

            // clear all alerts before validation
            var messagesCount = $scope.validationMessages.length;
            $scope.validationMessages.splice(0, messagesCount);
            var result = validateModule(module);

            if (result.valid) {
                var hasWarnings = result.warnings.length;
                if (hasWarnings) {
                    showWarnings(result.warnings);

                    var warningsFoundMessage = "Warnings found. Do you want to save the module anyway?";
                    dashboardAlertsManager.addAlerts([
                        {
                            type: "warning",
                            title: alertTitle,
                            text: warningsFoundMessage,
                            action: showAlertsTab,
                            buttons: [
                                {
                                    text: "Yes",
                                    style: "action",
                                    action: function (close) {
                                        close();
                                        saveFiles();
                                        saveOrUpdateModule();
                                    }
                                },
                                {
                                    text: "No",
                                    style: "cancel",
                                    action: function (close) {
                                        close();
                                        showAlertsTab();
                                    }
                                }
                            ]
                        }
                    ]);
                } else {
                    saveFiles();
                    saveOrUpdateModule();
                }
            }

            function showWarnings(warnings) {
                warnings.forEach(function (warnings) {

                    var warningCommonForManyNodes = !angular.isUndefined(warnings.invalidNodeIds) && warnings.invalidNodeIds.length > 0;

                    if (warningCommonForManyNodes) {
                        warnings.invalidNodeIds.forEach(function (nodeId) {
                            var message = {
                                type: "warning",
                                text: warnings.message
                            };

                            var node = findNodeById(nodeId);
                            if (node) {
                                message.action = function () {
                                    $scope.selectedNodeContainer.node = node;
                                };
                            }

                            $scope.validationMessages.push(message);
                        });
                    } else {
                        var message = {
                            type: "warning",
                            text: warnings.message
                        };
                        $scope.validationMessages.push(message);
                    }
                });
            }

            function saveFiles() {
                if (fileBuffer && fileBuffer.files) {
                    //start background FILE COPY process if needed
                    if (fileBuffer.filesToCopyContainer.isTenantComponent) {
                        restService.copyFilesFromTenant(fileBuffer.filesToCopyContainer, convertSourceToFlat(source), fileBuffer.files);
                    } else {
                        restService.copyFilesFromPlatform(fileBuffer.filesToCopyContainer, convertSourceToFlat(source), fileBuffer.files);
                    }

                    fileBuffer = {};
                }
            }

            function showErrors(errors) {
                errors.forEach(function (error) {

                    // TODO(maximk): refactor so that all rules can return only `invalidNodes` property
                    var hasInvalidNodeIds = !angular.isUndefined(error.invalidNodeIds) && error.invalidNodeIds.length > 0;
                    var hasInvalidNodes = !angular.isUndefined(error.invalidNodes) && error.invalidNodes.length > 0;
                    var errorCommonForManyNodes = hasInvalidNodeIds || hasInvalidNodes;

                    if (errorCommonForManyNodes) {
                        var lookupProperty = hasInvalidNodeIds ? "invalidNodeIds" : "invalidNodes";
                        error[lookupProperty].forEach(function (nodeIdentifier) {
                            var message = {
                                type: "error",
                                text: error.message
                            };

                            var node = null;
                            if (hasInvalidNodeIds) {
                                node = findNodeById(nodeIdentifier);
                            } else {
                                node = nodeIdentifier;
                            }

                            if (node) {
                                message.action = function () {
                                    $scope.selectedNodeContainer.node = node;
                                    // if (message.propertyPath) {
                                    // //     @TODO add call to focus on provided property
                                    // }
                                };
                            }

                            $scope.validationMessages.push(message);
                        });
                    } else {
                        var message = {
                            type: "error",
                            text: error.message
                        };
                        $scope.validationMessages.push(message);
                    }
                });
            }
        }

        function saveFilesToBuffer(filesToCopyContainer, files){
            fileBuffer.filesToCopyContainer = filesToCopyContainer;
            fileBuffer.files = files;
        }

        function saveOrUpdateModule(saver) {
            let service = saver || componentSaver;
            let propertyFiles = [];
            module.getNodes().forEach(function (node) {
                node.propertyFilesDeferreds.forEach(function (propFileDeferred) {
                    if (propFileDeferred.loadedFile) {
                        propertyFiles.push({
                            config: propFileDeferred.loadedFile.content.config,
                            file: propFileDeferred.file
                        });
                    }
                });
            });

            module.getPropertyFilesLoaders().forEach((l) => {
                if (l.loadedFile !== null) {
                    propertyFiles.push({
                        config: l.loadedFile.content.config,
                        file: l.file
                    });
                }
            });

            service.save(module, loadedWorkflow.path, propertyFiles)
                .then(processComponentSaverResults)
        }

        // pass this function into jsPlumbItem
        function getNodeValidatorFactory(node) {
            var validator = restrictionsServiceInstance.getValidator();
            return function (node) {
                validator.clearErrors();
                return validator.validateErrors('node', [node])
            }
        }

        function validateModuleTransitionRestrictions(jsPlumbConnection) {
            var {newConnection, errors, isValid} = createConnectionInstanceFromJsPlumbConnection(jsPlumbConnection);
            if (!isValid) {
                return {
                    valid: false,
                    errors,
                    warnings: []
                }
            }
            var validator = restrictionsServiceInstance.getValidator();
            var connections = module.getConnections().slice();
            if (newConnection) {
                connections.push(newConnection);
            }

            var transitionValidatingValues = {
                connections: connections
            };

            var transitionsErrorsFound = !validator.validateErrors('transitions', transitionValidatingValues);
            return {
                valid: !(transitionsErrorsFound),
                errors: validator.getErrors(),
                warnings: validator.getWarnings()
            };
        }

        function validateModule(module) {
            var validator = restrictionsServiceInstance.getValidator();
            var nodes = module.getNodes();
            var connections = module.getConnections();

            if (nodes.length === 0) {
                return {
                    valid: true,
                    errors: [],
                    warnings: []
                };
            }

            var schemaWarningsFound = !validator.validateSchema('schema', nodes);

            var nodesErrorsFound = !validator.validateErrors('nodes', nodes);
            var nodesWarningsFound = !validator.validateWarnings('nodes', nodes);

            var connectionValidatingValues = {
                nodes: nodes,
                connections: connections
            };
            var connectionsErrorsFound = !validator.validateErrors('connections', connectionValidatingValues);
            var connectionsWarningsFound = !validator.validateWarnings('connections', connectionValidatingValues);

            var transitionValidatingValues = {
                connections: connections
            };
            var transitionsErrorsFound = !validator.validateErrors('transitions', transitionValidatingValues);

            var nodeInstanceErrorsFound = !validator.validateErrors('node', nodes);

            return {
                valid: !(nodesErrorsFound || connectionsErrorsFound || nodeInstanceErrorsFound || transitionsErrorsFound),
                errors: validator.getErrors(),
                warnings: validator.getWarnings()
            };
        }

        function validateNodeAddition(info) {

            var newNode = {
                "type": info.type,
                "subtype": info.subtype
            };

            var nodesByType = $scope.selectedModule.getNodes().filter(function (node) {
                return info.type === node.type;
            });

            var validator = restrictionsServiceInstance.getValidator();
            var validationNodes = nodesByType.concat(newNode);

            var isValid = validator.validateErrors('nodes', validationNodes);

            return {
                valid: isValid,
                errors: validator.getErrors()
            };
        }

        function validateConnectionAddition(jsPlumbConnection) {
            var {newConnection, errors, isValid} = createConnectionInstanceFromJsPlumbConnection(jsPlumbConnection);
            if (newConnection !== null) {

                // find all connections with nodes participating in the new connection
                var connectionsToValidate = $scope.selectedModule.getConnections().filter(function (connection) {
                    return connection.nodes.from.id === newConnection.nodes.from.id || connection.nodes.to.id === newConnection.nodes.to.id;
                });
                connectionsToValidate.push(newConnection);

                var from = {
                    node: newConnection.nodes.from,
                    connector: newConnection.connectors.from
                };

                var to = {
                    node: newConnection.nodes.to,
                    connector: newConnection.connectors.to
                };

                var validator = restrictionsServiceInstance.getValidator();
                isValid = validator.validateErrorsOnConnection(from, to, connectionsToValidate);
                if (!isValid) {
                    errors = errors.concat(validator.getErrors());
                }
            }

            return {
                valid: isValid,
                errors: errors
            };
        }

        function createConnectionInstanceFromJsPlumbConnection(jsPlumbConnection) {
            if (!jsPlumbConnection) {
                return {newConnection: null, errors: [], isValid: true};
            }
            var isValid = true;
            var errors = [];
            var srcEndpointUuid = jsPlumbConnection.endpointUuids.from;
            var targetEndpointUuid = jsPlumbConnection.endpointUuids.to;

            var connectionConnectorTypes = determineConnectorType(jsPlumbConnection, srcEndpointUuid, targetEndpointUuid);
            var fromEpConnectorType = connectionConnectorTypes.from;

            var newConnection = null;
            try {
                newConnection = connectionFactory.getConnectionInstance(jsPlumbConnection.from, jsPlumbConnection.to, fromEpConnectorType);
            } catch (e) {

                // TODO(maximk): replace with error message thrown by Connection constructor when detailed message will be implemented
                if (!jsPlumbConnection.from.id || !jsPlumbConnection.to.id) {
                    errors.push({message: "Nodes in connection must have valid ids"});
                }
                isValid = false;
            }
            return {newConnection, errors, isValid};
        }
        function removeAlert($event, index) {
            $event.stopPropagation();
            $scope.validationMessages.splice(index, 1);
        }

        function findNodeById(nodeId) {
            var foundNode = null;
            $scope.selectedModule.getNodes().some(function (node) {
                if (node.id === nodeId) {
                    foundNode = node;
                    return true;
                }
            });

            return foundNode;
        }

        function determineConnectorType(connection, srcEndpointUuid, targetEndpointUuid) {
            var fromEp = null;
            connection.from.endpoints.some(function (ep) {
                if (ep.id === srcEndpointUuid) {
                    fromEp = ep;
                    return true;
                }
                return false;
            });

            var toEp = null;
            connection.to.endpoints.some(function (ep) {
                if (ep.id === targetEndpointUuid) {
                    toEp = ep;
                    return true;
                }
                return false;
            });

            console.assert(fromEp && toEp, "Endpoints in connection do not match endpoints on elements");

            return {
                from: fromEp.connectorType,
                to: toEp.connectorType
            };
        }

        function confirmAndRemoveConnection(connection) {
            confirmConnectionDeletion(connection).then(function () {
                // TODO(maximk): refactor this so the removeConnection expects only $connection object
                var connectionExpectedByRemoveConnections = {
                    connection: connection.$connection
                };
                $scope.selectedModule.removeConnections([connectionExpectedByRemoveConnections]);
            });
        }

        function confirmConnectionDeletion(connection) {
            findAlertByOwnerAndCloseIt(connection);

            var def = $q.defer();

            var confirmation = {
                type: "confirm",
                title: alertTitle,
                text: "Do you really want to remove this connection?",
                buttons: [
                    {
                        text: "Yes",
                        style: "action",
                        action: function (close) {
                            close();
                            def.resolve();
                        }
                    },
                    {
                        text: "No",
                        style: "cancel",
                        action: function (close) {
                            close();
                            def.reject();
                        }
                    }
                ]
            };
            var alert = dashboardAlertsManager.addAlertInfo(confirmation);
            addAlertToRemoveAlerts(alert, connection, def);

            return def.promise;
        }

        /**
         * Check if empty node of given type require some preprocessing
         *
         * @param nodeData
         * @returns {*}
         */
        function newEmptyNodePreProcessor(nodeData) {
            /**
             * JSON stringified object
             * @type {string}
             */
            var propertiesString = '';
            var ruleInstance = findCreateFileRule(nodeData);
            if (ruleInstance) {
                return createFileInFolder(ruleInstance).then(function (filePath) {
                    return createPropertyStringFromFile(ruleInstance, filePath);
                });
            } else {
                var deferred = $q.defer();
                deferred.resolve(propertiesString);
                return deferred.promise;
            }
        }

        /**
         * Create default file rule for given node type
         *
         * @param nodeData
         * @returns {*}
         */
        function findCreateFileRule(nodeData) {

            var createFileRule = [
                {
                    groupName: "action",
                    name: "pig",
                    rootNode: "pig",
                    fileNodePrefix: "script",
                    fileNode: "script",
                    fileNodeType: "string",
                    fileNodeExtensionWrapper: function (fileName) {
                        return fileName + ".pig";
                    },
                    dir: "scripts"
                },
                {
                    groupName: "action",
                    name: "hive",
                    rootNode: "",
                    rootNodeBuilder: function (nodeData) {
                        return "hive_" + nodeData.version.replace(/\./g, '_');
                    },
                    fileNodePrefix: "script",
                    fileNode: "script",
                    fileNodeType: "string",
                    fileNodeExtensionWrapper: function (fileName) {
                        return fileName + ".hql";
                    },
                    dir: "scripts"
                },
                {
                    groupName: "action",
                    name: "sub-workflow",
                    rootNode: "sub-workflow",
                    fileNodePrefix: "workflow",
                    fileNode: "app-path",
                    fileNodeType: "string",
                    fileNodeExtensionWrapper: function (fileName) {
                        return fileName + ".xml";
                    },
                    dir: "subworkflow"
                },
                {
                    groupName: "action",
                    name: "shell",
                    rootNode: "",
                    fileNodePrefix: "shell",
                    fileNode: "file",
                    fileNodeType: "array",
                    fileNodeExtensionWrapper: function (fileName) {
                        return fileName;
                    },
                    rootNodeBuilder: function (nodeData) {
                        return "shell_" + nodeData.version.replace(/\./g, '_');
                    },
                    dir: "scripts"
                }
            ];

            var rule = null;
            var ruleExists = createFileRule.some(function (r) {
                if (r.groupName == nodeData.groupName && r.name == nodeData.name) {
                    rule = r;
                    return true;
                }
            });
            if (ruleExists) {
                if (rule.rootNodeBuilder) {
                    rule.rootNode = rule.rootNodeBuilder(nodeData);
                }
                return {
                    rootNode: rule.rootNode,
                    fileNode: rule.fileNode,
                    fileNodeType: rule.fileNodeType,
                    fileNodeExtensionWrapper: rule.fileNodeExtensionWrapper,
                    file: rule.fileNodePrefix,
                    dir: rule.dir
                }
            }
            return null;
        }

        /**
         * Creates property string which contains newly created file
         *
         * @param ruleInstance  {Object}
         * @param filePath {String}
         */
        function createPropertyStringFromFile(ruleInstance, filePath) {
            var propertyObj = {};
            var fileNodeValue;
            propertyObj[ruleInstance.rootNode] = {};
            if (ruleInstance.fileNodeType == "string") {
                fileNodeValue = filePath;
            } else if (ruleInstance.fileNodeType == "array") {
                fileNodeValue = [filePath];
            } else {
                throw "Error: unknown fileNodeType [" + ruleInstance.fileNodeType + "] was found";
            }
            propertyObj[ruleInstance.rootNode][ruleInstance.fileNode] = fileNodeValue;

            return JSON.stringify(propertyObj);
        }

        /**
         * Creates file in demanded folder, if folder doesn't exists,  creates folder
         * @param ruleInstance
         * @returns {*}
         */
        function createFileInFolder(ruleInstance) {
            var targetPath = '/' + ruleInstance.dir + '/' + ruleInstance.file;
            var files = fileManager.getFiles();
            var isTargetDirExists = false;
            var isTargetFileExists = false;
            files.forEach(function (fileItem) {
                if (fileItem.type === 'dir' && fileItem.path === '/' + ruleInstance.dir) {
                    isTargetDirExists = true;
                }
                if (fileItem.type === 'file' && fileItem.path === ruleInstance.fileNodeExtensionWrapper(targetPath)) {
                    isTargetFileExists = true;
                }
            });

            if (!isTargetDirExists) {
                return fileManager.createFolder(ruleInstance.dir)
                    .then(function () {
                        return createFileInExistingFolder(findValidFileName(targetPath, ruleInstance, isTargetFileExists))
                            .catch(function (error) {
                                dashboardAlertsManager.createAlertError(alertTitle, error.message);
                            });
                    }).catch(function (error) {
                        dashboardAlertsManager.createAlertError(alertTitle, error.message);
                    });

            }
            return createFileInExistingFolder(findValidFileName(targetPath, ruleInstance, isTargetFileExists))
                .catch(function (error) {
                    dashboardAlertsManager.createAlertError(alertTitle, error.message);
                });

            function createFileInExistingFolder(path) {
                return fileManager.createFile({path: path, text: ''}).then(function () {
                    /**
                     * Cut starting "/";
                     */
                    return path.substring(0, 1) == "/" ? path.substring(1) : path;
                });
            }

            /**
             * Create file name with pattern:
             *          "targetPath_1"
             *          "targetPath_2"
             *          "targetPath_3"
             *          "targetPath_<next free integer>"
             * @param targetPath
             * @param ruleInstance {Object}
             * @param isTargetFileExists {Boolean}
             * @returns String
             */
            function findValidFileName(targetPath, ruleInstance, isTargetFileExists) {
                if (!isTargetFileExists) {
                    return ruleInstance.fileNodeExtensionWrapper(targetPath);
                }
                var allSimilarFiles = files.filter(function (file) {
                    return file.path.substring(0, targetPath.length) === targetPath;
                });
                var allSimilarFilesLength = allSimilarFiles.length;
                var increment = 1;
                if (allSimilarFilesLength == 0) {
                    return makePathFromIncrement(increment);
                }
                /**
                 * Note Starting from 1
                 * Iterating over "allSimilarFilesLength" possible file names
                 */
                while (increment <= allSimilarFilesLength) {
                    /**
                     * Taking "allSimilarFiles[increment-1]" cause array index starts from 0
                     */
                    var testPath = makePathFromIncrement(increment);
                    if (allSimilarFiles.every(function (file) {
                            return testPath !== file.path;
                        })) {
                        return testPath;
                    }
                    increment++;
                }
                /**
                 * We got case that allSimilar files are targetPath_1 ... targetPath_XX in row,
                 * so next ID will be free
                 */
                return makePathFromIncrement(increment);

                function makePathFromIncrement(increment) {
                    return ruleInstance.fileNodeExtensionWrapper(targetPath + '_' + increment);
                }
            }

        }

        function createNewNode(type, subtype, version, properties, templateId, customProperies) {

            var node = {
                id: (customProperies && customProperies.id) || nodeIdGenerator.getNodeId(subtype, "_", $scope.selectedModule.getNodes()),
                type: type,
                subtype: subtype,
                properties: properties || "",
                templateId: templateId,
                position: {
                    absolute: {
                        x: (customProperies && customProperies.position ? customProperies.position.x + 16 : 0) + 16,
                        y: (customProperies && customProperies.position ? customProperies.position.y + 16 : 0) + 16
                    }
                },
                version: version
            };

            var nodeInstance = null;
            try {
                nodeInstance = nodeFactory.getNodeInstance(node);
            } catch (e) {
                console.log("failed to create node instance because of the error: " + e.message);
            }

            if (nodeInstance !== null) {
                $scope.selectedModule.addNodes([nodeInstance]);
                $scope.selectedNodeContainer.node = nodeInstance;
                $scope.selectedConnection = null;

                if (userSettingsStorage.get("showPropertiesOnNodeCreate") === true) {
                    showNodePropertiesTab();
                }
            }
        }

        function showNodeAddValidationErrors(errors) {
            $scope.validationMessages.length = 0;

            var alerts = [];
            errors.forEach(function (error) {
                var message = {
                    type: "error",
                    title: alertTitle,
                    text: error.message
                };
                alerts.push(message);
            });

            dashboardAlertsManager.addAlerts(alerts);
        }

        function updateWorkflowUsedFilesData(templateId, data) {
            var libs = [];
            data.files.forEach(function (file) {
                if (file.typeKey === "lib") {
                    libs.push(file);
                }
            });

            var template = {
                id: templateId,
                configDefault: data.config,
                // @TODO: verify this part of code, requires investigation
                // coordinatorConfigDefault: data.config, ????????
                libs: libs
            };

            $scope.selectedModule.usedTemplates.push(template);
        }

        function addAlertToRemoveAlerts(alert, owner, deferred) {
            removeAlerts.push({
                alert: alert,
                owner: owner,
                deferred: deferred
            });
        }

        function findAlertByOwnerAndCloseIt(owner) {
            removeAlerts.filter(function (alertContainer) {
                return alertContainer && alertContainer.owner === owner;
            }).forEach(function (alertContainer) {
                dashboardAlertsManager.closeAlert(alertContainer.alert);

                if (alertContainer.deferred) {
                    alertContainer.deferred.reject();
                }
            });
        }


        function clearSelection() {
            // remove selection from nodes
            $scope.$emit("node-deselect.flowchart");
        }

        function copySelection() {
            if (Object.keys($scope.multipleSelectedNodeContainer).length) {
                // store selected nodes in clipboard
                clipboard.save({
                    nodes: $scope.multipleSelectedNodeContainer,
                    files: composeFilesContainer($scope.multipleSelectedNodeContainer, workflowFiles),
                    connections: $scope.selectedModule.getConnections()
                }, 'oozie');
                toggleCopyPasteButtons();
            }
        }

        function pasteSelection() {

            if (!clipboard.isEmptyClipboard('oozie')) {

                var restrictedObjects = [], copiedData = clipboard.restore(false, 'oozie');

                let {nodes, files: filesToCopyContainer, connections: connections} = copiedData;

                var isAtLeastOneNodeCreated = false;

                var oldList = $scope.selectedModule.getNodes(), newNodeList, last;


                Object.keys(nodes).forEach(function (item, idx, arr) {

                    if (nodes[item].type == 'action' && isRestrictedVersion(nodes[item].version, $scope.selectedModule.version)) {

                        restrictedObjects.push('"' + nodes[item].id + '"');

                    } else {
                        isAtLeastOneNodeCreated = true;
                        // created new node from copied data

                        createNewNode(nodes[item].type, nodes[item].subtype, nodes[item].version, nodes[item].properties, nodes[item].id,
                            {
                                id: generatePastedItemId(nodes[item]),
                                position: nodes[item].position
                            });

                        // mark pasted node as selected
                        newNodeList = $scope.selectedModule.getNodes();
                        last = newNodeList[newNodeList.length - 1];

                        $scope.$emit("node-select.flowchart", last, true);
                    }

                    // unmark selected node
                    if ($scope.multipleSelectedNodeContainer[item]) {
                        $scope.$emit("node-select.flowchart", $scope.multipleSelectedNodeContainer[item], true);
                    }

                });
                var diffArr = [];
                for(var i = 0; i < newNodeList.length; i++) {
                    diffArr.push(newNodeList[i]);
                }

                diffArrays(diffArr, oldList, function(elements) {
                    if (Object.keys(elements).length) {
                        var idS = [];

                        elements.forEach(function(node, i, o) {
                            idS.push(node.templateId);
                        });

                        for (var i = 0; i < connections.length; i++) {
                            if (connections[i].from && idS.indexOf(connections[i].from) > -1) {
                                if (idS.indexOf(connections[i].to) > -1){
                                    var connectionObject = {
                                        $connection: {
                                            connectors: {
                                                from: connections[i].connector,
                                                to: "in"
                                            }
                                        },
                                        connectors: {
                                            from: connections[i].connector,
                                            to: "in"
                                        },
                                        endpoints: "",
                                        endpointUuids: {
                                            from: "",
                                            to: ""
                                        },
                                        nodes: {
                                            from: {
                                                id: ""
                                            },
                                            to: {
                                                id: ""
                                            }
                                        }
                                    };
                                    for (var j = 0; j < elements.length; j++) {
                                        if (idS.indexOf(elements[j].templateId > -1) && elements[j].templateId === connections[i].from){
                                            connectionObject.from = elements[j];
                                            connectionObject.nodes.from.id = elements[j].id;
                                            connectionObject.endpointUuids.from = generateUUID();
                                        }
                                        if (idS.indexOf(elements[j].templateId > -1) && elements[j].templateId === connections[i].to){
                                            connectionObject.to = elements[j];
                                            connectionObject.nodes.to.id = elements[j].id;
                                            connectionObject.endpointUuids.to = generateUUID();
                                        }
                                    }

                                    $scope.copyConnection(connectionObject);
                                }
                            }
                        }

                    }

                });


                //start background FILE COPY process if needed
                if (isAtLeastOneNodeCreated && filesToCopyContainer) {
                    let {files} = filesToCopyContainer;
                    if (files && files.length) {
                        saveFilesToBuffer(filesToCopyContainer, files);
                    }
                }

                toggleCopyPasteButtons();

                if (restrictedObjects.length) {
                    var message = {
                        type: "error",
                        title: "Version restriction",
                        text: 'Incompatible schema version for next oozie action(s) : ' + restrictedObjects.join(', '),
                        delay: 5000,
                        buttons: [
                            {
                                text: "OK",
                                style: "cancel",
                                action: function (close) {
                                    close();
                                }
                            }
                        ]
                    };
                    dashboardAlertsManager.addAlerts([message]);
                }
            }

        }

        function toggleCopyPasteButtons() {
            var copyBtn = $scope.params.page.controls[$scope.params.page.findControlByName('copy-button')],
                pasteBtn = $scope.params.page.controls[$scope.params.page.findControlByName('paste-button')];

            pasteBtn.hidden = clipboard.isEmptyClipboard('oozie');
            copyBtn.hidden = angular.equals({}, $scope.multipleSelectedNodeContainer);
        }

        /**
         * Creates object which holds files list and source identification
         *
         * @param nodeList
         * @param workflowFiles
         */
        function composeFilesContainer(nodeList, workflowFiles) {
            return angular.extend({}, {isTenantComponent}, convertSourceToFlat(source), {files: fetchFilesToCopy(nodeList, workflowFiles)});
        }

        /**
         * 1) Cause source will be converted into JSON String, removing all not needed data
         * 2) "template" [isTenantComponent == true] and "deployed component" [isTenantComponent == false]
         *      need different identification on server
         * @param source
         * @returns Object
         */
        function convertSourceToFlat(source) {
            if (source.isTenantComponent) {
                /*
                 POST /module/oozie-web/api/v1.0/template/workflows/<id>?operation=copy
                 {
                 "templateId" : 4,
                 "files" : ["hive-site.xml"]
                 }
                 */

                return {templateId: source.componentId};
            } else {
                /*
                 POST /module/oozie-web/api/v1.0/platforms/<id>/clusters/<id>/services/<id>/workflows/<path>?operation=copy
                 {
                 "platformId" : 1,
                 "clusterId" : "Cluster1",
                 "serviceId" : "HDFS",
                 "moduleId" : "/app/workflow"
                 "files" : ["hive-site.xml", "t2.txt"]
                 }
                 */

                let {
                    platform: {id: platformId},
                    cluster: {id: clusterId},
                    service: {id: serviceId},
                    module: {id: moduleId}
                    } = source;
                return {platformId, clusterId, serviceId, moduleId}
            }
        }

        /**
         * Find all files which should be copied
         * @param nodeList
         * @param workflowFiles
         * @returns {Array.<T>}
         */
        function fetchFilesToCopy(nodeList, workflowFiles) {
            var foundFiles = [];
            if (nodeList) {
                Object.keys(nodeList).forEach(function (nodeName) {
                    var node = nodeList[nodeName];
                    if (node.properties) {
                        Object.keys(node.properties).forEach(function (jsonSchemaPropertyName) {
                            var jsonSchemaProperty = node.properties[jsonSchemaPropertyName];
                            foundFiles = foundFiles.concat(scanJsonSchemaPropertyForFiles(jsonSchemaProperty));
                        });
                    }
                });
            }

            let noForwardSlashFiles = workflowFiles.filter(fileObj => (fileObj.type == "file" && fileObj.path != ""))
                .map(fileObj => fileObj.path.replace(/^[\\/]+/, ''));

            // @TODO: implement variable parsing like "${homedir}/scripts/test.sh"
            return noForwardSlashFiles.filter(function (fileName) {
                return foundFiles.indexOf(fileName) > -1;
            });
        }

        /**
         * Scan jsonSchema object for files
         * @param property
         * @returns Array
         */
        function scanJsonSchemaPropertyForFiles(property) {
            return types.fetchFlatValuesFromJsonSchemaInstanceUsingFunctor(property,
                    schema => schema.isFileRef === true);
        }

        function isRestrictedVersion(source, target) {
            var res = false, versions = [source, target];

            if (source != target) {

                versions.sort(function (item1, item2) {
                    var i, leftItem, rightItem, leftArray = (item1 || "").split("."),
                        rightArray = (item2 || "").split(".");

                    for (i = 0; i < Math.max(leftArray.length, rightArray.length); i++) {
                        leftItem = parseInt(leftArray[i]) || 0;
                        rightItem = parseInt(rightArray[i]) || 0;
                        if (leftItem < rightItem) {
                            return -1;
                        }
                        if (leftItem > rightItem) {
                            return 1;
                        }
                    }
                    return 0;
                });

                return versions.indexOf(target) < versions.indexOf(source);

            } else {

                return false;

            }
        }

        function generatePastedItemId(node) {
            var newId, currentCopyNumber, clearNodeId = node.id.replace(/_copy\(\d{1,}\)/, ''),
                nodes = $scope.selectedModule.getNodes(), nodeCounter = 0;

            nodes.forEach(function (item) {
                currentCopyNumber = item.id.indexOf(clearNodeId);
                if (item.type == node.type && item.subtype == node.subtype && currentCopyNumber > -1) {
                    nodeCounter++;
                }
            });

            if (/_copy\(\d{1,}\)/.exec(node.id)) {
                //'_copy(' + nodeCounter + ')' cause restriction while saving, changed to '_copy_' + nodeCounter
                newId = node.id.replace(/_copy\(\d\)/g, '_copy_' + nodeCounter);
            } else {
                newId = node.id + '_copy_' + nodeCounter;
            }

            return newId;
        }

        function removeSelectionFromNodes() {
            Object.keys($scope.multipleSelectedNodeContainer).forEach(function (item, idx, arr) {
                $scope.multipleSelectedNodeContainer[item].isMultipleSelected = false;
                delete $scope.multipleSelectedNodeContainer[item];
            });
        }

        function diffArrays (diffArr, oldArr, callback) {

            callback = callback || function(){};

            let index = null;

            for (var i=0; i < oldArr.length; i++) {
                index = diffArr.indexOf(oldArr[i]);
                if (index > -1) {
                    diffArr.splice(index, 1);
                }
            }
            callback(diffArr);
        }

        function deleteNode() {
            var nodeArray = [];
            if (Object.keys($scope.multipleSelectedNodeContainer).length > 1) {
                nodeArray = $scope.multipleSelectedNodeContainer;
            } else {
                if ($scope.selectedNodeContainer && $scope.selectedNodeContainer.node) {
                    nodeArray = $scope.selectedNodeContainer;
                }
            }
            $scope.$broadcast("node-hotkey-remove.flowchart", nodeArray);
        }
    }
});
