define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('flume.models.NodeCounter', getFactory);

    getFactory.$inject = [];
    function getFactory() {
        /**
         * @param {{
         *  id: string,
         *  value: string
         * }}options
         * @constructor
         * @name flume.models.NodeCounter
         */
        function NodeCounter(options) {
            this.id = options.id;
            this.value = options.value;
        }

        NodeCounter.prototype = {
            toJSON: function () {
                return {
                    id: this.id,
                    value: this.value
                };
            }
        };

        NodeCounter.factory = function (options) {
            options = ng.extend({
                id: '',
                value: ''
            }, options);

            return new NodeCounter(options);
        };

        NodeCounter.processApiResponse = function (data) {
            if (ng.isArray(data)) {
                return data.map(NodeCounter.processApiResponse);
            }
            return NodeCounter.factory(data);
        };

        return NodeCounter;
    }
});
