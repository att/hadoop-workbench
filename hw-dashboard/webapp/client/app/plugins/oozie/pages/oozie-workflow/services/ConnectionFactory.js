define(function (require) {
        "use strict";

        var ng = require("angular");
        require("../ngModule").service("oozie.services.connectionFactory", ConnectionFactory);

        ConnectionFactory.$inject = ["dap.main.models.Connection", 'shared.jsonSchemaBuilder'];
        function ConnectionFactory(Connection, jsonSchemaBuilder) {

            this.createConnectionConstructors = createConnectionConstructors;
            this.getConnectionInstance = getConnectionInstance;

            var connectionConstructors = {};

            function createConnectionConstructors(data) {
                var connectionProperties = data.properties;
                if (!ng.isArray(connectionProperties)) {
                    console.error("connectionProperties are expected to be of array type, instead saw " + typeof connectionProperties);
                    return;
                }

                connectionProperties.forEach(function (propertySet) {
                    createMixedConnectionConstructor(propertySet.from, propertySet.connector, propertySet.jsonSchema.properties);
                });
            }

            function createMixedConnectionConstructor(fromType, fromConnector, properties) {
                addConstructorSpot(fromType, fromConnector);
                connectionConstructors[fromType][fromConnector] = getNodeMixedConstructor(properties);
            }

            function addConstructorSpot(type, connector) {
                if (ng.isUndefined(connectionConstructors[type])) {
                    connectionConstructors[type] = {};
                }

                if (ng.isUndefined(connectionConstructors[type][connector])) {
                    connectionConstructors[type][connector] = {};
                }
            }

            function getNodeMixedConstructor(properties) {
                var ConnectionMixedConstructor = function (from, to, outgoingConnector, incomingConnector, data) {
                    Connection.call(this, from, to, outgoingConnector, incomingConnector);

                    var scheme = {
                        type: "object",
                        title: "General",
                        properties: properties
                    };

                    var schemeData = ng.isString(data) ? JSON.parse(data || "{}") : data;

                    this.properties = jsonSchemaBuilder.createSchema(scheme).populate(schemeData);

                };
                ConnectionMixedConstructor.prototype = Connection.prototype;

                return ConnectionMixedConstructor;
            }

            function getConnectionInstance(from, to, _outgoingConnector, _incomingConnector, data) {
                var outgoingConnector = _outgoingConnector || "out";
                var incomingConnector = _incomingConnector || "in";

                var connectionConstructorsForConnector = connectionConstructors[from.type] || connectionConstructors[from.subtype];
                var ConnectionMixedConstructor = connectionConstructorsForConnector && (connectionConstructorsForConnector[outgoingConnector] || connectionConstructorsForConnector[incomingConnector]);

                if (!ng.isUndefined(ConnectionMixedConstructor)) {
                    return new ConnectionMixedConstructor(from, to, outgoingConnector, incomingConnector, data);
                } else {
                    // server didn't send properties for this type of connection so we're using the default constructor without data
                    var connection = new Connection(from, to, outgoingConnector, incomingConnector);
                    connection.properties = jsonSchemaBuilder.createSchema({type: 'object'});
                    return connection;
                }
            }
        }
    }
);

