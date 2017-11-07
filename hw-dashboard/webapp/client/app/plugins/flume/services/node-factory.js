define(function (require) {
        "use strict";

        var ng = require("angular");
        NodeFactory.$inject = ["flume.models.Node", "flume.gridOffset", "flume.models.NodeProperty"];

        require("../ngModule").service("flume.services.nodeFactory", NodeFactory);
        function NodeFactory(Node, gridOffset, NodeProperty) {

            var TYPE_SUBTYPE_SEPARATOR = "$$$";
            var subtypesDefaultProperties = {};

            function setupSubtypeDefaultProperties(subtypes) {
                for (var typeName in subtypes) {
                    subtypes[typeName].forEach(function (subtype) {
                        var joinedId = typeName + TYPE_SUBTYPE_SEPARATOR + subtype.name;
                        subtypesDefaultProperties[joinedId] = subtype.properties;
                    });
                }
            }

            this.createNodeConstructors = function (data) {
                setupSubtypeDefaultProperties(data.subtypes);
            };

            this.getNodeInstance = getNodeInstance;

            function getConnectors(typeName) {
                var connectors = [];

                switch (typeName) {
                    case "source":
                    {
                        connectors = ["out"];
                        break;
                    }
                    case "sink":
                    {
                        connectors = ["in"];
                        break;
                    }
                    case "channel":
                    {
                        connectors = ["in", "out"];
                        break;
                    }
                }

                return connectors;
            }

            function NodeMixedConstructor(isNew, data, isAbsoluteCoordinates, offset, connectors) {
                data = data || {};
                Node.call(this, data, isAbsoluteCoordinates, offset);

                this.connectors = connectors;
                this.properties = [];

                var subtype = (data.properties && data.properties.originalSubtype ? data.properties.originalSubtype : data.subtype);
                var joinedId = data.type + TYPE_SUBTYPE_SEPARATOR + subtype;
                var defaultProperties = subtypesDefaultProperties[joinedId];

                if (data.properties) {
                    isNew = false;
                }

                if (isNew) {
                    addDefaultBasedProperties(this.properties, defaultProperties, data.properties);
                    addOriginalSubtypeProperty(this.subtype, this.properties);
                } else {
                    var isSubtypeChanged = ng.isUndefined(defaultProperties);
                    if (isSubtypeChanged) {
                        var originalSubtype = data.properties.originalSubtype || null;
                        joinedId = data.type + TYPE_SUBTYPE_SEPARATOR + originalSubtype;
                        defaultProperties = subtypesDefaultProperties[joinedId];
                        addOriginalSubtypeProperty(originalSubtype, this.properties);
                    } else {
                        addOriginalSubtypeProperty(data.subtype, this.properties);
                    }

                    // remove originalSubtype property to exclude it from being iterated inside addDataBasedProperties()
                    delete data.properties.originalSubtype;
                    addDataBasedProperties(this.properties, data.properties, defaultProperties);
                }
            }

            function addOriginalSubtypeProperty(subtype, properties) {
                if (subtype === null) {
                    return false;
                }

                var originalSubtypePropertyData = {
                    key: "originalSubtype",
                    value: subtype,
                    required: true,
                    defaultValue: null,
                    isServiceProperty: true,
                    isEditable: false,
                    isVisible: false,
                    isRemovable: false
                };
                var originalSubtypeProperty = NodeProperty.factory(originalSubtypePropertyData);
                properties.push(originalSubtypeProperty);
            }

            function addDefaultBasedProperties(properties, defaultProperties, customProperties) {
                defaultProperties.forEach(function (property) {
                    var prop = {
                        key: property.name,
                        value: (customProperties && customProperties[property.name]) || property.defaultValue || "",
                        required: property.required || false,
                        defaultValue: property.defaultValue || null,
                        isServiceProperty: false,
                        isEditable: true,
                        isVisible: true,
                        isRemovable: false
                    };

                    properties.push(prop);
                });
            }

            function addDataBasedProperties(properties, dataProperties, defaultProperties) {
                // clone data properties so that when later some properties will be deleted we don't modify the original object
                var dataPropertiesClone = ng.copy(dataProperties);

                if (!ng.isUndefined(defaultProperties)) {
                    defaultProperties.forEach(function (property) {
                        // name is taken from metadata
                        var propertyName = property.name;
                        // value is taken from real data or from default value if its absent
                        var propertyValue = (dataProperties && dataPropertiesClone[propertyName]) || property.defaultValue || null;

                        var prop = {
                            key: propertyName,
                            value: propertyValue,
                            required: property.required || false,
                            defaultValue: property.defaultValue || null,
                            isServiceProperty: false,
                            isEditable: true,
                            isVisible: true,
                            isRemovable: false
                        };

                        properties.push(prop);

                        // remove the property as it's already added to the node's properties
                        // it will also be excluded from iteration (ng.forEach) below
                        delete dataPropertiesClone[propertyName];
                    });
                }

                ng.forEach(dataPropertiesClone, function (propertyValue, propertyName) {
                    var initData = {
                        key: propertyName,
                        value: propertyValue || "",
                        required: false,
                        defaultValue: null,
                        isServiceProperty: false,
                        isEditable: true,
                        isVisible: true,
                        isRemovable: true
                    };

                    var property = NodeProperty.factory(initData);
                    properties.push(property);
                });
            }

            NodeMixedConstructor.prototype = Node.prototype;

            function getNodeInstance(isNew, data, isAbsoluteCoordinates) {
                return new NodeMixedConstructor(isNew, data, isAbsoluteCoordinates, gridOffset, getConnectors(data.type));
            }
        }

    }
);
