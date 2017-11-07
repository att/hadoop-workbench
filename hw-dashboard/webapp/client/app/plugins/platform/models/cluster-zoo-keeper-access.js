define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.models.ClusterZooKeeperAccess', getFactory);

    getFactory.$inject = [];
    function getFactory() {

        function ClusterZooKeeperAccess(options) {
            this.host = options.host;
            this.port = +options.port;
        }

        ClusterZooKeeperAccess.prototype = {
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

        ClusterZooKeeperAccess.factory = function (options) {
            options = ng.extend({
                host: '',
                port: null,
            }, options);

            return new ClusterZooKeeperAccess(options);
        };

        ClusterZooKeeperAccess.processApiResponse = function (data) {
            if (ng.isArray(data)) {
                return data.map(ClusterZooKeeperAccess.processApiResponse);
            }
            return ClusterZooKeeperAccess.factory(data);
        };

        return ClusterZooKeeperAccess;
    }
});
