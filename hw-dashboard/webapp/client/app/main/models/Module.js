define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory("dap.main.models.Module", getModule);

    getModule.$inject = ['dap.main.models.ServiceDataSource'];
    function getModule(ServiceDataSource) {
        function Module(id, title, isSaved) {

            if (paramsAreInvalid()) {
                throw new Error("Some of constructor parameters are invalid");
            }

            this.id = id;
            this.title = title;
            this.name = '';
            this.type = '';
            this.isSaved = isSaved === true;
            this.source = null;

            this.visualProperties = {
                "positionType": "grid"//or "absolute"
            };

            var nodes = [];
            var connections = [];
            var propertyFilesLoaders = [];

            this.addNodes = addNodes;
            this.addConnections = addConnections;
            this.addPropertyFilesLoaders = addPropertyFilesLoaders;

            this.removeNodes = removeNodes;
            this.removeConnections = removeConnections;

            this.getNodes = getNodes;
            this.getConnections = getConnections;
            this.getPropertyFilesLoaders = getPropertyFilesLoaders;

            this.usedTemplates = [];

            function addNodes(_nodes) {
                if (!ng.isArray(_nodes)) {
                    throw new Error("Array is expected, instead " + typeof _nodes + " is passed");
                }
                nodes = nodes.concat(_nodes);
            }

            function removeNodes(nodesToRemove) {
                if (!ng.isArray(nodesToRemove)) {
                    throw new Error("Array is expected, " + typeof nodesToRemove + " is received");
                }

                nodesToRemove.forEach(function (nodeToRemove) {
                    var index = nodes.indexOf(nodeToRemove);
                    if (index >= 0 && index < nodes.length) {
                        nodes.splice(index, 1);
                    }
                });
            }

            function removeConnections(connectionsToRemove) {
                if (!ng.isArray(connectionsToRemove)) {
                    throw new Error("Array is expected, instead " + typeof connectionsToRemove + " is passed");
                }

                connectionsToRemove.forEach(function (connection) {
                    removeConnection(connection.connection);
                });
            }

            function removeConnection(connectionToRemove) {
                connections.forEach(function (existingConnection, index) {
                    if (connectionToRemove === existingConnection.$connection) {
                        connections.splice(index, 1);
                    }
                });
            }

            function addConnections(_connections) {
                _connections.forEach(function (connection) {
                    connections.push(connection);
                });
            }

            function addPropertyFilesLoaders(_loaders) {
                _loaders.forEach(function (loader) {
                    propertyFilesLoaders.push(loader);
                });
            }

            function getPropertyFilesLoaders() {
                return propertyFilesLoaders;
            }

            function getNodes() {
                return nodes;
            }

            function getConnections() {
                return connections;
            }

            function paramsAreInvalid() {
                /*jshint -W074*/
                var idIsInvalid = ng.isUndefined(id);
                var titleIsInvalid = ng.isUndefined(title);

                return idIsInvalid || titleIsInvalid;
            }
        }

        Module.factory = factory;

        Module.prototype.toJSON = function () {
            return {
                id: this.id,
                title: this.title,
                name: this.name,
                type: 'flume',//this.type,
                nodes: this.getNodes().map(function (n) {
                    return n.toJSON();
                }),
                connections: this.getConnections().map(function (c) {
                    return c.toJSON();
                }),
                visualProperties: {
                    positionType: this.visualProperties.positionType
                }
            };
        };

        function factory(json, source) {
            json = ng.extend({
                id: null,
                name: '',
                title: '',
                type: '',
                visualProperties: {
                    positionType: 'absolute'
                }
            }, json);

            var module = new Module(json.id, json.title);
            module.name = json.name;
            module.type = json.type;
            module.visualProperties.positionType = json.visualProperties.positionType;
            module.source = ServiceDataSource.factory(source);

            return module;
        }

        return Module;
    }
});
