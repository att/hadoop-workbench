define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('flume.models.NodeProperty', getFactory);

    getFactory.$inject = [];
    function getFactory() {

        /**
         * @param {{
         *  key: string,
         *  value: string,
         *  required: boolean,
         *  defaultValue: string|number,
         *  isServiceProperty: boolean,
         *  isEditable: boolean,
         *  isVisible: boolean,
         *  isRemovable: boolean
         * }}options
         * @constructor
         * @name flume.models.NodeProperty
         */
        function NodeProperty(options) {
            this.key = options.key;
            this.value = options.value;
            this.required = options.required;
            this.defaultValue = options.defaultValue;
            this.isServiceProperty = options.isServiceProperty;
            this.isEditable = options.isEditable;
            this.isVisible = options.isVisible;
            this.isRemovable = options.isRemovable;
        }

        NodeProperty.prototype = {
            toJSON: function () {
                return {
                    id: this.id,
                    value: this.value
                };
            }
        };

        NodeProperty.factory = function (options) {
            options = ng.extend({
                key: "new property",
                value: "",
                required: false,
                defaultValue: "",
                isServiceProperty: false,
                isEditable: true,
                isVisible: true,
                isRemovable: true
            }, options);

            return new NodeProperty(options);
        };

        /*NodeProperty.processApiResponse = function (data) {
         if (ng.isArray(data)) {
         return data.map(NodeProperty.processApiResponse);
         }
         return NodeProperty.factory(data);
         };*/

        return NodeProperty;
    }
});
