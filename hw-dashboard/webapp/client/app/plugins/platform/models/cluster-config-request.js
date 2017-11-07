define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.models.ClusterConfigRequest', getFactory);

    getFactory.$inject = ['cluster.config.request.types', 'cluster.config.request.status'];
        function getFactory(CLUSTER_CONFIG_REQUEST_TYPES, CLUSTER_CONFIG_REQUEST_STATUS) {

        function ClusterConfigRequest(options) {
            this[CLUSTER_CONFIG_REQUEST_TYPES.PULL] = options[CLUSTER_CONFIG_REQUEST_TYPES.PULL];
            this[CLUSTER_CONFIG_REQUEST_TYPES.PUSH] = options[CLUSTER_CONFIG_REQUEST_TYPES.PUSH];
        }

        ClusterConfigRequest.prototype = {
            toJSON: function () {
                return {
                    [CLUSTER_CONFIG_REQUEST_TYPES.PULL]: this[CLUSTER_CONFIG_REQUEST_TYPES.PULL],
                    [CLUSTER_CONFIG_REQUEST_TYPES.PUSH]: this[CLUSTER_CONFIG_REQUEST_TYPES.PUSH]
                };
            }
        };

        ClusterConfigRequest.factory = function (options = {}) {
            [CLUSTER_CONFIG_REQUEST_TYPES.PULL, CLUSTER_CONFIG_REQUEST_TYPES.PUSH].forEach((type) => {
                let status = options[type] ? options[type].status : CLUSTER_CONFIG_REQUEST_STATUS.NOT_RUNNING;
                options[type] = {status: status};
            });

            return new ClusterConfigRequest(options);
        };

        ClusterConfigRequest.processWebsocketApiResponse = function (data) {
            return ClusterConfigRequest.factory(data);
        };

        return ClusterConfigRequest;
    }
});
