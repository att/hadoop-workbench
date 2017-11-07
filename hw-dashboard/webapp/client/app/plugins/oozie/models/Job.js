define(function (require, module, exports) {
    "use strict";

    require('../ngModule').factory('oozie.models.Job', getFactory);

    getFactory.$inject = [
        'core.metadata',
        'oozie.models.JobAction',
        'core.guid'
    ];
    function getFactory(metadata, JobAction, guid) {
        /**
         * @param {object}options
         * @constructor
         * @name Oozie.models.Job
         */
        function Job(options) {
            this.id = options.id;
            this.guid = options.guid;
            this.appName = options.appName;
            this.appPath = options.appPath;
            this.externalId = options.externalId;
            this.parentId = options.parentId;
            this.user = options.user;
            this.status = options.status;
            this.createdTime = new Date(options.createdTime);
            this.startTime = new Date(options.startTime);
            this.endTime = options.endTime === null ? options.endTime : new Date(options.endTime);
            this.runningTimeSeconds = options.runningTime != null ? millisecondsToSeconds(options.runningTime) : null; // integer seconds || null
            this.run = options.run;
            this.actions = options.actions;
            this.isCoordinator = options.isCoordinator;
            this.nextMaterializedTime = options.nextMaterializedTime;
            this.lastAction = options.lastAction;
            this.nextMaterializedTime = options.nextMaterializedTime;
            this.$metadata = options.$metadata;
        }

        Job.factory = function (options) {
            options = Object.assign({
                id: '',
                guid: guid(),
                appName: '',
                appPath: '',
                externalId: '',
                parentId: '',
                user: '',
                status: '',
                conf: '',
                createdTime: null,//date sting
                startTime: null,//date string
                endTime: null,//date string
                runningTime: null,// integer milliseconds
                run: 0,
                actions: [],
                $metadata: metadata()
            }, options);

            return new Job(options);
        };

        Job.processApiResponse = function (data) {
            if (Array.isArray(data)) {
                return data.map(Job.processApiResponse);
            }

            if (data && data.actions) {
                data = Object.assign({}, data, {
                    actions: JobAction.processApiResponse(data.actions)
                });
            }
            return Job.factory(data);
        };

        return Job;
    }

    /**
     * Convert milliseconds to seconds
     *
     * @param {number} millisecondsValue
     * @returns {number}
     */
    function millisecondsToSeconds(millisecondsValue) {
        return Math.round((millisecondsValue) * 0.001);
    }

});
