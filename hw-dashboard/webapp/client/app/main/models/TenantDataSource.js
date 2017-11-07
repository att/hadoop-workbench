/**
 * @namespace Main.Models
 */

define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory("dap.main.models.TenantDataSource", getServiceDataSource);

    getServiceDataSource.$inject = [
        'dap.main.models.Platform',
        'dap.main.models.Cluster',
        'dap.main.models.Service'
    ];
    function getServiceDataSource(Platform, Cluster, Service) {

        function ServiceDataSource(options) {
            this.platform = options.platform instanceof Platform ? options.platform : Platform.factory(options.platform);
            this.cluster = options.cluster instanceof Cluster ? options.cluster : Cluster.factory(options.cluster);
            this.service = options.service instanceof Service ? options.service : Service.factory(options.service);
            this.module = {
                id: options.module.id,
                title: options.module.title,
                version: options.module.version
            };
            this.isSaved = !!options.isSaved;
        }

        ServiceDataSource.prototype.toJSON = function () {
            return {
                platform: this.platform.toJSON(),
                cluster: this.cluster.toJSON(),
                service: this.service.toJSON(),
                module: {
                    id: this.module.id,
                    title: this.module.title,
                    version: this.module.version
                },
                isSaved: this.isSaved
            };
        };

        ServiceDataSource.factory = function (options) {
            options = ng.extend({
                "id": 1,
                "name": "udc project",
                "description": "udc group"
            }, options);

            return new ServiceDataSource(options);
        };

        return ServiceDataSource;
    }
});
