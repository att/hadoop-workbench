define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.models.ClusterResourceManagerAccess', getFactory);

    getFactory.$inject = [];
    function getFactory() {

        function ClusterResourceManagerAccess(options) {
            this.host = options.host;
            this.port = +options.port;
        }

        ClusterResourceManagerAccess.prototype = {
            toJSON: function () {
                return {
                    host: this.host,
                    port: this.port || 0,
                };
            }
        };

        ClusterResourceManagerAccess.factory = function (options) {
            options = ng.extend({
                host: '',
                port: 50070,
            }, options);

            return new ClusterResourceManagerAccess(options);
        };

        ClusterResourceManagerAccess.processApiResponse = function (data) {
            if (ng.isArray(data)) {
                return data.map(ClusterResourceManagerAccess.processApiResponse);
            }
            return ClusterResourceManagerAccess.factory(data);
        };

        return ClusterResourceManagerAccess;
    }
});
