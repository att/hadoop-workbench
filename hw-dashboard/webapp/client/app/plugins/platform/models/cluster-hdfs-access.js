define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.models.ClusterHdfsAccess', getFactory);

    getFactory.$inject = [];
    function getFactory() {

        function ClusterHdfsAccess(options) {
            this.host = options.host;
            this.port = +options.port;
            this.userId = options.userId;
        }

        ClusterHdfsAccess.prototype = {
            toJSON: function () {
                return {
                    host: this.host,
                    port: this.port || 0,
                    userId: this.userId || null
                };
            }
        };

        ClusterHdfsAccess.factory = function (options) {
            options = ng.extend({
                host: '',
                port: null,
                userId: null
            }, options);

            return new ClusterHdfsAccess(options);
        };

        ClusterHdfsAccess.processApiResponse = function (data) {
            if (ng.isArray(data)) {
                return data.map(ClusterHdfsAccess.processApiResponse);
            }
            return ClusterHdfsAccess.factory(data);
        };

        return ClusterHdfsAccess;
    }
});
