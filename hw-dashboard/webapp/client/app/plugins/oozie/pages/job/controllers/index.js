/*jshint maxparams:19*/
define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').controller('oozie.page.JobController', JobController);

    JobController.$inject = [
        '$scope',
        "jobModule",
        '$widgetParams',
        '$timeout',
        'oozie.models.Job',
        'dashboard.models.TabPage',
        'oozie.job-rest-service',
        'oozie.restService',
        'dashboard-isolated-widget-accessor.WidgetStore',
        "dashboard.models.TabPage.EVENTS"
    ];

    function JobController($scope, jobModule, $widgetParams, $timeout, Job, TabPage, restService, oozieRestService, WidgetStore, TabPageEvents) {
        var alertsPage;
        var nodePropertiesPage;
        var logPage;
        var jobId = $widgetParams.params.jobId;
        var source = $widgetParams.params.source;
        var coordinator = $widgetParams.params.coordinator;

        var dashboardWidget = WidgetStore.getWidget();
        var alertTitle = dashboardWidget.title;
        var rightTabLogIndex = -1;

        ng.extend($scope, {
            alertTitle: alertTitle,
            isTabActive: true,
            workflowNodeTemplates: [],
            job: Job.factory({id: jobId}),
            jobActions: {},
            metrics: {},
            refreshIntervalTimeout: null,
            isAutoRefresh: false,
            refreshInterval: 5000,
            page: $widgetParams.params.page,
            selectedModule: jobModule,
            dashboardWidgetContainer: {
                dashboardWidget: dashboardWidget
            },
            selectedNodeContainer: {
                node: null
            },
            validationMessages: [],
            nodeValidatorCallback: false,
            selectedConnection: null,
            moduleConnections: []
        });

        $scope.page.on(TabPageEvents.ACTIVE_STATE_CHANGE, function (event, active) {
            if (active) {
                coordinator.registerActiveJob($scope.job);
            } else {
                coordinator.deregisterActiveJob($scope.job);
            }
            $scope.isTabActive = active;
        });

        $scope.page.on(TabPageEvents.BEFORE_PAGE_REMOVE, function (event) {
            coordinator.deregisterActiveJob($scope.job);
            $scope.isTabActive = false;
        });

        $scope.$on('$destroy', function () {
            coordinator.deregisterActiveJob($scope.job);
            deregisterJobsUpdatedListener();
        });

        init();

        function init() {
            setUpControls();
            startWatchingScope();
            startTimers();

            coordinator.registerActiveJob($scope.job);
        }

        function setUpControls() {

            nodePropertiesPage = TabPage.factory({
                name: 'oozie-node-properties',
                params: {
                    node: $scope.selectedNodeContainer.node,
                    connection: $scope.selectedConnection,
                    configDefaultFile: $widgetParams.params.configDefaultFile,
                    module: $scope.selectedModule,
                    readonly: true
                }
            });


            alertsPage = TabPage.factory({
                name: 'oozie-alerts',
                params: {
                    validationMessages: [],
                    removeAlert: null
                }
            });

            logPage = TabPage.factory({
                name: 'oozie-job-log',
                params: {
                    jobId: jobId,
                    actionMetaGetter: function () {
                        return composeActionLogMeta($scope.selectedNodeContainer.node)
                    },
                    checkIfParentTabActive: function () {
                        return $widgetParams.params.checkIfTabActive();
                    },
                    checkIfTabActive: function () {
                        return rightTabLogIndex == $widgetParams.page.rightTabManager.getActive();
                    }
                }
            });

            $widgetParams.page.rightTabManager.addTab(nodePropertiesPage, '', 'Properties', 'b-oozie-plugin__options-editor-widget__icon', true);
            $widgetParams.page.rightTabManager.addTab(alertsPage, '', 'Errors', 'b-oozie-plugin__alerts-container-widget__icon', true);
            rightTabLogIndex = $widgetParams.page.rightTabManager.addTab(logPage, '', 'Log', 'b-oozie-plugin__log-container-widget__icon', true);

            alertsPage.on('pageLoadSuccess', function () {
                updateActionContainer($scope.selectedNodeContainer.node);
            });
        }

        function startWatchingScope() {
            var unwatchers = [];
            // workaround to address jsPlumb requirement to have nodes drawn when configuring endpoints
            var renderedNodesCount = 0;
            onScope("endpoints-configured.js-plumb-item", function (event) {
                event.stopPropagation();

                renderedNodesCount += 1;
                if ($scope.selectedModule.getNodes().length === renderedNodesCount) {
                    $scope.moduleConnections = $scope.selectedModule.getConnections();
                }
            });

            onScope("connection-select.flowchart", function (event, jsPlumbConnection) {
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

            onScope("connection-deselect.flowchart", function (event, jsPlumbConnection) {
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

            onScope("node-select.flowchart", function (event, node) {
                event.stopPropagation();

                $scope.selectedNodeContainer.node = node;
            });

            onScope("node-deselect.flowchart", function (event, data) {
                event.stopPropagation();
                $scope.selectedNodeContainer.node = null;
            });

            onScope("node-double-clicked", function (event, node) {
                event.stopPropagation();
                $widgetParams.page.rightTabManager.setActive(rightTabLogIndex);
            });

            $scope.$on("$destroy", function () {
                $scope.isAutoRefresh = false;
            });

            watchScope('job', function (newJob) {
                if (newJob) {
                    $scope.jobActions = newJob.actions.reduce(function (container, action) {
                        // hack for converting ':start:' into 'start' nodename
                        var actionName = action.name === ':start:' ? 'start' : action.name;
                        container[actionName] = action;
                        return container;
                    }, {});
                } else {
                    $scope.jobActions = {};
                }
            });

            watchScope('selectedNodeContainer.node', updateActionContainer);

            return function () {
                unwatchers.forEach(function (unwatch) {
                    unwatch();
                });
            };

            function onScope() {
                unwatchers.push($scope.$on.apply($scope, arguments));
            }

            function watchScope() {
                unwatchers.push($scope.$watch.apply($scope, arguments));
            }
        }

        let deregisterJobsUpdatedListener = coordinator.on('jobs-updated', function (event, jobs) {
            if ($scope.isTabActive) {
                jobs.forEach(function (job) {
                    if (job.id === $scope.job.id) {
                        $scope.job = job;
                    }
                })
            }
        });

        function startTimers() {
            fetchMetricsRequest();
        }

        function fetchMetricsRequest() {

            return oozieRestService.getMetrics($widgetParams.params.source).then((metrics) => {
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

        function updateActionContainer(node) {
            updateActionProperties(node);
            updateActionErrors(node);
            updateActionLog(node);
        }

        /**
         * Componse Data for selected "action node" to pass into log widget
         *
         * @param node
         * @returns {{isNodeSelected: boolean, internalId: null, externalId: null}}
         */
        function composeActionLogMeta(node) {
            var selectedActionMeta = {
                isNodeSelected: !!node,
                internalId: null,
                externalId: null
            };
            if ($scope.jobActions && node) {
                var action = $scope.jobActions[node.id];
                if (action) {
                    selectedActionMeta.internalId = action.id;
                    selectedActionMeta.externalId = action.externalId;
                }
            }
            return selectedActionMeta;
        }

        function updateActionLog(node) {
            logPage.notifySubscribers('log-action-changed', composeActionLogMeta(node));
        }

        function updateActionErrors(node) {
            var selectedActionErrors = [];
            if ($scope.jobActions && node) {
                var action = $scope.jobActions[node.id];
                if (action && action.errorMessage) {
                    selectedActionErrors = [action.errorMessage].map(function (error) {
                        return {
                            type: 'error',
                            text: error
                        };
                    });
                }
            }
            alertsPage.notifySubscribers('validation-messages-updated', selectedActionErrors);
        }

        function updateActionProperties(node) {
            nodePropertiesPage.notifySubscribers('oozie-node-selected', node);
        }
    }
});
