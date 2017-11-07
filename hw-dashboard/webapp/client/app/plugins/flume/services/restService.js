/*jshint maxparams: 8*/
define(function (require) {
    "use strict";

    require('../ngModule').provider('flume.restService', RestProvider);

    // data shared between RestProvider and RestService
    var remoteUrl = '/hw/module/';
    var apiVersion = "v1.0";
    var baseUrl = "flume-web/api/" + apiVersion + "/";

    var urlTemplates = {
        getAgent: remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}',
        getMetrics: remoteUrl + baseUrl + 'platforms/{0}/clusters/{1}/services/{2}/agents/{3}?metrics=assignments',
        getTenantFile: remoteUrl + 'flume-web/api/{0}/templates/agents/{1}?file={2}',
        saveTenantFile: remoteUrl + 'flume-web/api/{0}/templates/agents/{1}?file={2}&overwrite=true',
        uploadTenantFile: remoteUrl + 'flume-web/api/{0}/templates/agents/{1}?file={2}&overwrite=false',
        removeTenantFile: remoteUrl + 'flume-web/api/{0}/templates/agents/{1}?file={2}',
        renameTenantFile: remoteUrl + 'flume-web/api/{0}/templates/agents/{1}?file={2}&to={3}&overwrite=false',
        saveTenantPipeline: remoteUrl + 'flume-web/api/{0}/templates/agents/{1}?file={2}&format=flume&overwrite=true',
        getTenantComponent: remoteUrl + 'flume-web/api/{0}/templates/agents/{1}',
        getTenantComponentFiles: remoteUrl + 'flume-web/api/{0}/templates/agents/{1}?operation=list',
        updateTenantComponent: remoteUrl + 'flume-web/api/{0}/templates/agents/{1}',

        getMustacheDictionary: remoteUrl + 'flume-web/api/{0}/templates/mustache',

        deployComponent: remoteUrl + "flume-web/api/{0}/deploy",
        saveFile: remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}?file={5}&overwrite=true',
        uploadFile: remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}?file={5}&overwrite=true',
        removeFile: remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}?file={5}',
        renameFile: remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}?file={5}&to={6}&overwrite=true',
        downloadTenantPipeline: remoteUrl + baseUrl + 'templates/agents/{0}?operation=download',
        downloadPipeline: remoteUrl + baseUrl + 'platforms/{0}/clusters/{1}/services/{2}/agents/{3}?operation=download',
        fetchInstancesAndAvailableHosts: remoteUrl + baseUrl + 'platforms/{0}/clusters/{1}/services/{2}/agents/{3}/instances',
        refreshInstancesAndAvailableHosts: remoteUrl + baseUrl + 'platforms/{0}/clusters/{1}/services/{2}/agents/{3}/instances?action=refresh',
        createInstance: remoteUrl + baseUrl + 'platforms/{0}/clusters/{1}/services/{2}/agents/{3}/instances',
        removeInstance: remoteUrl + baseUrl + 'platforms/{0}/clusters/{1}/services/{2}/agents/{3}/instances/{4}',
        runInstanceAction: remoteUrl + baseUrl + 'platforms/{0}/clusters/{1}/services/{2}/agents/{3}/instances/{4}?action={5}'
    };

    function RestProvider() {

        this.setRemoteUrl = function (url) {
            remoteUrl = url;
        };

        this.setApiVersion = function (api) {
            apiVersion = api;
        };

        this.setBaseUrl = function (url) {
            baseUrl = url;
        };

        this.$get = RestService;
    }

    RestService.$inject = [
        '$q',
        'core.API',
        'flume.models.Module',
        'flume.models.ServiceInstance',
        'flume.models.NodeCounter',
        'flume.services.nodeFactory',
        'oozie.services.connectionFactory',
        "main.alerts.alertsManagerService",
        'core.utils.string-format'
    ];
    function RestService($q, API, Module, ServiceInstance, NodeCounter, nodeFactory, connectionFactory, dashboardAlertsManager, stringFormat) {
        return new FlumeService($q, API);

        function FlumeService($q, API) {
            this.getAgent = function (apiVersion, source) {
                var url = stringFormat(urlTemplates.getAgent, apiVersion, source.platform.id, source.cluster.id, source.service.id, source.module.id);

                return API.get(url).catch(processErrors);
            }.bind(this);

            this.getMetrics = function (source) {
                var url = stringFormat(urlTemplates.getMetrics, source.platform.id, source.cluster.id, source.service.id, source.module.id);
                return API.get(url).catch(processErrors);
            };

            this.updateAgent = function (source, agent) {
                var url = stringFormat(urlTemplates.getAgent, apiVersion, source.platform.id, source.cluster.id, source.service.id, source.module.id);

                return API.put(url, agent);
            };

            this.getFile = function (apiVersion, source, path) {
                apiVersion = apiVersion || 'v1.0';
                var tmp = remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}?file={5}';
                var url = stringFormat(tmp, apiVersion, source.platform.id, source.cluster.id, source.service.id, source.module.id, path);
                return API.get(url).catch(processErrors);
            };

            this.removeFile = function (apiVersion, source, path) {
                apiVersion = apiVersion || 'v1.0';
                var url = stringFormat(urlTemplates.removeFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, source.module.id, path);
                return API.delete(url).catch(processErrors);
            };

            this.getTemplates = function () {
                return API.get(remoteUrl + "flume-web/api/v1.0/templates/agents").then(function (response) {
                    return response.templates;
                });
            };

            this.createComponent = function (data) {
                var url = remoteUrl + "flume-web/api/v1.0/templates/agents";
                return API.post(url, data).then(function (response) {
                    return response.templateId;
                }).catch(processErrors);
            };

            this.getTenantComponent = function (apiVersion, tenantId) {
                var url = stringFormat(urlTemplates.getTenantComponent, apiVersion, tenantId);
                return API.get(url).catch(processErrors);
            };

            this.getTenantComponentFiles = function (apiVersion, tenantComponentId) {
                var url = stringFormat(urlTemplates.getTenantComponentFiles, apiVersion, tenantComponentId);
                return API.get(url).then(({files = []}) => files).catch(processErrors);
            };

            this.getTenantPipelineDownloadPath = function (templateId, path) {
                return stringFormat(urlTemplates.downloadTenantPipeline, templateId, path);
            };

            this.getPipelineDownloadPath = function (source, path) {
                return stringFormat(urlTemplates.downloadPipeline, source.platform.id, source.cluster.id, source.service.id, source.module.id, path);
            };

            this.saveFile = function (apiVersion, source, fileObject) {
                apiVersion = apiVersion || 'v1.0';
                var url = stringFormat(urlTemplates.saveFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, source.module.id, fileObject.path);
                return API.put(url, {
                    text: fileObject.text
                }).catch(processErrors);
            };

            this.getUploadFileUrl = function (apiVersion, source, path) {
                return stringFormat(urlTemplates.uploadFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, source.module.id, path);
            };

            this.getFileAsPipeline = function (apiVersion, source, path) {
                var tmp = remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}?file={5}&format=flume';
                var url = stringFormat(tmp, apiVersion, source.platform.id, source.cluster.id, source.service.id, source.module.id, path);

                return API.get(url).catch(processErrors);
            }.bind(this);

            this.createFolder = function (apiVersion, source, path) {
                if (!/\/$/.test(path)) {
                    path += '/';
                }
                var url = stringFormat(urlTemplates.saveFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, source.module.id, path);
                return API.post(url).catch(processErrors);
            };

            this.removeFolder = function (apiVersion, source, path) {
                if (!/\/$/.test(path)) {
                    path += '/';
                }
                var url = stringFormat(urlTemplates.removeFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, source.module.id, path);
                return API.delete(url).catch(processErrors);
            };

            this.renameOrMoveFolder = function (apiVersion, source, fromPath, toPath) {
                if (!/\/$/.test(fromPath)) {
                    fromPath += '/';
                }
                if (!/\/$/.test(toPath)) {
                    toPath += '/';
                }
                var url = stringFormat(urlTemplates.renameFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, source.module.id, fromPath, toPath);
                return API.post(url).catch(processErrors);
            };

            this.renameOrMoveFile = function (apiVersion, source, fromPath, toPath) {
                var url = stringFormat(urlTemplates.renameFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, source.module.id, fromPath, toPath);
                return API.post(url).catch(processErrors);
            };


            this.deployComponent = function (data) {
                var url = stringFormat(urlTemplates.deployComponent, apiVersion);
                return API.post(url, data).then(function (response) {
                    processDeploymentErrorsAndAlertThem(response);
                    return response.moduleId;
                }, processErrors);
            };

            this.updateModule = function (source, module, path) {
                var tmp = remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}?file={5}&format=flume&overwrite=true';
                var url = stringFormat(tmp, apiVersion, source.platform.id, source.cluster.id, source.service.id, source.module.id, path);

                var moduleJson = module.toJSON();
                moduleJson.visualProperties.positionType = "absolute";
                var json = {
                    content: moduleJson
                };

                return API.put(url, json);
            };

            this.removeModule = function (source, forceDelete) {
                if (forceDelete === undefined) {
                    forceDelete = false;
                }
                var urlTemplate = remoteUrl + "flume-web/api/v1.0/platforms/{0}/clusters/{1}/services/{2}/agents/{3}?force={4}";
                var url = stringFormat(urlTemplate, source.platform.id, source.cluster.id, source.service.id, source.module.id, forceDelete);
                return API.delete(url)
                    .catch(processErrors);
            };

            this.getNodeTypesMetadata = function () {
                return getMetaData("types");
            };

            this.getNodeSubtypesMetadata = function (subtype) {
                return getMetaData("subtypes");
            };

            this.getConnectionsSubtypesMetadata = function () {
                return getMetaData("connections");
            };

            this.getPipelineTemplate = function (version, templateId, path) {
                var urlTemplate = remoteUrl + 'flume-web/api/{0}/templates/agents/{1}?file={2}&format=flume';
                var url = stringFormat(urlTemplate, version, templateId, path);
                return API.get(url).catch(processErrors);
            };

            this.getServiceInstances = function (apiVersion, platformId, clusterId, serviceId, agentId) {
                var urlTemplate = remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}/instances';
                var url = stringFormat(urlTemplate, apiVersion, platformId, clusterId, serviceId, agentId);
                return API.get(url).then(function (response) {
                    return response.instances;
                }, processErrors).then(ServiceInstance.processApiResponse);
            };

            this.getServiceInstancesAndAvailableHosts = function (apiVersion, platformId, clusterId, serviceId, agentId) {
                var urlTemplate = remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}/instances';
                var url = stringFormat(urlTemplate, apiVersion, platformId, clusterId, serviceId, agentId);
                return API.get(url)
                    .then(function (response) {
                        response.instances = ServiceInstance.processApiResponse(response.instances);
                        return response;
                    })
                    .catch(processErrors);
            };

            this.getServiceInstancesAvailableHosts = function (apiVersion, platformId, clusterId, serviceId, agentId) {
                var urlTemplate = remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}/instances';
                var url = stringFormat(urlTemplate, apiVersion, platformId, clusterId, serviceId, agentId);
                return API.get(url)
                    .then(function (response) {
                        return response.availableHosts;
                    })
                    .catch(processErrors);
            };

            /**
             * Resolves with instanceId ({string})
             * @param apiVersion
             * @param platformId
             * @param clusterId
             * @param serviceId
             * @param agentId
             * @param data
             * @returns {$q.Promise}
             */
            this.createServiceInstance = function (apiVersion, platformId, clusterId, serviceId, agentId, data) {
                var urlTemplate = remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}/instances';
                var url = stringFormat(urlTemplate, apiVersion, platformId, clusterId, serviceId, agentId);
                return API.post(url, data).then(function (response) {
                    return response.instanceId;
                }, processErrors);
            };

            this.removeServiceInstance = function (apiVersion, platformId, clusterId, serviceId, agentId, instanceId) {
                var urlTemplate = remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}/instances/{5}';
                var url = stringFormat(urlTemplate, apiVersion, platformId, clusterId, serviceId, agentId, instanceId);
                return API.delete(url).catch(processErrors);
            };

            this.provisionServiceInstance = function (apiVersion, platformId, clusterId, serviceId, agentId, instanceId) {
                var urlTemplate = remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}/instances/{5}?action=deploy';
                var url = stringFormat(urlTemplate, apiVersion, platformId, clusterId, serviceId, agentId, instanceId);
                return API.put(url, null).catch(processErrors);
            };

            this.controlServiceInstance = function (apiVersion, platformId, clusterId, serviceId, agentId, instanceId, action) {
                var urlTemplate = remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}/instances/{5}?action={6}';
                var url = stringFormat(urlTemplate, apiVersion, platformId, clusterId, serviceId, agentId, instanceId, action);
                return API.put(url, null).catch(processErrors);
            };

            this.provisionServiceInstances = function (apiVersion, platformId, clusterId, serviceId, agentId) {
                var urlTemplate = remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}/instances/plugins';
                var url = stringFormat(urlTemplate, apiVersion, platformId, clusterId, serviceId, agentId);
                return API.put(url).catch(processErrors);
            };

            this.pullServiceInstance = function (apiVersion, platformId, clusterId, serviceId, agentId) {
                var urlTemplate = remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}/instances?action=pull';
                var url = stringFormat(urlTemplate, apiVersion, platformId, clusterId, serviceId, agentId);
                return API.post(url, {}).then(function (response) {
                    return response;
                }, processErrors);
            };

            this.pushServiceInstance = function (apiVersion, platformId, clusterId, serviceId, agentId) {
                var urlTemplate = remoteUrl + 'flume-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/agents/{4}/instances?action=push';
                var url = stringFormat(urlTemplate, apiVersion, platformId, clusterId, serviceId, agentId);
                return API.post(url, {}).then(function (response) {
                    return response;
                }, processErrors);
            };

            this.convertModule = convertModule;


            this.getTenantFile = function (apiVersion, tenantId, path) {
                var url = stringFormat(urlTemplates.getTenantFile, apiVersion, tenantId, path);
                return API.get(url).catch(processErrors);
            };

            this.saveTenantFile = function (apiVersion, tenantId, file) {
                var url = stringFormat(urlTemplates.saveTenantFile, apiVersion, tenantId, file.path);
                return API.put(url, {
                    text: file.text
                }).catch(processErrors);
            };

            this.createTenantFolder = function (apiVersion, tenantId, path) {
                if (!/\/$/.test(path)) {
                    path += '/';
                }
                var url = stringFormat(urlTemplates.saveTenantFile, apiVersion, tenantId, path);
                return API.post(url).catch(processErrors);
            };

            this.removeTenantFolder = function (apiVersion, tenantId, path) {
                if (!/\/$/.test(path)) {
                    path += '/';
                }
                var url = stringFormat(urlTemplates.removeTenantFile, apiVersion, tenantId, path);
                return API.delete(url).catch(processErrors);
            };

            this.removeTenantFile = function (apiVersion, tenantId, path) {
                var url = stringFormat(urlTemplates.removeTenantFile, apiVersion, tenantId, path);
                return API.delete(url).catch(processErrors);
            };

            this.renameOrMoveTenantFolder = function (apiVersion, tenantId, fromPath, toPath) {
                if (!/\/$/.test(fromPath)) {
                    fromPath += '/';
                }
                if (!/\/$/.test(toPath)) {
                    toPath += '/';
                }
                var url = stringFormat(urlTemplates.renameTenantFile, apiVersion, tenantId, fromPath, toPath);
                return API.post(url).catch(processErrors);
            };

            this.renameOrMoveTenantFile = function (apiVersion, tenantId, fromPath, toPath) {
                var url = stringFormat(urlTemplates.renameTenantFile, apiVersion, tenantId, fromPath, toPath);
                return API.post(url).catch(processErrors);
            };

            this.saveTenantPipeline = function (apiVersion, tenantId, module, path) {
                var url = stringFormat(urlTemplates.saveTenantPipeline, apiVersion, tenantId, path);

                var moduleJson = module.toJSON();
                moduleJson.visualProperties.positionType = "absolute";
                var json = {
                    content: moduleJson
                };

                return API.put(url, json);
            };

            this.getTenantUploadFileUrl = function (apiVersion, tenantId, path) {
                return stringFormat(urlTemplates.uploadTenantFile, apiVersion, tenantId, path);
            };

            this.updateTenantComponent = function (tenantId, data) {
                var url = stringFormat(urlTemplates.updateTenantComponent, 'v1.0', tenantId);
                return API.put(url, data).catch(processErrors);
            };

            this.getMustacheDictionary = function () {
                var url = stringFormat(urlTemplates.getMustacheDictionary, 'v1.0');
                return API.get(url).catch(processErrors);
            };

            this.fetchInstancesAndAvailableHosts = function (source) {
                var url = stringFormat(urlTemplates.fetchInstancesAndAvailableHosts, source.platform.id, source.cluster.id, source.service.id, source.module.id);
                return API.get(url);
            };

            this.refreshInstancesAndAvailableHosts = function (source) {
                var url = stringFormat(urlTemplates.refreshInstancesAndAvailableHosts, source.platform.id, source.cluster.id, source.service.id, source.module.id);
                return API.post(url).catch(processErrors);
            };

            this.createInstance = function (source, data) {
                var url = stringFormat(urlTemplates.createInstance, source.platform.id, source.cluster.id, source.service.id, source.module.id);
                return API.post(url, data).catch(processErrors);
            };

            this.removeInstance = function (source, instanceId) {
                var url = stringFormat(urlTemplates.removeInstance, source.platform.id, source.cluster.id, source.service.id, source.module.id, instanceId);
                return API.delete(url).catch(processErrors);
            };

            this.runInstanceAction = function (source, instanceId, action) {
                var url = stringFormat(urlTemplates.runInstanceAction, source.platform.id, source.cluster.id, source.service.id, source.module.id, instanceId, action);
                return API.post(url).catch(processErrors);
            };

            var getMetaData = function (metadataType) {
                var baseUrl = 'flume-web/api/v1.0/metadata/';
                return API.get(remoteUrl + baseUrl + metadataType).catch(processErrors);
            };

            function convertModule(source, module) {
                var moduleInstance = null;
                try {
                    moduleInstance = Module.factory(module, source);
                    moduleInstance.isSaved = true;
                } catch (e) {
                    console.log("failed to create module because of the error: " + e.message);
                }

                if (moduleInstance !== null) {

                    // since a connection requires a reference to nodes as parameters `from` and `to`
                    // we need to create nodes before connections
                    var nodes = [];
                    module.nodes.forEach(function (node) {
                        node.position = {
                            relative: node.position
                        };
                        if (moduleInstance.visualProperties.positionType === "absolute") {
                            node.position = {
                                absolute: node.position.relative
                            };
                        }
                        try {
                            var nodeInstance = nodeFactory.getNodeInstance(false, node, moduleInstance.visualProperties.positionType === "absolute");
                            if (nodeInstance) {
                                nodes.push(nodeInstance);
                            }
                        } catch (e) {
                            console.log("failed to create node instance because of the error: " + e.message);
                        }
                    });
                    moduleInstance.addNodes(nodes);

                    // since a connection requires a reference to nodes as parameters `from` and `to`
                    // before we start creating connections nodes should already be created

                    var connections = [];
                    module.connections.forEach(function (connection) {
                        try {
                            var connectionInstance = buildConnectionInstance(connection.from, connection.to, "out", "in", nodes, connection.properties);
                            connections.push(connectionInstance);
                        } catch (e) {
                            console.log("failed to create connection instance because of the error: " + e.message);
                        }
                    });
                    moduleInstance.addConnections(connections);

                }
                return moduleInstance;
            }

            function buildConnectionInstance(fromId, toId, outgoingConnectorType, incomingConnectorType, nodes, properties) {
                var from = null;
                var to = null;

                nodes.forEach(function (node) {
                    if (node.id === fromId) {
                        from = node;
                    }
                    if (node.id === toId) {
                        to = node;
                    }
                });

                var newConnection = connectionFactory.getConnectionInstance(from, to, outgoingConnectorType, incomingConnectorType, properties);
                return newConnection;
            }
        }

        function processErrors(error) {
            var errorMessage = {
                title: "Server error",
                text: error.message
            };
            dashboardAlertsManager.addAlertError(errorMessage);

            return $q.reject(error);
        }

        /**
         * Alert deployment errors as alerts warnings
         * 
         * If server founds some non-critical errors, it sets response code to 200 
         * and adds "error" field into response container
         *  {
         *      "data": {
         *          "moduleId": "flume-agent-1459438146754",
         *          "errors": [{
         *              "message": "property {{ddddd}} was not rendered in conf/flume.properties"
         *          }]
         *      }
         *  }
         *
         * @param data
         * @returns {*}
         */
        function processDeploymentErrorsAndAlertThem(data) {
            if (data.errors.length > 0) {
                var errors = "";
                data.errors.forEach(function (error) {
                    errors += error.message + "<br>";
                });

                dashboardAlertsManager.addAlertWarning({
                    title: 'Flume component deployment errors',
                    text: 'Flume component has been deployed with the following errors:\n' + errors
                });
            }
            return data;
        }
    }

});
