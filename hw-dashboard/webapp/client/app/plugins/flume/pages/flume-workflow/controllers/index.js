/*jshint maxparams:15*/
define(function (require) {
    "use strict";

    var ng = require("angular");
    var $ = require("jquery");
    require('../ngModule').controller('flume.pages.FlumeWorkflowController', indexController);

    indexController.$inject = [
        '$scope',
        '$q',
        '$widgetParams',
        'flume.restService',
        'platform.restService',
        'restrictionsService',
        'dap.main.models.Module',
        'flume.services.nodeFactory',
        'oozie.services.connectionFactory',
        'dashboard.models.PageControl',
        'main.alerts.alertsManagerService',
        'nodesMetadata',
        'nodeIdGenerator',
        'dashboard.models.TabPage',
        'flumeModule',
        '$timeout',
        "dashboard.WidgetsActions",
        'core.get-file-uploader',
        'file-browser.file-helper',
        'dashboard-isolated-widget-accessor.WidgetStore',
        'dashboard-isolated-widget-accessor.WidgetActions',
        'userSettings.storage',
        'core.utils'
    ];
    function indexController($scope, $q, $widgetParams, flumeRestService, platformRestService, restrictionsService,
                             Module, nodeFactory, connectionFactory, PageControl, dashboardAlertsManager, nodesMetadata,
                             nodeIdGenerator, TabPage, flumeModule, $timeout, WidgetsActions, getFileUploader,
                             fileHelper, WidgetStore, WidgetAccessorActions, userSettingsStorage, utils) {
        if (!flumeModule) {
            $scope.loadDataError = true;
            $scope.goToTextTab = $widgetParams.params.openTextTabView;
            return;
        }

        var dashboardWidget = WidgetStore.getWidget();
        var page = $widgetParams.page;
        var file = $widgetParams.params.file;
        var agent = $widgetParams.params.agent;
        var isTenantComponent = $widgetParams.params.isTenantComponent;
        var removeAlerts = [];
        var alertTitle = dashboardWidget.title;
        var componentSaver = $widgetParams.params.componentSaver;

        var clipboard = utils.clipboard();

        /**
         * For Hortonworks (HDP) plugin dir is readonly
         * @type {boolean}
         */
        var isPluginDirReadonly = $widgetParams.params.isPlatformHDP;

        var tabIndexes = {
            alerts: -1,
            addNode: -1,
            nodeProperties: -1,
            libs: -1
        };

        //scope properties
        ng.extend($scope, {
            /*service instances' provisioning*/
            showInstancesPreloader: false,
            /*flume workflow tab*/
            showWorkflowPreloader: false,
            // data shared between widgets
            selectedModule: flumeModule,
            metrics: {},
            isAutoRefresh: false,
            refreshInterval: 5000,
            dashboardWidgetContainer: {
                dashboardWidget: dashboardWidget
            },
            moduleConnections: [],
            selectedNodeContainer: {
                node: null
            },
            multipleSelectedNodeContainer: {},
            selectedConnection: null,
            nodesMetadata: nodesMetadata,

            validationMessages: [],
            nodeValidatorCallback: getNodeValidatorFactory(),
            widgets: {
                workflow: {
                    active: true
                },
                nodeSelector: {
                    active: false
                },
                optionsEditor: {
                    active: false
                },
                alertsContainer: {
                    active: false
                }
            },
            splitWidgets: false,
            fileUploader: getFileUploader.create({
                onAfterAddingFile: function (fileItem) {
                    var urlContainer = {
                        path: 'lib/',
                        file: fileItem
                    };
                    $scope.$emit('upload-file.file-browser', urlContainer);
                }
            })
        });

        //scope methods
        ng.extend($scope, {
            removeAlert: function ($event, index) {
                $event.stopPropagation();
                $scope.validationMessages.splice(index, 1);
            },

            // callbacks shared with flowchart widget to manage nodes and connections of a selected module
            addNewNode: function (type, subtype, properties, customProperies) {
                var node = {
                    "id": (customProperies && customProperies.id) || nodeIdGenerator.getNodeId(subtype, "_", $scope.selectedModule.getNodes()),
                    "type": type,
                    "subtype": subtype,
                    "properties": properties || "",
                    "position": {
                        absolute: {
                            x: (customProperies && customProperies.position ? customProperies.position.x + 16 : 0) + 16,
                            y: (customProperies && customProperies.position ? customProperies.position.y + 16 : 0) + 16
                        }
                    }
                };

                var nodeInstance = null;
                try {
                    nodeInstance = nodeFactory.getNodeInstance(true, node);
                } catch (e) {
                    console.log("failed to create node instance because of the error: " + e.message);
                }

                if (nodeInstance !== null) {
                    var isValid = validateNodeAddition(nodeInstance);
                    if (isValid) {
                        $scope.selectedModule.addNodes([nodeInstance]);
                        $scope.selectedNodeContainer.node = nodeInstance;
                        $scope.selectedConnection = null;
                        if (userSettingsStorage.get("showPropertiesOnNodeCreate") === true) {
                            showNodePropertiesTab();
                        }
                    } else {
                        console.log("Node is invalid");
                    }
                }
            },
            addNewConnection: function (connection) {
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
            },
            removeNode: function (node) {
                $scope.selectedModule.removeNodes([node]);
                $scope.selectedNodeContainer.node = null;

                delete $scope.multipleSelectedNodeContainer[node.id];
            },
            removeConnection: function (connection) {
                $scope.selectedModule.removeConnections([connection]);
            },

            deleteConnectionRequest: function (connection) {
                confirmAndRemoveConnection(connection);
            }
        });

        init();

        //setup functions
        function init() {
            WidgetAccessorActions.updateWidgetHotkeyBindings(clipboard.hotkeyBindings({
                    copySelection: copySelection,
                    pasteSelection: pasteSelection,
                    clearSelection: clearSelection,
                    deleteNode: deleteNode
                }));

            setupWidgetControls();
            bindToWidgetsEvents();
            startTimers();
        }

        function setupWidgetControls() {
            var saveModuleBtn = PageControl.factory({
                type: 'button',
                icon: 'b-flume-plugin__flowchart-widget__save-icon',
                label: '',
                tooltip: 'Save',
                enable: true,
                action: saveModule,
                styleAsTab: false
            });

            var refreshMetricsBtn = PageControl.factory({
                type: 'button',
                icon: 'b-flume-plugin__flowchart-widget__refresh-icon',
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
                icon: 'b-flume-plugin__flowchart-widget__copy-icon',
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
                icon: 'b-flume-plugin__flowchart-widget__paste-icon',
                css: '',
                enable: true,
                hidden: true,
                styleAsTab: false,
                action: pasteSelection
            });

            page.addControl(saveModuleBtn);
            page.addControl(refreshMetricsBtn);
            page.addControl(copyControl);
            page.addControl(pasteControl);

            var nodePropertiesPage = TabPage.factory({
                name: 'flume-node-properties',
                params: {
                    nodesMetadata: nodesMetadata,
                    removeConnection: confirmAndRemoveConnection,
                    deleteConnectionRequest: confirmAndRemoveConnection,
                    module: $scope.selectedModule,
                    agent: agent,
                    isPluginDirReadonly: isPluginDirReadonly
                }
            });

            var sharedActions = $widgetParams.params.sharedActions;
            var pullFnValid = sharedActions && ng.isFunction(sharedActions.pullLibraries);
            var pushFnValid = sharedActions && ng.isFunction(sharedActions.pushLibraries);
            var enablePushPull = pullFnValid && pushFnValid;
            var uploadedLibsPage = TabPage.factory({
                name: 'uploaded-libs',
                params: {
                    fileManager: $widgetParams.params.fileManager,
                    enablePushPull: enablePushPull,
                    actions: {
                        pullLibraries: pullFnValid ? sharedActions.pullLibraries : null,
                        pushLibraries: pushFnValid ? sharedActions.pushLibraries : null
                    }
                }
            });


            nodePropertiesPage.on('pageLoadSuccess', function () {
                nodePropertiesPage.notifySubscribers('flume-node-selected', $scope.selectedNodeContainer.node);
                nodePropertiesPage.notifySubscribers('flume-connection-selected', $scope.selectedConnection);
            });
            $scope.$watch('selectedNodeContainer.node', function (node) {
                nodePropertiesPage.notifySubscribers('flume-node-selected', node);
            });
            $scope.$watch('selectedConnection', function (connection) {
                nodePropertiesPage.notifySubscribers('flume-connection-selected', connection);
            });
            $scope.$watch(function () {
                return Object.keys($scope.multipleSelectedNodeContainer).length > 0;
            }, function () {
                toggleCopyPasteButtons();
            } );

            var addNodePage = TabPage.factory({
                name: 'flume-add-node',
                params: {
                    nodesMetadata: nodesMetadata,
                    addNewNode: $scope.addNewNode
                }
            });

            var alertsPage = TabPage.factory({
                name: 'flume-alerts',
                params: {
                    validationMessages: $scope.validationMessages,
                    removeAlert: $scope.removeAlert
                }
            });

            tabIndexes.addNode = page.rightTabManager.addTab(addNodePage, '', 'Add Node', 'b-flume-plugin__node-selector-widget__icon', true);
            tabIndexes.nodeProperties = page.rightTabManager.addTab(nodePropertiesPage, '', 'Properties', 'b-flume-plugin__options-editor-widget__icon', true);
            tabIndexes.alerts = page.rightTabManager.addTab(alertsPage, '', 'Alerts', 'b-flume-plugin__alerts-container-widget__icon', true);
            tabIndexes.libs = page.rightTabManager.addTab(uploadedLibsPage, '', 'Libraries', 'b-flume-plugin__libraries-widget__icon', true);

            page.rightTabManager.setActive(tabIndexes.nodeProperties);
        }

        function bindToWidgetsEvents() {
            // bind to widget events (syntax is "eventname.widgetname") to conduct validation
            $scope.$on("nodeadd.nodeselector", function (event, data) {
                var result = validateNodeAddition(data.info);
                if (!result.valid) {
                    event.preventDefault();
                }

                var messagesCount = $scope.validationMessages.length;
                $scope.validationMessages.splice(0, messagesCount);

                var errors = [];
                result.errors.forEach(function (error) {
                    var message = {
                        type: "error",
                        title: alertTitle,
                        text: error.message
                    };
                    errors.push(message);
                });

                dashboardAlertsManager.addAlerts(errors);

            });

            $scope.$on("connectionadd.flowchart", function (event, connection) {
                var result = validateConnectionAddition(connection);

                if (!result.valid) {
                    event.preventDefault();
                }

                var messagesCount = $scope.validationMessages.length;
                $scope.validationMessages.splice(0, messagesCount);

                var errors = [];
                result.errors.forEach(function (error) {
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

            $scope.$on("connection-moved.flowchart", function(event, {info, connection}){
                event.stopPropagation();

                try {
                    var c = $scope.selectedModule.getConnections();
                    c.forEach(function(v, i, con){
                        if (con[i].$connection["id"] === info.connection["id"]) {
                            c.splice(i, 1);
                        }
                    });
                } catch(e) {
                    console.log(e);
                }

            });

            $scope.$on("connection-select.flowchart", function (event, jsPlumbConnection) {
                event.stopPropagation();

                $scope.selectedNodeContainer.node = null;

                var connection = null;
                $scope.selectedModule.getConnections().some(function (c) {
                    if (c.$connection === jsPlumbConnection) {
                        connection = c;
                        return true;
                    } else {
                        return false;
                    }
                });

                $scope.selectedConnection = connection;

                console.assert(connection !== null, "No matching connection for jsPlumbConnection found");
            });

            // TODO(maximk): this function seems to be redundant and is never called - check
            $scope.$on("connection-deselect.flowchart", function (event, jsPlumbConnection) {
                event.stopPropagation();

                $scope.selectedConnection = null;
            });

            $scope.$on("connection-remove.flowchart", function(event, jsPlumbConnection) {
                event.stopPropagation();
                confirmAndRemoveConnection(jsPlumbConnection);
                $scope.selectedConnection = null;
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

            $scope.$on("node-deselect.flowchart", function (event) {
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

            var renderedNodesCount = 0;
            $scope.$on("endpoints-configured.js-plumb-item", function (event) {
                event.stopPropagation();

                renderedNodesCount += 1;
                if ($scope.selectedModule.getNodes().length === renderedNodesCount) {
                    $scope.moduleConnections = $scope.selectedModule.getConnections();
                }
            });

            $scope.$on("node-double-clicked", function (event, node) {
                if (node.type === "sink" && isTenantComponent !== true) {
                    event.preventDefault();

                    var pathToHdfsRaw = undefined;
                    node.properties.some(function (property) {
                        if (property.key === "hdfs.path") {
                            pathToHdfsRaw = property.value;
                            return true;
                        } else {
                            return false;
                        }
                    });

                    try {
                        var nodeMissingHdfsPathProperty = pathToHdfsRaw === undefined;
                        if (nodeMissingHdfsPathProperty) {
                            // sink is selected but not `hdfs` subtype - do nothing
                            return;
                        } else if (pathToHdfsRaw === null) {
                            throw new Error();
                        }

                        // expected hdfs.path format:
                        // `hdfs://${nameNode}/${hdfs.path.error.data}/year=%Y/month=%m/day=%d/hour=%H`
                        var pathRaw = pathToHdfsRaw.replace(/^hdfs:\/\//, "").split("/").slice(1).join("/").split("%")[0];

                        if (pathRaw === "" || pathRaw.lastIndexOf("/") === -1) {
                            throw new Error();
                        }

                        var pathEndingCharIndex = pathRaw.lastIndexOf("/");
                        var path = "/" + pathRaw.substr(0, pathEndingCharIndex);

                        WidgetsActions.addWidget({
                            widgetName: 'hdfs-manager',
                            params: {
                                src: {
                                    platform: $widgetParams.params.source.platform,
                                    cluster: $widgetParams.params.source.cluster,
                                    path: path
                                }
                            }
                        }, {top: true});
                    } catch (e) {
                        dashboardAlertsManager.addAlertError({
                            title: "HDFS path parsing error",
                            text: "An error occurred when parsing the `hdfs.path` property of the node. " +
                            "Please make sure that it has the following format: hdfs://${nameNode}/${hdfs.path.error.data}"
                        });
                    }
                } else {
                    // do nothing
                }
            });

            $scope.$on("tenant-flume-template.save-component", function (event, saver) {
                saveOrUpdateModule(saver);
            });

            $scope.$on("$destroy", function () {
                $scope.isAutoRefresh = false;
            });
        }

        function startTimers() {
            if (!isTenantComponent) {
                fetchMetricsRequest();
            }
        }

        function fetchMetricsRequest() {
            return flumeRestService.getMetrics($widgetParams.params.source).then((metrics) => {

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

        //help functions
        function showAlertsTab() {
            page.rightTabManager.setActive(tabIndexes.alerts);
        }

        function showNodePropertiesTab() {
            page.rightTabManager.setActive(tabIndexes.nodeProperties);
        }

        function showAddNodeTab() {
            page.rightTabManager.setActive(tabIndexes.addNode);
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
                    saveOrUpdateModule();
                }
            } else {
                showErrors(result.errors);
                showAlertsTab();
            }

            function showWarnings(warnings) {
                warnings.forEach(function (warnings) {

                    var warningCommonForManyNodes = !ng.isUndefined(warnings.invalidNodeIds) && warnings.invalidNodeIds.length > 0;

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

            function showErrors(errors) {
                errors.forEach(function (error) {

                    // TODO(maximk): refactor so that all rules can return only `invalidNodes` property
                    var hasInvalidNodeIds = !ng.isUndefined(error.invalidNodeIds) && error.invalidNodeIds.length > 0;
                    var hasInvalidNodes = !ng.isUndefined(error.invalidNodes) && error.invalidNodes.length > 0;
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

        function saveOrUpdateModule(saver) {
            let service = saver || componentSaver;
            let agentToSave = {};
            // agent is not processed for tenant flume
            if (agent) {
                agentToSave = {
                    agentName: flumeModule.agentName,
                    name: agent.name,
                    pluginDir: agent.pluginDir
                };
            }

            service.save(flumeModule, file.path, agentToSave).then(processComponentSaverResults);
        }

        function processComponentSaverResults(results) {
            results.resolved.forEach((operation) => {
                if (!operation.hideSuccessNotification) {
                    dashboardAlertsManager.addAlertSuccess({
                        title: "Component save success",
                        text: `The ${operation.name} has been successfully saved`
                    })
                }
            });

            results.rejected.forEach((operation) => {
                if (!operation.hideErrorNotification) {
                    dashboardAlertsManager.addAlertError({
                        title: "Component save error",
                        text: `The ${operation.name} has not been saved because of the error: ${operation.reason}`
                    });
                }
            });
        }


        function confirmAndDeleteModule() {
            var module = $scope.selectedModule;

            // confirm deletion
            dashboardAlertsManager.addAlerts([
                {
                    type: "confirm",
                    title: alertTitle,
                    text: "Do you really want to delete the module with id " + (module.id ? module.id : module.name) + " ?",
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
                flumeRestService.removeModule(module.source).then(function () {
                    var successMsg = {
                        type: "success",
                        title: alertTitle,
                        text: "Module " + module.id + " has been successfully deleted"
                    };

                    dashboardAlertsManager.addAlertSuccess(successMsg);
                    WidgetsActions.removeWidget(dashboardWidget, true);
                });
            }
        }

        // pass this function into jsPlumbItem
        function getNodeValidatorFactory(node) {
            var validator = restrictionsService.getValidator();
            return function (node) {
                validator.clearErrors();
                return validator.validateErrors('node', [node])
            }
        }

        function validateModule(module) {
            var validator = restrictionsService.getValidator();
            var nodes = module.getNodes();
            var connections = module.getConnections();

            var nodesErrorsFound = !validator.validateErrors('nodes', nodes);
            var nodesWarningsFound = !validator.validateWarnings('nodes', nodes);

            var connectionValidatingValues = {
                nodes: nodes,
                connections: connections
            };
            var connectionsErrorsFound = !validator.validateErrors('connections', connectionValidatingValues);
            var connectionsWarningsFound = !validator.validateWarnings('connections', connectionValidatingValues);

            var nodeInstanceErrorsFound = !validator.validateErrors('node', nodes);

            return {
                valid: !(nodesErrorsFound || connectionsErrorsFound || nodeInstanceErrorsFound),
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

            var validator = restrictionsService.getValidator();
            var validationNodes = nodesByType.concat(newNode);

            var isValid = validator.validateErrors('nodes', validationNodes);

            return {
                valid: isValid,
                errors: validator.getErrors()
            };
        }

        function validateConnectionAddition(jsPlumbConnection) {
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
                isValid = false;

                // TODO(maximk): replace with error message thrown by Connection constructor when detailed message will be implemented
                if (!jsPlumbConnection.from.id || !jsPlumbConnection.to.id) {
                    errors.push({message: "Nodes in connection must have valid ids"});
                }
            }

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

                var validator = restrictionsService.getValidator();
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
                $scope.selectedConnection = null;
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
                clipboard.save(angular.extend({}, $scope.multipleSelectedNodeContainer), 'flume');
                toggleCopyPasteButtons();
            }
        }

        function pasteSelection() {

            if (!clipboard.isEmptyClipboard('flume')) {

                var  copiedData = clipboard.restore(false, 'flume');

                Object.keys(copiedData).forEach(function (item, idx, arr) {

                    // created new node from copied data
                    $scope.addNewNode(copiedData[item].type, copiedData[item].subtype, copiedData[item].properties,
                        {id: generatePastedItemId(copiedData[item]), position: copiedData[item].position});

                    // mark pasted node as selected
                    var newNodeList = $scope.selectedModule.getNodes(), last = newNodeList[newNodeList.length - 1];
                    $scope.$emit("node-select.flowchart", last, true);


                    // unmark selected node
                    if ($scope.multipleSelectedNodeContainer[item]) {
                        $scope.$emit("node-select.flowchart", $scope.multipleSelectedNodeContainer[item], true);
                    }

                });

                toggleCopyPasteButtons();

            }

        }

        function toggleCopyPasteButtons() {
            var copyBtn = $scope.params.page.controls[$scope.params.page.findControlByName('copy-button')],
                pasteBtn = $scope.params.page.controls[$scope.params.page.findControlByName('paste-button')];

            pasteBtn.hidden = clipboard.isEmptyClipboard('flume');
            copyBtn.hidden = angular.equals({}, $scope.multipleSelectedNodeContainer);
        }

        function generatePastedItemId(node) {
            var newId, currentCopyNumber, clearNodeId = node.id.replace(/_copy\(\d{1,}\)/, ''),
                nodes = $scope.selectedModule.getNodes(), nodeCounter = 0;

            nodes.forEach(function(item){
                currentCopyNumber = item.id.indexOf(clearNodeId);
                if (item.type == node.type && item.subtype == node.subtype && currentCopyNumber > -1) {
                    nodeCounter++;
                }
            });
            //'_copy(' + nodeCounter + ')' cause restriction while saving, changed to '_copy_' + nodeCounter
            if (/_copy\(\d{1,}\)/.exec(node.id)) {
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
