define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.models.ClusterInfo', getFactory);

    getFactory.$inject = [];
    function getFactory() {

        function ClusterInfo(options) {
            this.id = options.id;
            this.title = options.title;
            this.kerberized = options.kerberized;
            this.realm = options.realm;
        }

        ClusterInfo.prototype = {
            toJSON: function () {
                return {
                    id: this.id,
                    title: this.title,
                    kerberized: this.kerberized,
                    realm: this.realm,
                };
            }
        };

        ClusterInfo.factory = function (options) {
            options = ng.extend({
                id: '',
                title: '',
                kerberized: '',
                realm: '',
            }, options);

            return new ClusterInfo(options);
        };

        ClusterInfo.processApiResponse = function (data) {
            if (ng.isArray(data)) {
                return data.map(ClusterInfo.processApiResponse);
            }
            return ClusterInfo.factory(data);
        };

        return ClusterInfo;
    }
});
