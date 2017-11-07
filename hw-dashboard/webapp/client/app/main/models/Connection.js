define(function (require) {
    "use strict";

    require('../ngModule').value("dap.main.models.Connection", Connection);

    var ng = require("angular");

    /***
     * Connection constructor requires `from` and `to` param to be references to nodes instances since we want to have
     * updated properties of nodes in a connection if a user changes properties of a node
     * @param {NodeMixedConstructor} from
     * @param {NodeMixedConstructor} to
     * @constructor
     */

    function Connection(from, to, _outgoingConnectorType, _incomingConnectorType, properties) {

        if (!fromParamIsValid()) {
            throw new Error("'from' param is invalid");
        }

        if (!toParamIsValid()) {
            throw new Error("'to' param is invalid");
        }

        this.nodes = {
            from: from,
            to: to
        };

        this.connectors = {
            from: _outgoingConnectorType,
            to: _incomingConnectorType
        };

        this.properties = properties;

        function fromParamIsValid() {
            /*jshint -W074*/

            if (ng.isUndefined(from) || from === null || typeof from !== "object") {
                return false;
            }

            var idIsInvalid = ng.isUndefined(from.id) || from.id === null || from.id === "";
            var typeIsInvalid = ng.isUndefined(from.type) || from.type === null || from.type === "";
            var subtypeIsInvalid = ng.isUndefined(from.subtype) || from.subtype === null || from.subtype === "";

            return !(idIsInvalid || typeIsInvalid || subtypeIsInvalid);
        }

        function toParamIsValid() {
            /*jshint -W074*/

            if (ng.isUndefined(to) || to === null || typeof to !== "object") {
                return false;
            }

            var idIsInvalid = ng.isUndefined(to.id) || to.id === null || to.id === "";
            var typeIsInvalid = ng.isUndefined(to.type) || to.type === null || to.type === "";
            var subtypeIsInvalid = ng.isUndefined(to.subtype) || to.subtype === null || to.subtype === "";

            return !(idIsInvalid || typeIsInvalid || subtypeIsInvalid);
        }
    }

    Connection.prototype.toJSON = function () {
        var properties = this.properties.toJSON();
        var propertiesAsString = ng.toJson(properties);

        return {
            from: this.nodes.from.id,
            to: this.nodes.to.id,
            connector: this.connectors.from,
            properties: propertiesAsString
        };
    };

});
