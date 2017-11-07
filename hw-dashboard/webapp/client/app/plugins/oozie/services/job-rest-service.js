import {JOB_TYPE_WORKFLOW} from '../constants/job-types'
/*jshint maxparams: 7*/
define(function (require) {
    "use strict";

    require('../ngModule').provider('oozie.job-rest-service', RestProvider);

    // data shared between RestProvider and RestService
    var remoteUrl = '/hw/module/oozie-web';

    var ng = require("angular");

    var urlTemplates = {
        getJobs: remoteUrl + '/api/v1.0/platforms/{0}/clusters/{1}/jobs',//?appPath=<path>
        getJobsStatistics: remoteUrl + '/api/v1.0/platforms/{0}/clusters/{1}/jobs/statistics',//?appPath=<path>
        getJob: remoteUrl + '/api/v1.0/platforms/{0}/clusters/{1}/jobs/{2}?appPath={3}',
        getJobLog: remoteUrl + '/api/v1.0/platforms/{0}/clusters/{1}/jobs/{2}/log?appPath={3}',
        getActionLog: remoteUrl + '/api/v1.0/platforms/{0}/clusters/{1}/jobs/{2}/actions/{3}/log?appPath={3}',
        getExternalActionLog: remoteUrl + '/api/v1.0/platforms/{0}/clusters/{1}/jobs/{2}/actions/{3}/external-log?appPath={3}',
        getWorkflow: remoteUrl + '/api/v1.0/platforms/{0}/clusters/{1}/jobs/{2}/definition?appPath={3}',
        postJob: remoteUrl + '/api/v1.0/platforms/{0}/clusters/{1}/jobs',//?appPath=<path>
        putJob: remoteUrl + '/api/v1.0/platforms/{0}/clusters/{1}/jobs/{2}', //?action=<start | suspend | resume | kill | dryrun | rerun | change>
        killAllJob: remoteUrl + '/api/v1.0/platforms/{0}/clusters/{1}/jobs' // ?appPath=<path>&jobType=<workflow/coordinator>
    };

    function RestProvider() {

        this.setRemoteUrl = function (url) {
            remoteUrl = url;
        };

        this.$get = RestService;
    }

    RestService.$inject = [
        '$q',
        'core.API',
        "main.alerts.alertsManagerService",
        'core.utils.string-format',
        'oozie.models.Job'
    ];

    function RestService($q, API, dashboardAlertsManager, stringFormat, OozieJob) {
        return new OozieJobService($q, API);

        function OozieJobService($q, API) {
            this.doNotShowError = false;

            this.silent = function () {
                return ng.extend({}, this, {
                    doNotShowError: true
                });
            };

            this.getJobs = function (source) {
                var url = stringFormat(urlTemplates.getJobs, source.platform.id, source.cluster.id);
                return API.get(url, {
                        params: {
                            appPath: source.module.id
                        }
                    })
                    .then(function ({jobs = [], coordinatorJobs = []} = {}) {
                        let jobsFlat = jobs.reduce(function (jobsContainer, job) {
                            job.isCoordinator = false;
                            return jobsContainer.concat(parseSubJobs(job));
                        }, []);
                        let coordinatorJobsFlat = coordinatorJobs.map(coordinatorJob => {
                            coordinatorJob.isCoordinator = true;
                            return coordinatorJob;
                        });
                        return [...coordinatorJobsFlat, ...jobsFlat];
                    })
                    .then(OozieJob.processApiResponse)
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            /**
             * // Sample response
             * {
  "data": {
    "workflow": {
      "running": 0,
      "failed": 0,
      "succeeded": 8,
      "other": 31
    },
    "coordinator": {
      "running": 0,
      "failed": 0,
      "succeeded": 0,
      "other": 5
    }
  }
}

             * @param source
             * @returns {Promise.<TResult>}
             */
            this.getJobsStatistics = function (source) {
                let emptyResponse = {
                    "workflow": {
                        "running": 0,
                        "failed": 0,
                        "succeeded": 0,
                        "other": 0
                    },
                    "coordinator": {
                        "running": 0,
                        "failed": 0,
                        "succeeded": 0,
                        "other": 0
                    }
                };
                var url = stringFormat(urlTemplates.getJobsStatistics, source.platform.id, source.cluster.id);
                return API.get(url, {
                    params: {
                        appPath: source.module.id
                    }
                })
                    .then(({workflow, coordinator}) => {
                        if (workflow === undefined || coordinator === undefined) {
                            return emptyResponse;
                        }
                        return {workflow, coordinator};
                    })
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getJob = function (source, jobId) {
                var appPath = encodeURIComponent(source.path);
                var url = stringFormat(urlTemplates.getJob,
                    source.platform.id, source.cluster.id, jobId, appPath);
                return API
                    .get(url)
                    .then(OozieJob.processApiResponse)
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getJobWorkflow = function (source, jobId) {
                var appPath = encodeURIComponent(source.path);
                let url = stringFormat(urlTemplates.getWorkflow,
                    source.platform.id, source.cluster.id, jobId, source.module.id, appPath);
                return API.get(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            // Expected structure:
            // {
            //     "data": {
            //         "log": ["... \n .... \n\t  .... \n\t .... \n ... \n ... "]
            //     }
            // }
            // Note: "\n" - true line divider
            //          "\n\t" - this is inline divider should be skipped
            this.getJobLog = function (source, jobId) {
                var appPath = encodeURIComponent(source.path);
                var url = stringFormat(urlTemplates.getJobLog,
                    source.platform.id, source.cluster.id, jobId, appPath);
                return API
                    .get(url).then(function (data) {
                        return data.log;
                    })
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getJobActionLog = function (source, jobId, actionId) {
                var appPath = encodeURIComponent(source.path);
                var url = stringFormat(urlTemplates.getActionLog,
                    source.platform.id, source.cluster.id, jobId, actionId, appPath);
                return API
                    .get(url).then(function (data) {
                        return data.log;
                    })
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getJobExternalActionLog = function (source, jobId, externalId) {
                var appPath = encodeURIComponent(source.path);
                var url = stringFormat(urlTemplates.getExternalActionLog,
                    source.platform.id, source.cluster.id, jobId, externalId, appPath);
                return API
                    .get(url).then(function (data) {
                        return data;
                    })
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            /**
             * Create new job
             * @param source {Object}
             * @param jobType | "workflow" OR "coordinator"
             * @returns {Promise.<T>}
             */
            this.postJob = function (source, jobType = JOB_TYPE_WORKFLOW) {
                var url = stringFormat(urlTemplates.postJob,
                    source.platform.id, source.cluster.id);
                return API
                    .post(url, null, {
                        params: {
                            appPath: source.module.id,
                            jobType
                        }
                    })//returns new job's id: {id: string}
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.runJobAction = function (source, jobId, action, jobType = JOB_TYPE_WORKFLOW) {
                var url = stringFormat(urlTemplates.putJob,
                    source.platform.id, source.cluster.id, jobId);
                return API
                    .put(url, null, {
                        params: {
                            action: action,
                            appPath: source.module.id,
                            jobType
                        }
                    })
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.killAllJob = function (source, jobType = JOB_TYPE_WORKFLOW) {
                var url = stringFormat(urlTemplates.killAllJob,
                    source.platform.id, source.cluster.id);
                return API
                    .delete(url, {
                        params: {
                            appPath: source.module.id,
                            jobType
                        }
                    })
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            function processErrors(doNotShowError, error) {
                if (!doNotShowError) {
                    var errorMessage = {
                        title: "Server error",
                        text: error.message
                    };
                    dashboardAlertsManager.addAlertError(errorMessage);
                }

                return $q.reject(error);
            }

            function parseSubJobs(job) {
                var jobs = [job];
                Object.keys(job.subJobs).forEach(function (key) {
                    jobs = jobs.concat(parseSubJobs(job.subJobs[key]));
                });
                return jobs;
            }
        }
    }
});
