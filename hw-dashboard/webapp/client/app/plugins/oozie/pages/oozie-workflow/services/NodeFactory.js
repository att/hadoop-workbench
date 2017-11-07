define(function (require) {
        "use strict";

        var ng = require("angular");
        NodeFactory.$inject = ["oozie.models.Node", "flume.gridOffset", 'shared.jsonSchemaBuilder'];

        require("../ngModule").service("oozie.services.nodeFactory", NodeFactory);
        function NodeFactory(Node, gridOffset, jsonSchemaBuilder) {

            var nodeConstructors = {};

            this.createNodeConstructors = function (subtypes, types) {
                for (var typeName in subtypes) {
                    subtypes[typeName].forEach(function (subtype) {
                        var connectors = getConnectors(typeName, types, subtype);
                        if (connectors !== null) {
                            createMixedNodeConstructor(typeName, subtype.name, subtype.version, subtype.readonly, subtype.jsonSchema.properties, connectors);
                        }
                    });
                }
            };

            this.getNodeInstance = getNodeInstance;

            function getConnectors(typeName, types, subtype) {
                var connectors = subtype.connectors;
                if (!connectors) {
                    types.forEach(function (type) {
                        if (type.name === typeName) {
                            connectors = type.connectors;
                        }
                    });
                }

                if (!connectors) {
                    console.error("Connectors are not supplied neither for subtype " + subtype.name + ", nor for parent type " + typeName);
                    return null;
                }

                var inlined = [];

                connectors.incoming.forEach(function (connector) {
                    inlined.push(connector);
                });

                connectors.outgoing.forEach(function (connector) {
                    inlined.push(connector);
                });

                return inlined;
            }

            function addConstructorSpot(type, subtype, version) {
                if (ng.isUndefined(nodeConstructors[type])) {
                    nodeConstructors[type] = {};
                }

                if (ng.isUndefined(nodeConstructors[type][subtype])) {
                    nodeConstructors[type][subtype] = {};
                }

                if (ng.isUndefined(nodeConstructors[type][subtype][version])) {
                    nodeConstructors[type][subtype][version] = {};
                }
            }

            function createMixedNodeConstructor(type, subtype, version, readonly, properties, connectors) {
                switch (type) {
                    case "workflow-control":
                    {
                        // workflow controls don't have versions
                        addConstructorSpot(type, subtype);
                        nodeConstructors[type][subtype] = getNodeMixedConstructor(type, subtype, readonly, properties, connectors);
                        break;
                    }
                    case "action":
                    {
                        addConstructorSpot(type, subtype, version);
                        nodeConstructors[type][subtype][version] = getNodeMixedConstructor(type, subtype, readonly, properties, connectors);
                        break;
                    }
                    default :
                    {
                        console.warn("Subtype " + subtype + " is passed for the unknown type " + type);
                    }
                }
            }

            function getNodeMixedConstructor(type, subtype, readonly, properties, connectors) {
                var NodeMixedConstructor = function (data, isAbsoluteCoordinates, offset) {
                    data = data || {};
                    Node.call(this, data, isAbsoluteCoordinates, offset, data.templateId);
                    var generalSchema = {
                        type: "object",
                        title: "General",
                        properties: {
                            id: {
                                type: "string",
                                required: true,
                                readonly: readonly
                            }
                        }
                    };
                    var advancedSchema = {
                        type: "object",
                        title: "Advanced",
                        properties: properties
                    };
                    var dataForGeneral = {
                        id: this.id,
                        type: this.type,
                        subtype: this.subtype
                    };
                    var dataForAdvanced = ng.isString(data.properties) ? JSON.parse(data.properties || "{}") : data.properties;

                    this.properties = {
                        General: jsonSchemaBuilder.createSchema(generalSchema).populate(dataForGeneral),
                        Advanced: jsonSchemaBuilder.createSchema(advancedSchema).populate(dataForAdvanced)
                    };
                    this.connectors = connectors;
                    this.version = data.version;
                };
                NodeMixedConstructor.prototype = Node.prototype;

                return NodeMixedConstructor;
            }

            function getNodeInstance(data, isAbsoluteCoordinates, offset) {
                var NodeMixedConstructor = null;

                switch (data.type) {
                    case "workflow-control":
                    {
                        // workflow controls don't have versions
                        NodeMixedConstructor = nodeConstructors[data.type][data.subtype];
                        break;
                    }
                    case "action":
                    {
                        NodeMixedConstructor = nodeConstructors[data.type][data.subtype][data.version];
                        break;
                    }
                    default :
                    {
                        console.warn("Subtype " + data.subtype + " is passed for the unknown type " + data.type);
                    }
                }


                if (!ng.isUndefined(NodeMixedConstructor)) {
                    return new NodeMixedConstructor(data, isAbsoluteCoordinates, offset !== undefined ? offset : gridOffset);
                } else {
                    console.log("missing metadata for node type - " + data.type + ", subtype - " + data.subtype + ", version - " + data.version);
                }
            }
        }
    }
);
