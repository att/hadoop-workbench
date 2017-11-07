/*jshint maxparams:19*/
define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').controller('oozie.page.CoordinatorJobController', CoordinatorJobController);

    CoordinatorJobController.$inject = [
        '$scope',
        '$widgetParams',
        '$timeout',
        'oozie.models.Job',
        'dashboard.models.TabPage',
        'oozie.job-rest-service',
        'oozie.restService',
        'dashboard-isolated-widget-accessor.WidgetStore',
        "dashboard.models.TabPage.EVENTS"
    ];

    function CoordinatorJobController($scope, $widgetParams, $timeout, Job, TabPage, restService, oozieRestService, WidgetStore, TabPageEvents) {
        var logPage;
        var jobId = $widgetParams.params.jobId;
        var restGetRawFileFunction = $widgetParams.params.restGetRawFileFunction;
        var coordinator = $widgetParams.params.coordinator;
        var file = $widgetParams.params.file;

        var dashboardWidget = WidgetStore.getWidget();
        var alertTitle = dashboardWidget.title;
        var rightTabLogIndex = -1;

        ng.extend($scope, {
            alertTitle: alertTitle,
            isTabActive: true,
            job: Job.factory({id: jobId}),
            jobActions: {},
            page: $widgetParams.params.page,
            dashboardWidgetContainer: {
                dashboardWidget: dashboardWidget
            },
            selectedNodeContainer: {
                node: null
            },
            nodeValidatorCallback: false,
            fileLoaded: null,
            options: {
                mode: 'text/xml',
                lineNumbers: true,
                readonly: true,
                lineWrapping: true
            }
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

            restGetRawFileFunction(file).then(function (data) {
                $scope.fileLoaded = data;

            });
            coordinator.registerActiveJob($scope.job);
        }

        function setUpControls() {

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

            rightTabLogIndex = $widgetParams.page.rightTabManager.addTab(logPage, '', 'Log', 'b-oozie-plugin__log-container-widget__icon', true);
        }

        function startWatchingScope() {
            var unwatchers = [];
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
        }

        function updateActionContainer(node) {

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

    }
});
