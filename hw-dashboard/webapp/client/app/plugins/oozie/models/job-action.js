define(function (require, module, exports) {
    'use strict';

    require('../ngModule').factory('oozie.models.JobAction', getFactory);

    getFactory.$inject = [
        'core.metadata'
    ];
    function getFactory(metadata) {
        function JobAction(options) {
            this.id = options.id;
            this.name = options.name;
            this.type = options.type;
            this.conf = options.conf;
            this.startTime = new Date(options.startTime);
            this.endTime = options.endTime === null ? options.endTime : new Date(options.endTime);
            this.runningTimeSeconds = options.runningTime != null ? millisecondsToSeconds(options.runningTime) : null; // integer seconds || null
            this.status = options.status;
            this.externalId = options.externalId;
            this.externalStatus = options.externalStatus;
            this.trackerUri = options.trackerUri;
            this.consoleUrl = options.consoleUrl;
            this.transition = options.transition;
            this.data = options.data;
            this.errorCode = options.errorCode;
            this.errorMessage = options.errorMessage;
            this.retries = options.retries;

            this.$metadata = options.$metadata;
        }

        JobAction.factory = function (options) {
            options = Object.assign({
                id: '',
                name: '',
                type: '',
                conf: '',
                startTime: null,//date string
                endTime: null,//date string
                runningTime: null,// integer milliseconds
                status: 'UNKNOWN',
                externalId: '',
                externalStatus: 'UNKNOWN',
                trackerUri: '',
                consoleUrl: '',
                transition: '',
                data: null,
                errorCode: null,
                errorMessage: null,
                retries: 0,

                $metadata: metadata()
            }, options);

            return new JobAction(options);
        };

        JobAction.processApiResponse = function (data) {
            if (Array.isArray(data)) {
                return data.map(JobAction.processApiResponse);
            }
            return JobAction.factory(data);
        };

        return JobAction;
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
