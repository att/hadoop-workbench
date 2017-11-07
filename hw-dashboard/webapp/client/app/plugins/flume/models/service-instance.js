define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('flume.models.ServiceInstance', getServiceInstance);

    function getServiceInstance() {
        function ServiceInstance(options) {
            this.id = options.id;
            this.pluginDir = options.pluginDir;
            this.host = options.host;
            this.state = options.state;
            this.errors = options.errors;
        }

        ServiceInstance.factory = function (options) {
            options = ng.extend({
                host: {
                    hostname: '',
                    id: '',
                    ip: ''
                },
                pluginDir: '',
                state: 'STOPPED',
                errors: []
            }, options);

            return new ServiceInstance(options);
        };

        ServiceInstance.processApiResponse = function (data) {
            if (ng.isArray(data)) {
                return data.map(ServiceInstance.processApiResponse);
            }
            return ServiceInstance.factory(data);
        };

        return ServiceInstance;
    }
});
