define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('flume.models.ServiceHost', getServiceHost);

    getServiceHost.$inject = [];
    function getServiceHost() {
        function ServiceHost(options) {
            this.id = options.id;
            this.hostname = options.hostname;
            this.ip = options.ip;
        }

        ServiceHost.prototype = {
            update: function (data) {
                data = ng.extend({}, this, data);
                this.id = data.id;
                this.hostname = data.hostname;
                this.ip = data.ip;
            }
        };

        ServiceHost.factory = function (options) {
            options = ng.extend({
                id: '',
                hostname: '',
                ip: ''
            }, options);

            return new ServiceHost(options);
        };

        ServiceHost.processApiResponse = function (data) {
            if (ng.isArray(data)) {
                return data.map(ServiceHost.processApiResponse);
            }
            return ServiceHost.factory(data);
        };

        return ServiceHost;
    }
});
