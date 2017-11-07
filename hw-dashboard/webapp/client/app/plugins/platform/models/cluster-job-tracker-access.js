define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.models.ClusterJobTrackerAccess', getFactory);

    getFactory.$inject = [];
    function getFactory() {

        function ClusterJobTrackerAccess(options) {
            this.host = options.host;
            this.port = +options.port;
        }

        ClusterJobTrackerAccess.prototype = {
            toJSON: function () {
                return {
                    host: this.host,
                    port: this.port || 0,
                };
            }
        };

        ClusterJobTrackerAccess.factory = function (options) {
            options = ng.extend({
                host: '',
                port: null,
            }, options);

            return new ClusterJobTrackerAccess(options);
        };

        ClusterJobTrackerAccess.processApiResponse = function (data) {
            if (ng.isArray(data)) {
                return data.map(ClusterJobTrackerAccess.processApiResponse);
            }
            return ClusterJobTrackerAccess.factory(data);
        };

        return ClusterJobTrackerAccess;
    }
});
