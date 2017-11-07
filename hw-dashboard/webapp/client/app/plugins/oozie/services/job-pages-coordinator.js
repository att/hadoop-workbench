define(function (require) {
    "use strict";

    require('../ngModule').factory('oozie.JobPagesCoordinator', getCoordinator);

    getCoordinator.$inject = [
        'oozie.job-rest-service',
        '$q',
        '$timeout',
        '$rootScope'
    ];
    function getCoordinator(oozieJobsRestService, $q, $timeout, $rootScope) {
        return function Coordinator(source, refreshInterval) {
            let refreshIntervalTimeout,
                activeJobs = [],
                jobsList,
                isAutoRefresh,
                events = $rootScope.$new(true),
                requestJobsStatus;

            this.on = function (event, callback) {
                return events.$on(event, callback);
            };

            this.trigger = function (event, data) {
                return events.$emit(event, data);
            };

            this.requestJobsStatus = function (enabled, silent) {
                requestJobsStatus = enabled;
                isAutoRefresh = requestJobsStatus || activeJobs.length > 0;
                if (enabled) {
                    loadJobs(silent !== false);
                }
            };

            this.registerActiveJob = function (job) {
                activeJobs.unshift(job);
                isAutoRefresh = requestJobsStatus || activeJobs.length > 0;
                loadJobs(true);
            };

            this.deregisterActiveJob = function (job) {
                activeJobs = activeJobs.filter(function (j) {
                    return job.id !== j.id;
                });
            };

            this.refreshDataImmediately = function () {
                if (refreshIntervalTimeout) {
                    $timeout.cancel(refreshIntervalTimeout);
                    refreshIntervalTimeout = null;
                }
                loadJobs(false, true);
            };

            function autoRefreshData() {
                if (refreshIntervalTimeout) {
                    $timeout.cancel(refreshIntervalTimeout);
                    refreshIntervalTimeout = null;
                }
                if (isAutoRefresh) {
                    refreshIntervalTimeout = $timeout(function () {
                        if (isAutoRefresh) {
                            loadJobs(true);
                        }
                    }, refreshInterval);
                }
            }

            function loadJobs(silent, force) {
                return $q.all([getJobs(silent, force), getJob()]).then(function (results) {
                        switch (true) {
                            case results[0] !== null && results[1] !== null:
                            {
                                let j = results[1];
                                jobsList = results[0].map(function (job) {
                                    if (job.id === j.id) {
                                        job.actions = j.actions
                                    }
                                    return job;
                                });
                                break;
                            }
                            case results[0] !== null && results[1] === null:
                            {
                                jobsList = results[0];
                                break;
                            }
                            case results[0] === null && results[1] !== null:
                            {
                                jobsList = [results[1]];
                                break;
                            }
                            default:
                            {
                                console.error('Requested jobs but neither jobs list nor active job is active');
                            }
                        }
                        events.$emit('jobs-updated', jobsList);
                    })
                    .catch(function (response) {
                        events.$emit('jobs-update-error', {message: "Cannot refresh job list: " + response.message});
                    })
                    .finally(function () {
                        autoRefreshData();
                    });
            }

            function getJobs(silent, force) {
                let service = silent ? oozieJobsRestService.silent() : oozieJobsRestService;
                if (requestJobsStatus || force) {
                    if (!silent) {
                        events.$emit('requesting', true);
                    }
                    return service.getJobs(source).then(function (data) {
                        if (!silent) {
                            events.$emit('requesting', false);
                        }
                        return data;
                    }).catch(function (error) {
                        /**
                         * If silent is set to true, we will throw error event to allow 
                         * coordinator user proceed error buy it own 
                         */
                        if (silent) {
                            events.$emit('error', { message: error.message });
                        }
                    });
                } else {
                    return $q.when(null);
                }
            }

            function getJob() {
                if (activeJobs.length > 0) {
                    return oozieJobsRestService.silent().getJob(source, activeJobs[0].id);
                } else {
                    return $q.when(null);
                }
            }
        }
    }
});