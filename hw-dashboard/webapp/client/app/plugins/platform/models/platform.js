define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.models.Platform', getFactory);

    getFactory.$inject = [];
    function getFactory() {
        /**
         * Note: distribution === type + ' ' + version
         * @param {{
         *  id: number,
         *  installationId: number,
         *  title: string,
         *  version: string,
         *  distribution: string,
         *  type: string,
         *  location: string,
         *  isOnline: boolean [optional]
         *  isOffline: boolean [optional]
         *  isError: boolean [optional]
         *  isDestroyed: boolean [optional],
         *  isDestroying: boolean [optional],
         *  isProvisioning: boolean [optional]
         *  api: {
         *      host: string,
         *      version: string,
         *      port: number,
         *      type: string,
         *      protocol: string,
         *      userName: string,
         *      password: string
         *  }
         * }}options
         * @constructor
         * @name platform.models.Platforms
         */
        function Platform(options) {
            this.id = options.id;
            this.installationId = options.installationId;
            this.title = options.title;
            this.version = options.version;
            // distribution is type + ' ' + version
            this.distribution = options.distribution;
            this.type = options.type;
            this.location = options.location;
            this.api = options.api;
            this.clusters = options.clusters;
            this.accessInfo = options.accessInfo;
            this.isOnline = options.isOnline;
            this.isOffline = options.isOffline;
            this.isError = options.isError;
            this.isDestroyed = options.isDestroyed;
            this.isDestroying = options.isDestroying;
            this.isProvisioning = options.isProvisioning;
        }

        Platform.prototype = {
            toJSON: function () {
                return {
                    description: this.title,
                    version: this.version,
                    distribution: this.distribution,
                    type: this.type,
                    location: this.location,
                    id: this.id,
                    installationId: this.installationId,
                    isOnline: this.isOnline,
                    isOffline: this.isOffline,
                    isError: this.isError,
                    isDestroyed: this.isDestroyed,
                    isDestroying: this.isDestroying,
                    isProvisioning: this.isProvisioning,
                    api: {
                        host: this.api.host,
                        version: this.api.version,
                        port: this.api.port,
                        type: this.api.type,
                        protocol: this.api.protocol,
                        userName: this.api.userName,
                        password: this.api.password
                    }
                };
            }
        };

        Platform.factory = function (options) {
            options = ng.extend({
                description: "",
                id: 0,
                installationId: null,
                isOnline: false,
                isOffline: true,
                isError: false,
                isDestroyed: false,
                isDestroying: false,
                isProvisioning: false,
                api: {
                    host: "",
                    version: "",
                    port: 8080,
                    type: "",
                    protocol: "http",
                    userName: "",
                    password: ""
                },
                distribution: "",
                location: "",
                clusters: [],
                accessInfo: null
            }, options);

            return new Platform(options);
        };

        Platform.processApiResponse = function (data) {
            if (ng.isArray(data)) {
                return data.map(Platform.processApiResponse);
            }
            data.title = data.title || data.description;
            return Platform.factory(data);
        };

        return Platform;
    }
});
