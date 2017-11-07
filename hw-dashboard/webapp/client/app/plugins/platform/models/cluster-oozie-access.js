define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.models.ClusterOozieAccess', getFactory);

    getFactory.$inject = [];
    function getFactory() {

        function ClusterOozieAccess(options) {
            this.host = options.host;
            this.port = +options.port;
            this.userId = options.userId;
            this.rootPath = options.rootPath;
        }

        ClusterOozieAccess.prototype = {
            toJSON: function () {
                return {
                    host: this.host,
                    port: this.port || 0,
                    userId: this.userId || null,
                    rootPath: this.rootPath
                };
            }
        };

        ClusterOozieAccess.factory = function (options) {
            options = ng.extend({
                host: '',
                port: null,
                userId: null,
                rootPath: ""
            }, options);

            return new ClusterOozieAccess(options);
        };

        ClusterOozieAccess.processApiResponse = function (data) {
            if (ng.isArray(data)) {
                return data.map(ClusterOozieAccess.processApiResponse);
            }
            return ClusterOozieAccess.factory(data);
        };

        return ClusterOozieAccess;
    }
});
