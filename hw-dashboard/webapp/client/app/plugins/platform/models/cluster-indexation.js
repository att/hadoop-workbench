define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.models.ClusterIndexation', getFactory);

    getFactory.$inject = ['cluster.indexation.status', 'cluster.indexation.types'];
    function getFactory(CLUSTER_INDEXATION_STATUS, CLUSTER_INDEXATION_TYPES) {

        function ClusterIndexation(options) {
            this[CLUSTER_INDEXATION_TYPES.OOZIE] = options[CLUSTER_INDEXATION_TYPES.OOZIE];
            this[CLUSTER_INDEXATION_TYPES.FLUME] = options[CLUSTER_INDEXATION_TYPES.FLUME];
        }

        ClusterIndexation.prototype = {
            toJSON: function () {
                return {
                    [CLUSTER_INDEXATION_TYPES.OOZIE]: this[CLUSTER_INDEXATION_TYPES.OOZIE],
                    [CLUSTER_INDEXATION_TYPES.FLUME]: this[CLUSTER_INDEXATION_TYPES.FLUME]
                };
            }
        };

        ClusterIndexation.factory = function (options = {}) {
            [CLUSTER_INDEXATION_TYPES.OOZIE, CLUSTER_INDEXATION_TYPES.FLUME].forEach((type) => {
                let {
                    [type]:{
                        indexing = false, progress = null, lastUpdate = ''
                    } = {}
                } = options;
                let status = indexing ? CLUSTER_INDEXATION_STATUS.RUNNING : CLUSTER_INDEXATION_STATUS.NOT_RUNNING;

                if (lastUpdate) {
                    lastUpdate = Math.floor(lastUpdate / 1000);
                }
                options[type] = {indexing, status, progress, lastUpdate};
            });

            return new ClusterIndexation(options);
        };

        ClusterIndexation.processWebsocketApiResponse = function (data) {
            return ClusterIndexation.factory(data);
        };

        return ClusterIndexation;
    }
});
