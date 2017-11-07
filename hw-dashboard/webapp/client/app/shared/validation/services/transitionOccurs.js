define(function (require) {
    "use strict";

    var ng = require("angular");

    require('../ngModule').factory('dap.shared.validation.TransitionOccurs', getTransitionOccursFn);

    getTransitionOccursFn.$inject = ["oozie.NodeConnectors"];


    function getTransitionOccursFn(NodeConnectors) {

        function TransitionOccursRule({from, to, connector, convergence, via, notTo}, errorMessage) {
            this._from = from;
            this._to = to;
            this._connector = connector;
            this._convergence = convergence;
            this._via = via;
            this._notTo = notTo;
            this._errorMessage = errorMessage;

            if (!this._fromParamIsDefined(this._from)) {
                throw new Error("Param 'from' should be specified and should not be empty string");
            }

            if (!this._toParamIsDefined(this._to)) {
                throw new Error("Param 'to' should be specified and should not be empty string");
            }

            if (!this._connectorParamIsValid(this._connector)) {
                throw new Error("Connector should be specified and should be one of the following values [" + Object.keys(NodeConnectors) + "], " + connector + " is unexpected");
            }

        }

        TransitionOccursRule.prototype = {
            _validate: function (values) {
                /*jshint -W074*/
                if (ng.isUndefined(values) || !ng.isArray(values.connections)) {
                    throw new Error("Connections should be of Array type");
                }

                var connections = values.connections;

                var invalidNodeIds = [];

                // raise errors if fork passes to the 'end', 'kill', or 'second' 'join'

                const SUBTYPE_FROM = this._from;
                const SUBTYPE_TO = this._to;
                const NODE_START_ID = 'start';
                const CONNECTOR_FROM = this._connector;
                const CONNECTORS_VIA = this._via;
                /**
                 * these types of connection are final so they can't be passed to "TO" node later,
                 * so they are forbidden
                 * @type {[{String}]}
                 */
                const CONNECTORS_FORBIDDEN = this._notTo;

                /**
                 * All connection from one instance of "FROM" node should pass to the single instance of "TO" node
                 * @type {boolean}
                 */
                const CONVERGENCE = this._convergence;

                let tree = fillTree(connections, {nodesJSON: {}, subtypesJSON: {}, root: null});
                var isError = false;
                if (tree.subtypesJSON[SUBTYPE_FROM]) {
                    if (tree.root) {
                        isError = isChildHasNodeError(tree.root, null, null);
                    }

                    Object.keys(tree.subtypesJSON[SUBTYPE_FROM]).forEach((fromNodeId) => {
                        let fromNode = tree.nodesJSON[fromNodeId];
                        if (!fromNode.isVerified) {
                            if (isFromNodeHasError(fromNode)) {
                                invalidNodeIds.push(fromNodeId);
                            }
                        }
                    });
                }

                return {
                    valid: !isError && (invalidNodeIds.length === 0),
                    message: this._errorMessage,
                    invalidNodeIds: invalidNodeIds
                };

                function isConnectorVia(connector) {
                    return CONNECTORS_VIA.indexOf(connector) > -1;
                }

                function isConnectorFrom(connector) {
                    return CONNECTOR_FROM === connector;
                }

                function getNodesConnectorTarget(node, connector) {
                    return node.links[connector];
                }

                function isFromNodeHasError(fromNode) {
                    if (fromNode.isVerified === false) {
                        fromNode.isVerified = true;
                    }
                    return fromNode.connectors
                        .filter((connector) => isConnectorFrom(connector) && getNodesConnectorTarget(fromNode, connector))
                        .some((connector) => getNodesConnectorTarget(fromNode, connector)
                            .some((childNode) => isChildHasNodeError(childNode, fromNode, childNode.id))
                        );
                }


                function isChildHasNodeError(node, fromNode, fromNodePassOutConnector) {
                    if (fromNode && isChildNodeForbidden(node)) {
                        return true;
                    }
                    if (node.subtype === SUBTYPE_TO) {
                        if (CONVERGENCE) {
                            if (!fromNode) {
                                invalidNodeIds.push(node.id);
                                return true;
                            }
                            if (fromNode.foundToNodeId === null) {
                                fromNode.foundToNodeId = node.id;
                            }
                            if (node.foundFromNodeId === null) {
                                node.foundFromNodeId = fromNode.id;
                            }
                            return node.foundFromNodeId !== fromNode.id || fromNode.foundToNodeId !== node.id;
                        }
                        return false;
                    } else {
                        if (CONVERGENCE) {
                            if (node.foundFromNodePassOutConnector === null && fromNode && fromNodePassOutConnector) {
                                node.foundFromNodePassOutConnector = fromNodePassOutConnector;
                            }
                            if (fromNode && node.foundFromNodePassOutConnector !== null) {
                                if (node.foundFromNodePassOutConnector !== fromNodePassOutConnector) {
                                    invalidNodeIds.push(node.id);
                                    return true;
                                }
                            }
                        }
                    }

                    if (node.subtype === SUBTYPE_FROM) {

                        if (isFromNodeHasError(node)) {
                            invalidNodeIds.push(node.id);
                            return true;
                        }
                        if (node.foundToNodeId !== null) {
                            return isNodeChildrenHasErrors(tree.nodesJSON[node.foundToNodeId], fromNode, fromNodePassOutConnector);
                        }
                        return false;
                    }

                    return isNodeChildrenHasErrors(node, fromNode, fromNodePassOutConnector);
                }

                function isNodeChildrenHasErrors(node, fromNode, fromNodePassOutConnector) {
                    return node.connectors
                        .filter((connector) => isConnectorVia(connector) && getNodesConnectorTarget(node, connector))
                        .some((connector) => getNodesConnectorTarget(node, connector)
                            .some((childNode) => isChildHasNodeError(childNode, fromNode, fromNodePassOutConnector))
                        );
                }

                function isChildNodeForbidden(node) {
                    return CONNECTORS_FORBIDDEN.indexOf(node.subtype) > -1;
                }

                function fillTree(connections, tree) {
                    let nodesJSON = tree.nodesJSON;
                    let subtypesJSON = tree.subtypesJSON;

                    connections.forEach(({
                        connectors: {from: fromConnector, to: toConnector},
                        nodes: {
                            from: {
                                id: fromId,
                                subtype: fromSubtype,
                                connectors: fromConnectors,
                            }, to: {
                            id: toId,
                            subtype: toSubtype,
                            connectors: toConnectors
                        }
                        }
                    }) => {
                        let fromNode = fetchOrCreateNode(fromId, fromSubtype, fromConnectors);
                        let toNode = fetchOrCreateNode(toId, toSubtype, toConnectors);
                        setConnector(fromNode, toNode, fromConnector);
                        setConnector(toNode, fromNode, toConnector);

                        let fromSubtypeContainer = fetchOrCreateSubtypeContainer(fromSubtype);
                        fromSubtypeContainer[fromId] = fromNode;
                        let toSubtypeContainer = fetchOrCreateSubtypeContainer(toSubtype);
                        toSubtypeContainer[toId] = toNode;
                    });

                    if (tree.nodesJSON[NODE_START_ID]) {
                        tree.root = tree.nodesJSON[NODE_START_ID];
                    }
                    return tree;

                    function setConnector(fromNode, toNode, fromConnector) {
                        let currentLink = fromNode.links[fromConnector];
                        if (currentLink === null) {
                            fromNode.links[fromConnector] = [];
                        }
                        fromNode.links[fromConnector].push(toNode);
                    }

                    function fetchOrCreateNode(id, subtype, connectors) {
                        if (!nodesJSON[id]) {
                            let links = {};
                            connectors.forEach((linkName) => {
                                links[linkName] = null;
                            });
                            nodesJSON[id] = {
                                id,
                                subtype,
                                connectors,
                                links,
                                foundToNodeId: null,
                                foundFromNodeId: null,
                                foundFromNodePassOutConnector: null,
                                isVerified: false
                            };
                        }
                        return nodesJSON[id];
                    }

                    function fetchOrCreateSubtypeContainer(subtype) {
                        if (!subtypesJSON[subtype]) {
                            subtypesJSON[subtype] = {};
                        }
                        return subtypesJSON[subtype];
                    }

                }
            },
            _fromParamIsDefined: function (from) {
                return !(ng.isUndefined(from) || from === null || from === "");
            },
            _toParamIsDefined: function (to) {
                return !(ng.isUndefined(to) || to === null || to === "");
            },
            _connectorParamIsValid: function (connector) {
                var isDefined = !(ng.isUndefined(connector) || connector === null || connector === "");
                if (isDefined) {
                    return connector.toLowerCase() in NodeConnectors;
                } else {
                    return false;
                }
            },
            _viaParamIsValid: function (connectors) {
                var isDefinedFn = function (item) {
                    return !(ng.isUndefined(item) || item === null || item === "");
                };
                return ng.isArray(connectors) && connectors.every(
                        (connector) => isDefinedFn(connector) && (connector.toLowerCase() in NodeConnectors));
            }
        };

        TransitionOccurs.prototype = Object.create(TransitionOccursRule.prototype);
        TransitionOccurs.prototype.validate = function (values) {
            return this._validate(values);
        };

        TransitionOccurs.prototype._makeGenericMessage = function ({from, to}) {
            return `All outgoing connections from type "${from}" should pass to the type "${to}"`;
        };

        function TransitionOccurs(ruleObject, errorMessage) {
            var useGenericMessage = ng.isUndefined(errorMessage) || errorMessage === null;
            if (useGenericMessage) {
                errorMessage = this._makeGenericMessage(ruleObject);
            }

            TransitionOccursRule.apply(this, [ruleObject, errorMessage]);
            this.ruleType = "TransitionOccurs";
        }

        return TransitionOccurs;
    }
});
