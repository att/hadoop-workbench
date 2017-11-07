define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory('shared.validation.ConnectionOccursRule', getConnectionOccursRuleFn);

    getConnectionOccursRuleFn.$inject = ['oozie.NodeConnectors'];

    function getConnectionOccursRuleFn(NodeConnectors) {

        function ConnectionOccursRule(from, to, type, connector, count, errorMessage) {
            this._from = from;
            this._to = to;
            this._type = type;
            this._connector = connector;
            this._count = count;
            this._errorMessage = errorMessage;
            //TODO: find better way to allow connections reattachment
            //if (this._connector === "ok" || this._connector === "error") {
            //    this._count = this._count + 1;
            //}

            if (!(this._fromParamIsDefined(this._from) || this._toParamIsDefined(this._to))) {
                throw new Error("At least 'from' or 'too' param should be specified and should not be empty string");
            }

            if (!this._countParamIsValid(this._count)) {
                throw new Error('maxOccurs should be specified and be number greater than or equal to zero');
            }

            if (!this._typeParamIsValid(this._type)) {
                throw new Error("type should be specified and should be either 'out' or 'in'");
            }

            if (!this._connectorParamIsValid(this._connector)) {
                throw new Error("Connector should be specified and should be one of the following values [" + Object.keys(NodeConnectors) + "], " + connector + " is unexpected");
            }
        }

        ConnectionOccursRule.prototype = {
            matchesSpec: function (matchingFrom, matchingTo, matchingType, matchingConnector) {
                /*jshint -W074*/
                var matchesFrom = this._from === matchingFrom || !this._fromParamIsDefined(this._from) || matchingFrom === null;
                var matchesTo = this._to === matchingTo || !this._toParamIsDefined(this._to) || matchingTo === null;
                var matchesType = this._type === matchingType || matchingType === null;
                var matchesConnector = this._connector === matchingConnector || matchingConnector === null;

                return matchesFrom && matchesTo && matchesType && matchesConnector;
            },
            _validate: function (values, isValid) {
                /*jshint -W074*/
                if (ng.isUndefined(values) || !ng.isArray(values.nodes) || !ng.isArray(values.connections)) {
                    throw new Error("Both nodes and connections should be of Array type");
                }

                var nodes = values.nodes;
                var connections = values.connections;

                var invalidNodeIds = [];

                var checkOutgoingConnectionsOnly = !this._toParamIsDefined(this._to);
                var checkIncomingConnectionsOnly = !this._fromParamIsDefined(this._from);
                var checkBothDirections = !checkOutgoingConnectionsOnly && !checkIncomingConnectionsOnly;

                switch (true) {
                    case checkOutgoingConnectionsOnly:
                    {
                        nodes.forEach(function (node) {
                            var isApplicable = (node.connectors.indexOf(this._connector) !== -1) && (node.type === this._from || node.subtype === this._from);
                            if (isApplicable) {
                                var nodeConnections = findNodesConnectionSingleDirection(node.id, "from", this._connector, connections);
                                if (!isValid(nodeConnections.length, this._count)) {
                                    invalidNodeIds.push(node.id);
                                }
                            }
                        }.bind(this));

                        break;
                    }
                    case checkIncomingConnectionsOnly:
                    {
                        nodes.forEach(function (node) {
                            var isApplicable = (node.connectors.indexOf(this._connector) !== -1) && (node.type === this._to || node.subtype === this._to);
                            if (isApplicable) {
                                var nodeConnections = findNodesConnectionSingleDirection(node.id, "to", "in", connections);
                                if (!isValid(nodeConnections.length, this._count)) {
                                    invalidNodeIds.push(node.id);
                                }
                            }
                        }.bind(this));

                        break;
                    }
                    case checkBothDirections:
                    {
                        if (this._type.toLowerCase() === "out") {
                            nodes.forEach(function (node) {
                                var isApplicable = (node.connectors.indexOf(this._connector) !== -1) && (node.type === this._from || node.subtype === this._from);
                                if (isApplicable) {
                                    var nodeConnections = findNodesConnectionBothDirections(node.id, "from", this._connector, this._to, connections);
                                    if (!isValid(nodeConnections.length, this._count)) {
                                        invalidNodeIds.push(node.id);
                                    }
                                }
                            }.bind(this));
                        } else {
                            nodes.forEach(function (node) {
                                var isApplicable = (node.connectors.indexOf(this._connector) !== -1) && (node.type === this._to || node.subtype === this._to);
                                if (isApplicable) {
                                    var nodeConnections = findNodesConnectionBothDirections(node.id, "to", "in", this._from, connections);
                                    if (!isValid(nodeConnections.length, this._count)) {
                                        invalidNodeIds.push(node.id);
                                    }
                                }
                            }.bind(this));
                        }

                        break;
                    }
                }

                return {
                    valid: invalidNodeIds.length === 0,
                    message: this._errorMessage,
                    invalidNodeIds: invalidNodeIds
                };
            },
            _countParamIsValid: function (count) {
                return !(ng.isUndefined(count) || count === null || count < 0 || typeof count !== "number");
            },
            _fromParamIsDefined: function (from) {
                return !(ng.isUndefined(from) || from === null || from === "");
            },
            _toParamIsDefined: function (to) {
                return !(ng.isUndefined(to) || to === null || to === "");
            },
            _typeParamIsValid: function (type) {
                var isDefined = !(ng.isUndefined(type) || type === null || type === "");
                if (isDefined) {
                    return ["out", "in"].indexOf(type.toLowerCase()) !== -1;
                } else {
                    return false;
                }
            },
            _connectorParamIsValid: function (connector) {
                var isDefined = !(ng.isUndefined(connector) || connector === null || connector === "");
                if (isDefined) {
                    return connector.toLowerCase() in NodeConnectors;
                } else {
                    return false;
                }
            }
        };

        function findNodesConnectionSingleDirection(nodeId, direction, connector, connections) {
            var nodeConnections = [];

            connections.forEach(function (connection) {
                var nodeIdMatches = connection.nodes[direction].id === nodeId;
                var connectorMatches = connection.connectors[direction] === connector;

                if (nodeIdMatches && connectorMatches) {
                    nodeConnections.push(connection);
                }
            });

            return nodeConnections;
        }

        function findNodesConnectionBothDirections(nodeId, direction, connector, oppositeType, connections) {
            var nodeConnections = [];
            var oppositeDirection = direction === "from" ? "to" : "from";

            connections.forEach(function (connection) {
                var nodeIdMatches = connection.nodes[direction].id === nodeId;
                var connectorMatches = connection.connectors[direction] === connector;
                var oppositeNodeTypeMatches = connection.nodes[oppositeDirection].type === oppositeType;
                var oppositeNodeSubtypeMatches = connection.nodes[oppositeDirection].subtype === oppositeType;

                if (nodeIdMatches && connectorMatches && (oppositeNodeTypeMatches || oppositeNodeSubtypeMatches)) {
                    nodeConnections.push(connection);
                }
            });

            return nodeConnections;
        }


        return ConnectionOccursRule;
    }

});
