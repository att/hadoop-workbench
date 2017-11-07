define(function (require) {
    "use strict";

    var ng = require("angular");

    /**
     * Uses connections provided by the flowchar-agent directive's scope to connect or detach connections with JsPlumb
     * This directive doesn't modify shared connections
     */
    require('../ngModule').directive('dapCoreJsPlumbConnections', function () {
        return {
            restrict: 'A',
            scope: {
                connections: '='
            },
            require: '^dapCoreJsPlumbContainer',
            /**
             * @param jsPlumbContainer facade for jsPlumb library
             */
            link: function (scope, element, attrs, jsPlumbContainer) {

                scope.$watchCollection('connections', connect);

                // this function attaches or detaches connections from JsPlumb if `connections` array on the
                // parent container is updated
                function connect() {
                    try {
                        jsPlumbContainer.getInstance().then(function (instance) {
                            var existingConnections = instance.getConnections();
                            var scopeConnections = (scope.connections || []);

                            // attach new connection if any
                            scopeConnections.forEach(function (c) {

                                var connectionObject = c.$connection;
                                if (connectionObject && existingConnections.indexOf(connectionObject) > -1) {
                                    return;
                                }

                                var from = jsPlumbContainer.getNode(c.nodes.from.id);
                                var to = jsPlumbContainer.getNode(c.nodes.to.id);

                                if (from && to) {
                                    var sourceEpUuid = null;
                                    var srcEpConnectorType = c.connectors.from;
                                    from.node.endpoints.some(function (endpoint) {
                                        if (endpoint.connectorType === srcEpConnectorType) {
                                            sourceEpUuid = endpoint.id;
                                            return true;
                                        }
                                        return false;
                                    });

                                    var targetEpUuid = null;
                                    instance.selectEndpoints({target: to.element}).each(function (endpoint) {
                                        targetEpUuid = endpoint.getUuid();
                                    });

                                    console.assert(sourceEpUuid && targetEpUuid, "No matching endpoint found on an element for the endpoint in connection");

                                    c.$connection = instance.connect({
                                        source: from.element,
                                        target: to.element,
                                        uuids: [sourceEpUuid, targetEpUuid],

                                        // we need to suppress connection event since we're adding connection manually
                                        // if not suppressed, onConnection handler of flowchart-agent will add duplicate
                                        doNotFireConnectionEvent: true
                                    });
                                }
                            });

                            // this cleaning mechanism is needed because there is no way to detach connection automatically
                            // by returning false from onConnection callback in case the connection is duplicate of existing one
                            // there is no possibility to check whether connection is a duplicate when onBeforeConnection
                            // event is triggered
                            existingConnections.forEach(function (connection) {
                                var remove = !scopeConnections.some(function (conn) {
                                    return conn.$connection === connection;
                                });
                                if (remove) {
                                    instance.detach(connection);
                                }
                            });
                        });
                    } catch(e) {
                        console.log(e);
                    }

                }
            }
        };
    });
});
