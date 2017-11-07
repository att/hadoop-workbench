/**
 * @namespace Main.Models
 */

define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory("dap.main.models.ServiceDataSource", getServiceDataSource);

    getServiceDataSource.$inject = [
        'dap.main.models.Platform',
        'dap.main.models.Cluster',
        'dap.main.models.Service'
    ];
    function getServiceDataSource(Platform, Cluster, Service) {
        /**
         * @typedef {{
         *  platform: [Main.Models.platformOptions],
         *  cluster: [Main.Models.clusterOptions],
         *  service: [Main.Models.serviceOptions],
         *  module: {
         *      id: string,
         *      title:string
         *  },
         *  title: string,
         *  agentName: string,
         *  path: string,
         *  type: string,
         *  id: string
         * }} Main.Models.serviceDataSourceOptions
         */

        /**
         * Describes data source of a service
         * @param {Main.Models.serviceDataSourceOptions} options
         * @constructor
         * @memberOf Main.Models
         */
        function ServiceDataSource(options) {
            this.id = options.id || options.path;
            this.platform = options.platform instanceof Platform ? options.platform : Platform.factory(options.platform);
            this.cluster = options.cluster instanceof Cluster ? options.cluster : Cluster.factory(options.cluster);
            this.service = options.service instanceof Service ? options.service : Service.factory(options.service);
            this.module = {
                id: options.module.id,
                title: options.module.title,
                version: options.module.version
            };
            this.title = options.title;
            this.renderedName = options.renderedName;
            this.agentName = options.agentName;
            this.path = options.path;
            this.type = options.type;
            this.isSaved = !!options.isSaved;
        }

        ServiceDataSource.prototype.toJSON = function () {
            return {
                id: this.id || this.path,
                platform: this.platform.toJSON(),
                cluster: this.cluster.toJSON(),
                service: this.service.toJSON(),
                module: {
                    id: this.module.id,
                    title: this.module.title,
                    version: this.module.version
                },
                title: this.title,
                renderedName: this.renderedName,
                agentName: this.agentName,
                path: this.path,
                type: this.type,
                isSaved: this.isSaved
            };
        };

        /**
         * Creates new instance
         * @param  {Main.Models.serviceDataSourceOptions?} [options]
         * @static
         * @memberOf Main.Models.ServiceDataSource
         * @return {Main.Models.ServiceDataSource} new instance
         */
        ServiceDataSource.factory = function (options) {
            options = ng.extend({
                platform: {},
                cluster: {},
                service: {},
                module: {
                    id: '',
                    title: '',
                    version: ''
                },
                id: '',
                title: '',
                renderedName: '',
                agentName: '',
                path: '',
                type: '',
                isSaved: false
            }, options);

            return new ServiceDataSource(options);
        };

        return ServiceDataSource;
    }
});
