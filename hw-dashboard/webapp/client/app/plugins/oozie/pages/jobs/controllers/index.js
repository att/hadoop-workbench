import {JOB_TYPE_COORDINATOR, JOB_TYPE_WORKFLOW} from '../../../constants/job-types';
/*jshint maxparams:8*/
define(function (require) {
    "use strict";

    var ng = require("angular");
    const COORDINATOR_FILE_NAME = 'coordinator.xml';
    require('../ngModule').controller('oozie.pages.JobsController', indexController);

    indexController.$inject = [
        '$scope',
        'oozie.job-rest-service',
        '$q',
        'dashboard.models.TabPage',
        'dashboard-isolated-widget-accessor.WidgetStore',
        '$timeout',
        '$widgetParams',
        'oozie.models.Job',
        "dashboard.models.TabPage.EVENTS"
    ];
    function indexController($scope, oozieJobsRestService, $q, TabPage, WidgetStore, $timeout, $widgetParams, Job, TabPageEvents) {
        var $dashboardWidget = WidgetStore.getWidget();
        var source = $dashboardWidget.params.source;
        var restGetRawFileFunction = $widgetParams.params.restGetRawFileFunction;
        var coordinator = $widgetParams.params.coordinator;
        var fileManager = $widgetParams.params.fileManager;
        var visibleJobType = $widgetParams.params.visibleJobType;
        var jobFilterFn = (job) => {
            switch (visibleJobType) {
                case JOB_TYPE_COORDINATOR:
                    return job.isCoordinator === true;
                    break;
                case JOB_TYPE_WORKFLOW:
                default:
                    return job.isCoordinator === false;
                    break;
            }
        };
        fileManager.updateFiles();
        var states = {
            CREATED: 'CREATED',
            STARTED: 'STARTED',
            BUSY: 'BUSY',
            STOPPED: 'STOPPED',
            UNKNOWN: 'UNKNOWN'
        };
        var pendingCreateJobs = {};
        var lastRefreshTimestamp = 0;
        var suspendFn;

        //scope properties
        ng.extend($scope, {
            jobs: [],
            isJobTypeWorkflow: visibleJobType === JOB_TYPE_WORKFLOW,
            isJobTypeCoordinator: visibleJobType === JOB_TYPE_COORDINATOR,
            workflowFile: $widgetParams.params.workflowFile,
            workflowFiles: $widgetParams.params.files,
            isCoordinatorPossible: true,
            workflow: $widgetParams.params.workflow,
            selectedJob: null,
            requesting: false,
            isAutoRefresh: true,
            refreshInterval: 5000,
            expandedJobs: {},//key - job ID, value - boolean (true for expanded)
            states: states,
            page: $widgetParams.page,
            error: null,
            newJobFormVisible: false,
            newJobCreatedIds: []
        });

        //scope methods
        ng.extend($scope, {
            hide: function () {
                $scope.$emit('hide.left-tab-panel');
            },
            selectJob: function (job, openWorkflow) {
                if (!job) {
                    $scope.selectedJob = null;
                    return;
                }
                $scope.selectedJob = job;
                if (openWorkflow && job.isCoordinator) {
                    $scope.openCoordinator(job);
                }
                if (openWorkflow && !job.isCoordinator) {
                    $scope.openWorkflow(job);
                }
            },
            openCoordinator: function (job) {
                if (!job.id) {
                    return;
                }
                let file = findCoordinatorFile($scope.workflowFiles);

                var index;
                var pageName = 'oozie-coordinator-job-page';
                var existedTab = $dashboardWidget.tabManager.getTabs().filter(function (tab) {
                    return tab.page.name === pageName && tab.page.params.jobId === job.id;
                })[0];

                if (existedTab) {
                    index = $dashboardWidget.tabManager.getTabs().indexOf(existedTab);
                } else {
                    var page = TabPage.factory({
                        name: pageName,
                        params: {
                            file: file,
                            jobId: job.id,
                            restGetRawFileFunction: restGetRawFileFunction,
                            coordinator: coordinator
                        }
                    });
                    index = $dashboardWidget.tabManager.addTab(page, job.id);
                }

                var tabIndicator = getJobIndicator(job);
                $dashboardWidget.tabManager.setIndicator(index, tabIndicator);

                if (index > -1) {
                    $dashboardWidget.tabManager.setActive(index);
                }
            },
            openWorkflow: function (job) {
                if (!job.id) {
                    return;
                }
                //open a tab with a workflow in the read only mode
                //create new Page for this purpose if no already existed page

                var index;
                var pageName = 'oozie-job-page';
                var existedTab = $dashboardWidget.tabManager.getTabs().filter(function (tab) {
                    return tab.page.name === pageName && tab.page.params.jobId === job.id;
                })[0];

                if (existedTab) {
                    index = $dashboardWidget.tabManager.getTabs().indexOf(existedTab);
                } else {
                    var page = TabPage.factory({
                        name: pageName,
                        params: {
                            file: $scope.workflowFile,
                            jobId: job.id,
                            source: $dashboardWidget.params.source,
                            workflowDescriptor: $scope.workflow,
                            workflowFiles: $scope.workflowFiles,
                            coordinator: coordinator
                        }
                    });

                    index = $dashboardWidget.tabManager.addTab(page, job.id);
                }

                var tabIndicator = getJobIndicator(job);
                $dashboardWidget.tabManager.setIndicator(index, tabIndicator);

                if (index > -1) {
                    $dashboardWidget.tabManager.setActive(index);
                }
            },
            refreshJobs: function () {
                coordinator.refreshDataImmediately()
            },
            openFormCreateNewJob: function () {
                $scope.newJobFormVisible = true;
            },
            createNewCoordinatorJob: function () {
                createNewJob(JOB_TYPE_COORDINATOR);
            },
            createNewWorkflowJob: function () {
                createNewJob(JOB_TYPE_WORKFLOW);
            },
            cancelCreateNewJob: function () {
                $scope.newJobFormVisible = false;
            },
            toggleExpandJob: function (event, job) {
                event.stopPropagation();
                $scope.expandedJobs[job.id] = !$scope.expandedJobs[job.id];
            },
            runJobAction: function (job, action) {
                if (!job || job.state === $scope.states.STARTED) {
                    return;
                }
                $scope.requesting = true;
                let jobType = job.isCoordinator ? JOB_TYPE_COORDINATOR : JOB_TYPE_WORKFLOW;
                oozieJobsRestService.runJobAction(source, job.id, action, jobType)
                    .finally(function () {
                        $scope.requesting = false;
                        coordinator.refreshDataImmediately();
                    });
            },
            isSucceeded: function (job) {
                return ['SUCCEEDED'].indexOf(job.status) > -1;
            },
            isRunning: function (job) {
                return ['RUNNING'].indexOf(job.status) > -1;
            },
            isFailed: function (job) {
                return ['TIMEDOUT', 'KILLED', 'FAILED'].indexOf(job.status) > -1;
            },
            isSuspended: function (job) {
                return ['SUSPENDED'].indexOf(job.status) > -1;
            }

        });

        $scope.selectJob($scope.jobs[0]);

        $scope.$watchCollection('jobs', function (newCollection) {
            if ($scope.selectedJob) {
                $scope.selectedJob = newCollection.filter(function (job) {
                        return job.id === $scope.selectedJob.id;
                    })[0] || null;
            }

            refreshJobStateOnTabHeader();
        });
        $scope.$watch('isAutoRefresh', function (enabled) {
            if (enabled) {
                coordinator.requestJobsStatus(true);
            } else {
                coordinator.requestJobsStatus(false);
            }
        });
        $scope.$on('$destroy', function () {
            coordinator.requestJobsStatus(false);
            $scope.isAutoRefresh = false;
        });

        $scope.page.on(TabPageEvents.ACTIVE_STATE_CHANGE, function (event, active) {
            let tabIndex = $dashboardWidget.leftTabManager.currentIndex;
            coordinator.requestJobsStatus(active || $widgetParams.params.isTabWithJobListFunction(tabIndex));
        });

        coordinator.on('jobs-updated', function (event, jobs) {
            $scope.error = null;
            $scope.jobs = jobs.filter(jobFilterFn);
            if ($scope.selectedJob === null && jobs.length > 0) {
                $scope.selectJob(jobs[0]);
            }

            if ($scope.newJobCreatedIds.length) {
                let newJobId;
                let newJobIds;
                let jobsToOpen = $scope.jobs.filter(
                    job => {
                        newJobIds = $scope.newJobCreatedIds.filter((id) => id == job.id);
                        if (newJobIds[0] != undefined) {
                            newJobId = newJobIds[0];
                        }
                        return  newJobId ? true : false;
                    });
                let jobToOpen = jobsToOpen[0];
                let newJobIdIndex = $scope.newJobCreatedIds.indexOf(newJobId);
                if (newJobIdIndex != -1) {
                    $scope.newJobCreatedIds.splice(newJobIdIndex, 1);
                }

                if (jobToOpen) {
                    $scope.selectJob(jobToOpen, true);
                }
            }
        });

        coordinator.on('requesting', function (event, requesting) {
            $scope.requesting = requesting;
        });

        coordinator.on('error', function (event, error) {
            $scope.error = error;
        });

        coordinator.requestJobsStatus(true, false);

        fileManager.on('file-manager-files-updated', function (event, files) {
            $scope.workflowFiles.splice(0);
            $scope.workflowFiles.push.apply($scope.workflowFiles, files);

            $scope.coordinatorFile = findCoordinatorFile($scope.workflowFiles);
            $scope.isCoordinatorPossible = $scope.coordinatorFile !== undefined;
        });

        function createNewJob(jobType = JOB_TYPE_WORKFLOW) {
            let job2Post = Job.factory({
                createdTime: new Date()
            });
            pendingCreateJobs[job2Post.guid] = job2Post;
            $scope.requesting = true;
            oozieJobsRestService.postJob(source, jobType).then((job) => {
                $scope.newJobCreatedIds.push(job.id);
                coordinator.refreshDataImmediately()
            }).finally(() => {
                $scope.newJobFormVisible = false;
                $scope.requesting = false;
            });
        }

        function findCoordinatorFile(files) {
            return files.filter(({path}) => path === COORDINATOR_FILE_NAME)[0];
        }

        function getJobIndicator(job) {
            var tabIndicator;

            if ($scope.isFailed(job)) {
                tabIndicator = 'red';
            } else if ($scope.isRunning(job)) {
                tabIndicator = 'green-blink';
            } else if ($scope.isSucceeded(job)) {
                tabIndicator = 'green';
            } else if ($scope.isSuspended(job)) {
                tabIndicator = 'orange';
            } else {
                tabIndicator = 'white';
            }

            return tabIndicator;
        }

        function refreshJobStateOnTabHeader() {
            var tabIndexToUpdate, tabIndicator;
            $scope.jobs.forEach(function(item) {
                tabIndexToUpdate = $dashboardWidget.tabManager.getTabByField('label', item.id);
                if (tabIndexToUpdate != -1) {
                    tabIndicator = getJobIndicator(item);
                    $dashboardWidget.tabManager.setIndicator(tabIndexToUpdate, tabIndicator);
                }
            })
        }
    }
});
