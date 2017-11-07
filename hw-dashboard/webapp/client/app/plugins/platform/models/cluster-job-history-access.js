define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.models.ClusterJobHistoryAccess', getFactory);

    getFactory.$inject = [];
    function getFactory() {

        function ClusterJobHistoryAccess(options) {
            this.host = options.host;
            this.port = +options.port;
        }

        ClusterJobHistoryAccess.prototype = {
            toJSON: function () {
                return {
                    host: this.host,
                    port: this.port || 0,
                };
            },
            isNotEmpty: function () {
                return (this.host !== '') && (this.port !== null);
            }
        };

        ClusterJobHistoryAccess.factory = function (options) {
            options = ng.extend({
                host: '',
                port: null,
            }, options);

            return new ClusterJobHistoryAccess(options);
        };

        ClusterJobHistoryAccess.processApiResponse = function (data) {
            if (ng.isArray(data)) {
                return data.map(ClusterJobHistoryAccess.processApiResponse);
            }
            return ClusterJobHistoryAccess.factory(data);
        };

        return ClusterJobHistoryAccess;
    }
});
