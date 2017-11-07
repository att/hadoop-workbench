define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.models.PlatformAccessInfo', getFactory);

    getFactory.$inject = [];
    function getFactory() {
        /**
         * @param {{
         *  platformId: number,
         *  port: string,
         *  userName: string,
         *  password: string,
         *  keyFileId: string|number,
         * }}options
         * @constructor
         * @name platform.models.Platforms
         */
        function PlatformAccessInfo(options) {
            this.platformId = options.platformId;
            this.port = +options.port;
            this.userName = options.userName;
            this.password = options.password;
            this.keyFileId = options.keyFileId;
            this.pluginDirs = options.pluginDirs;
        }

        PlatformAccessInfo.prototype = {
            toJSON: function () {
                return {
                    id: this.platformId,
                    port: this.port || 0,
                    userName: this.userName,
                    password: this.password,
                    keyFileId: this.keyFileId || null,
                    pluginDirs: this.pluginDirs || []
                };
            }
        };

        PlatformAccessInfo.factory = function (options) {
            options = ng.extend({
                platformId: 0,
                port: 22,
                userName: '',
                password: '',
                keyFileId: null,
                pluginDirs: []
            }, options);

            return new PlatformAccessInfo(options);
        };

        PlatformAccessInfo.processApiResponse = function (data) {
            if (ng.isArray(data)) {
                return data.map(PlatformAccessInfo.processApiResponse);
            }
            data.platformId = data.id;
            return PlatformAccessInfo.factory(data);
        };

        return PlatformAccessInfo;
    }
});
