import {oozieComponentFilesWrapper} from "../models/rest-helper";

/*jshint maxparams: 7*/
define(function (require) {
    "use strict";

    require('../ngModule').provider('oozie.restService', RestProvider);

    // data shared between RestProvider and RestService
    var remoteUrl = '/hw/module/';

    var ng = require("angular");

    var urlTemplates = {
        getTenantFile: remoteUrl + 'oozie-web/api/{0}/templates/workflows/{1}?file={2}',
        saveTenantFile: remoteUrl + 'oozie-web/api/{0}/templates/workflows/{1}?file={2}&overwrite=true',
        uploadTenantFile: remoteUrl + 'oozie-web/api/{0}/templates/workflows/{1}?file={2}&overwrite=true',
        removeTenantFile: remoteUrl + 'oozie-web/api/{0}/templates/workflows/{1}?file={2}',
        renameTenantFile: remoteUrl + 'oozie-web/api/{0}/templates/workflows/{1}?file={2}&to={3}&overwrite=false',
        getTenantFileAsConfig: remoteUrl + 'oozie-web/api/{0}/templates/workflows/{1}?file={2}&format={3}',
        saveTenantFileAsConfig: remoteUrl + 'oozie-web/api/{0}/templates/workflows/{1}?file={2}&format={3}&overwrite=true',
        getTenantComponent: remoteUrl + 'oozie-web/api/{0}/templates/workflows/{1}',
        getTenantComponentFiles: remoteUrl + 'oozie-web/api/{0}/templates/workflows/{1}?operation=list',
        updateTenantComponent: remoteUrl + 'oozie-web/api/{0}/templates/workflows/{1}',

        getMustacheDictionary: remoteUrl + 'oozie-web/api/{0}/templates/mustache',

        getDeployedComponents: remoteUrl +  'oozie-web/api/{0}/platforms/{1}/clusters/{2}/workflows',
        getMetrics: remoteUrl +  'oozie-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/workflows/{4}?metrics=assignments',

        getFileAsConfig: remoteUrl + 'oozie-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/workflows/{4}?file={5}&format={6}',
        saveFileAsConfig: remoteUrl + 'oozie-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/workflows/{4}?file={5}&format={6}&overwrite=true',
        getFile: remoteUrl + 'oozie-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/workflows/{4}?file={5}',
        saveFile: remoteUrl + 'oozie-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/workflows/{4}?file={5}&overwrite=true',
        uploadFile: remoteUrl + 'oozie-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/workflows/{4}?file={5}&overwrite=true',
        removeFile: remoteUrl + 'oozie-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/workflows/{4}?file={5}',
        renameFile: remoteUrl + 'oozie-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/workflows/{4}?file={5}&to={6}&overwrite=false',
        listWorkflowFiles: remoteUrl + 'oozie-web/api/{0}/platforms/{1}/clusters/{2}/services/HDFS/workflows/{3}?operation=listFiles&path={4}',
        listTenantFiles: remoteUrl + 'oozie-web/api/{0}/templates/workflows/{1}?operation=listFiles&path={2}',

        loadOozieModule: remoteUrl + 'oozie-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/workflows/{4}',
        updateWorkflowMeta: remoteUrl + 'oozie-web/api/v1.0/platforms/{0}/clusters/{1}/workflows/{2}',
        loadOozieModuleFiles: remoteUrl + 'oozie-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/workflows/{4}?operation=list',
        loadWorkflow: remoteUrl + '{0}/api/{1}/platforms/{2}/clusters/{3}/services/{4}/workflows/{5}?file={6}&format=workflow',
        saveWorkflow: remoteUrl + '{0}/api/{1}/platforms/{2}/clusters/{3}/services/{4}/workflows/{5}',
        createWorkflow: remoteUrl + '{0}/api/{1}/platforms/{2}/clusters/{3}/services/{4}/workflows/{5}',
        removeWorkflow: remoteUrl + '{0}/api/{1}/platforms/{2}/clusters/{3}/services/{4}/workflows/{5}',
        updateWorkflow: remoteUrl + '{0}/api/{1}/platforms/{2}/clusters/{3}/services/{4}/workflows/{5}?file={6}&format=workflow&overwrite=true',
        updateTenantWorkflow: remoteUrl + 'oozie-web/api/{0}/templates/workflows/{1}?file={2}&format=workflow&overwrite=true',
        getTenantWorkflow: remoteUrl + 'oozie-web/api/{0}/templates/workflows/{1}?file={2}&format=workflow',
        getTemplates: remoteUrl + 'oozie-web/api/{0}/templates/workflows/?version={1}',
        getVersionsList: remoteUrl + 'oozie-web/api/v1.0/supportedVersions',
        createComponent: remoteUrl + 'oozie-web/api/v1.0/templates/workflows',
        deployComponent: remoteUrl + 'oozie-web/api/v1.0/deploy',
        loadTenantsList: remoteUrl + 'oozie-web/api/{0}/templates/nodes?type={1}&version={2}',
        downloadTenantWorkflow: remoteUrl + 'oozie-web/api/v1.0/templates/workflows/{0}?operation=download',
        downloadWorkflow: remoteUrl + '{0}/api/{1}/platforms/{2}/clusters/{3}/services/{4}/workflows/{5}?operation=download',

        convertFile: remoteUrl + 'oozie-web/api/v1.0/platforms/{0}/clusters/{1}/services/{2}/workflows/{3}?file={4}&format={5}&operation=convert',
        convertTenantFile: remoteUrl + 'oozie-web/api/v1.0/templates/workflows/{0}?file={1}&format={}&operation=convert',

        copyFilesFromPlatform: remoteUrl + 'oozie-web/api/v1.0/platforms/{0}/clusters/{1}/services/{2}/workflows/{3}?operation=copy',
        copyFilesFromTenant: remoteUrl + 'oozie-web/api/v1.0/templates/workflows/{0}?operation=copy',
    };

    function RestProvider() {

        this.setRemoteUrl = function (url) {
            remoteUrl = url;
        };

        this.$get = RestService;
    }

    RestService.$inject = [
        '$q',
        'core.API',
        'oozie.models.Module',
        'oozie.services.nodeFactory',
        'oozie.services.connectionFactory',
        "main.alerts.alertsManagerService",
        'core.utils.string-format',
        'shared.subtypePropertyRestrictionPreprocessor'
    ];

    function RestService($q, API, Module, nodeFactory, connectionFactory, dashboardAlertsManager, stringFormat, subtypeMetadataPreprocessor) {
        return new OozieService($q, API);

        function OozieService($q, API) {

            this.doNotShowError = false;

            this.silent = function () {
                return ng.extend({}, this, {
                    doNotShowError: true
                });
            };

            this.loadOozieModule = function (apiVersion, source) {
                apiVersion = apiVersion || 'v1.0';
                var url = stringFormat(urlTemplates.loadOozieModule, apiVersion, source.platform.id, source.cluster.id, source.service.id, normalizeOozieId(source.module.id));
                /**
                 * Backend do not return module.files = [...] list anymore, setting default files here
                 */
                return API.get(url).then((module) => oozieComponentFilesWrapper(module));
            };

            this.updateWorkflowMeta = function (source, meta) {
                var url = stringFormat(urlTemplates.updateWorkflowMeta, source.platform.id, source.cluster.id, normalizeOozieId(source.module.id));
                return API.put(url, meta);
            };

            this.loadOozieModuleFiles = function (apiVersion, source) {
                apiVersion = apiVersion || 'v1.0';
                var url = stringFormat(urlTemplates.loadOozieModuleFiles, apiVersion, source.platform.id, source.cluster.id, source.service.id, normalizeOozieId(source.module.id));
                return API.get(url).then(({files = []}) => files);
            };

            this.getMetrics = function (source) {
                var url = stringFormat(urlTemplates.getMetrics, 'v1.0', source.platform.id, source.cluster.id, source.service.id, normalizeOozieId(source.module.id));
                return API.get(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getFile = function (apiVersion, source, path, hideSomeErrors) {
                apiVersion = apiVersion || 'v1.0';
                var url = stringFormat(urlTemplates.getFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, normalizeOozieId(source.module.id), path);
                return API.get(url).catch(
                    hideSomeErrors ?
                        processErrorsAndHide.bind(null, this.doNotShowError) :
                        processErrors.bind(null, this.doNotShowError)

                );
            };

            this.removeFile = function (apiVersion, source, path) {
                apiVersion = apiVersion || 'v1.0';
                var url = stringFormat(urlTemplates.removeFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, normalizeOozieId(source.module.id), path);
                return API.delete(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.saveFile = function (apiVersion, source, fileObject) {
                apiVersion = apiVersion || 'v1.0';
                var url = stringFormat(urlTemplates.saveFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, normalizeOozieId(source.module.id), fileObject.path);
                return API.put(url, {
                    text: fileObject.text
                }).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getFileAsConfig = function (apiVersion, source, path, format) {
                format = format || 'keyValue';
                var url = stringFormat(urlTemplates.getFileAsConfig, apiVersion, source.platform.id, source.cluster.id, source.service.id, normalizeOozieId(source.module.id), path, format);
                return API.get(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.saveFileAsConfig = function (apiVersion, source, path, config, format) {
                format = format || 'keyValue';
                var url = stringFormat(urlTemplates.saveFileAsConfig, apiVersion, source.platform.id, source.cluster.id, source.service.id, normalizeOozieId(source.module.id), path, format);
                return API.put(url, {
                    content: {
                        config: config
                    }
                }).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getUploadFileUrl = function (apiVersion, source, path) {
                return stringFormat(urlTemplates.uploadFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, normalizeOozieId(source.module.id), path);
            };

            this.createFolder = function (apiVersion, source, path) {
                if (!/\/$/.test(path)) {
                    path += '/';
                }
                var url = stringFormat(urlTemplates.saveFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, normalizeOozieId(source.module.id), path);
                return API.post(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.removeFolder = function (apiVersion, source, path) {
                if (!/\/$/.test(path)) {
                    path += '/';
                }
                var url = stringFormat(urlTemplates.removeFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, normalizeOozieId(source.module.id), path);
                return API.delete(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.renameOrMoveFolder = function (apiVersion, source, fromPath, toPath) {
                if (!/\/$/.test(fromPath)) {
                    fromPath += '/';
                }
                if (!/\/$/.test(toPath)) {
                    toPath += '/';
                }
                var url = stringFormat(urlTemplates.renameFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, normalizeOozieId(source.module.id), fromPath, toPath);
                return API.post(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.renameOrMoveFile = function (apiVersion, source, fromPath, toPath) {
                var url = stringFormat(urlTemplates.renameFile, apiVersion, source.platform.id, source.cluster.id, source.service.id, normalizeOozieId(source.module.id), fromPath, toPath);
                return API.post(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.listWorkflowFiles = function (source, relativePath) {
                var url = stringFormat(urlTemplates.listWorkflowFiles,
                    'v1.0',
                    source.platform.id,
                    source.cluster.id,
                    normalizeOoziePath(source.path),
                    relativePath);
                return API.get(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.listTenantFiles = function (componentId, relativePath) {
                var url = stringFormat(urlTemplates.listTenantFiles, 'v1.0', componentId, relativePath);
                return API.get(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getTenantWorkflowDownloadPath = function (templateId, path) {
                return stringFormat(urlTemplates.downloadTenantWorkflow, templateId, path);
            };

            this.getWorkflowDownloadPath = function (source, path) {
                return stringFormat(urlTemplates.downloadWorkflow,
                    'oozie-web',
                    'v1.0',
                    source.platform.id,
                    source.cluster.id,
                    source.service.id,
                    normalizeOozieId(source.module.id),
                    path);
            };

            this.loadWorkflow = function (source, path, hideSomeErrors) {
                var url = stringFormat(urlTemplates.loadWorkflow,
                    'oozie-web',
                    'v1.0',
                    source.platform.id,
                    source.cluster.id,
                    source.service.id,
                    normalizeOozieId(source.module.id),
                    normalizeOoziePath(path));

                return API.get(url).then(function (workflow) {
                    if (workflow) {
                        return workflow;
                    } else {
                        return $q.reject({
                            reason: '404',
                            message: 'Server responded with status "success" but sent no workflow'
                        });
                    }
                }).catch(
                    hideSomeErrors ?
                        processErrorsAndHide.bind(null, this.doNotShowError) :
                        processErrors.bind(null, this.doNotShowError)

                );
            }.bind(this);

            this.updateModule = function (module, path) {
                var source = module.source;
                var json = module.toJSON();
                json.visualProperties.positionType = "absolute";

                var url = stringFormat(urlTemplates.updateWorkflow,
                    'oozie-web',
                    'v1.0',
                    source.platform.id,
                    source.cluster.id,
                    source.service.id,
                    normalizeOozieId(source.module.id),
                    path);

                return API.put(url, {
                    content: json
                }).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getTemplates = function (version) {
                return API.get(stringFormat(urlTemplates.getTemplates, 'v1.0', version)).then(function (data) {
                    return data.workflowTemplates;
                });
            };

            this.saveModule = function (module, configDefault) {
                var source = module.source;
                var json = module.toJSON();
                json.config = configDefault;
                json.visualProperties.positionType = "absolute";
                var url = stringFormat(urlTemplates.saveWorkflow,
                    'oozie-web',
                    'v1.0',
                    source.platform.id,
                    source.cluster.id,
                    source.service.id,
                    normalizeOozieId(source.module.id));

                return API.post(url, {
                    workflows: [json]
                }).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getVersionsList = function () {
                return API.get(urlTemplates.getVersionsList).then(function (data) {
                    return data.versions;
                }).catch(processErrors.bind(null, this.doNotShowError));
            };

            /**
             * Example result

            {
                "data": {
                "properties": [
                    {
                        "key": "nameNode"
                    },
                    {
                        "key": "jobTracker"
                    },
                    {
                        "key": "oozie.lib.path"
                    },
                    {
                        "key": "ttt",
                        "description": ""
                    }
                ] }
            }
             */
            this.getMustacheDictionary = function () {
                var url = stringFormat(urlTemplates.getMustacheDictionary, 'v1.0');
                return API.get(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.createComponent = function (data) {
                return API.post(urlTemplates.createComponent, data).then(function (data) {
                    return data.templateId;
                }).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.deployComponent = function (data) {
                return API.post(urlTemplates.deployComponent, data).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.loadTenantsList = function (subtype, version) {
                var url = stringFormat(urlTemplates.loadTenantsList, 'v1.0', subtype, version);
                return API.get(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.loadTenantTemplate = function (templateId) {
                var baseUrl = 'oozie-web/api/v1.0/templates/nodes/';
                var url = remoteUrl + baseUrl + templateId;

                return API.get(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.createModule = function (module, force) {
                var source = module.source;
                var url = stringFormat(urlTemplates.createWorkflow,
                    'oozie-web',
                    'v1.0',
                    source.platform.id,
                    source.cluster.id,
                    source.service.id,
                    normalizeOozieId(source.module.id));
                return API.post(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.removeModule = function (source) {
                var url = stringFormat(urlTemplates.removeWorkflow,
                    'oozie-web',
                    'v1.0',
                    source.platform.id,
                    source.cluster.id,
                    source.service.id,
                    normalizeOozieId(source.module.id));

                return API.delete(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.updateTenantWorkflow = function (apiVersion, templateId, workflow, path) {
                var url = stringFormat(urlTemplates.updateTenantWorkflow, apiVersion, templateId, path);
                var json = workflow.toJSON();
                json.visualProperties.positionType = "absolute";

                return API.put(url, {content: json}).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getNodeTypesMetadata = function (version) {
                return getMetaData("types", version);
            };

            this.getNodeSubtypesMetadata = function (version) {
                return getMetaData("subtypes", version).then(function (metadata) {
                    return subtypeMetadataPreprocessor.unpackRestrictions(metadata);
                });
            };

            this.getConnectionsSubtypesMetadata = function (version) {
                return getMetaData("connections", version);
            };

            this.convertModule = function (source, workflow, files, gridOffset) {
                files = files || [];
                var moduleInstance = null;
                try {
                    moduleInstance = Module.factory(workflow, source);
                    moduleInstance.isSaved = true;
                } catch (e) {
                    console.log("failed to create module because of the error: " + e.message);
                }

                if (moduleInstance !== null && workflow !== null) {

                    // since a connection requires a reference to nodes as parameters `from` and `to`
                    // we need to create nodes before connections
                    var nodes = [];
                    workflow.nodes.forEach(function (node) {
                        node.position = {
                            relative: node.position
                        };
                        if (moduleInstance.visualProperties.positionType === "absolute") {
                            node.position = {
                                absolute: node.position.relative
                            };
                        }
                        try {
                            var nodeInstance = nodeFactory.getNodeInstance(node, moduleInstance.visualProperties.positionType === "absolute", gridOffset);
                            if (nodeInstance) {
                                //set propertyFiles
                                // @TODO: refactor propertyFiles, lazyLoading filtering
                                // "files" are empty here, so no live filtering could be done
                                var nodePropertyFiles = (node.propertyFiles || []).map(function (propertyFile) {
                                    return {
                                        path: "/" + propertyFile.link,
                                        title: propertyFile.title || ("/" + propertyFile.link)
                                    };
                                });

                                nodeInstance.propertyFiles.splice(0);
                                nodeInstance.propertyFiles.push.apply(nodeInstance.propertyFiles, nodePropertyFiles);
                                nodes.push(nodeInstance);
                            }
                        } catch (e) {
                            console.log("failed to create node instance because of the error: " + e.message, e);
                        }
                    });
                    moduleInstance.addNodes(nodes);

                    // since a connection requires a reference to nodes as parameters `from` and `to`
                    // before we start creating connections nodes should already be created

                    var connections = [];
                    workflow.connections.forEach(function (connection) {
                        try {
                            var connectionInstance = buildConnectionInstance(connection.from, connection.to, connection.connector, "in", nodes, connection.properties);
                            connections.push(connectionInstance);
                        } catch (e) {
                            console.log("failed to create connection instance because of the error: " + e.message);
                        }
                    });

                    moduleInstance.addConnections(connections);
                }

                return moduleInstance;
            };

            this.getNodeTemplate = function (apiVersion, templateId) {
                var url = stringFormat(remoteUrl + 'oozie-web/api/{0}/templates/nodes/{1}', apiVersion, templateId);
                return API.get(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getWorkflowTemplate = function (apiVersion, templateId, path, hideSomeErrors) {
                var url = stringFormat(urlTemplates.getTenantWorkflow, apiVersion, templateId, path);
                return API.get(url).catch(
                    hideSomeErrors ?
                        processErrorsAndHide.bind(null, this.doNotShowError) :
                        processErrors.bind(null, this.doNotShowError)

                );
            };

            this.isOozieWorkflowExists = function (apiVersion, platformId, clusterId, serviceId, workflowPath, workflowName) {
                var mode = 'mode=exists';
                var startsWithSlash = startsWith(workflowPath, '/');
                var endsWithSlash = endsWith(workflowPath, '/');
                var path = workflowPath;

                if (startsWithSlash) {
                    path = path.substr(1);
                }

                if (endsWithSlash) {
                    path = path.substr(0, path.length - 1);
                }

                var url = stringFormat(remoteUrl + 'oozie-web/api/{0}/platforms/{1}/clusters/{2}/services/{3}/workflows/{4}?{5}', apiVersion, platformId, clusterId, serviceId, path, mode);
                return API({
                    url: url,
                    moduleId: workflowName
                }).then(function (response) {
                    return response.data.data;
                }, processErrors);
            };

            this.getTenantFile = function (apiVersion, tenantId, path, hideSomeErrors) {
                var url = stringFormat(urlTemplates.getTenantFile, apiVersion, tenantId, path);
                return API.get(url).catch(
                    hideSomeErrors ?
                        processErrorsAndHide.bind(null, this.doNotShowError) :
                        processErrors.bind(null, this.doNotShowError)
                );
            };

            this.saveTenantFile = function (apiVersion, tenantId, file) {
                var url = stringFormat(urlTemplates.saveTenantFile, apiVersion, tenantId, file.path);
                return API.put(url, {
                    text: file.text
                }).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.removeTenantFile = function (apiVersion, tenantId, path) {
                var url = stringFormat(urlTemplates.removeTenantFile, apiVersion, tenantId, path);
                return API.delete(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getTenantFileAsConfig = function (apiVersion, tenantId, path, format) {
                format = format || 'keyValue';
                var url = stringFormat(urlTemplates.getTenantFileAsConfig, apiVersion, tenantId, path, format);
                return API.get(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.saveTenantFileAsConfig = function (apiVersion, tenantId, path, config, format) {
                format = format || 'keyValue';
                var url = stringFormat(urlTemplates.saveTenantFileAsConfig, apiVersion, tenantId, path, format);
                return API.put(url, {
                    content: {
                        config: config
                    }
                });
            };

            this.getTenantUploadFileUrl = function (apiVersion, tenantId, path) {
                return stringFormat(urlTemplates.uploadTenantFile, apiVersion, tenantId, path);
            };

            this.createTenantFolder = function (apiVersion, tenantId, path) {
                if (!/\/$/.test(path)) {
                    path += '/';
                }
                var url = stringFormat(urlTemplates.saveTenantFile, apiVersion, tenantId, path);
                return API.post(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.removeTenantFolder = function (apiVersion, tenantId, path) {
                if (!/\/$/.test(path)) {
                    path += '/';
                }
                var url = stringFormat(urlTemplates.removeTenantFile, apiVersion, tenantId, path);
                return API.delete(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.renameOrMoveTenantFolder = function (apiVersion, tenantId, fromPath, toPath) {
                if (!/\/$/.test(fromPath)) {
                    fromPath += '/';
                }
                if (!/\/$/.test(toPath)) {
                    toPath += '/';
                }
                var url = stringFormat(urlTemplates.renameTenantFile, apiVersion, tenantId, fromPath, toPath);
                return API.post(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.renameOrMoveTenantFile = function (apiVersion, tenantId, fromPath, toPath) {
                var url = stringFormat(urlTemplates.renameTenantFile, apiVersion, tenantId, fromPath, toPath);
                return API.post(url).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getTenantComponent = function (apiVersion, tenantComponentId) {
                var url = stringFormat(urlTemplates.getTenantComponent, apiVersion, tenantComponentId);
                /**
                 * Backend do not return module.files = [...] list anymore, setting default files here
                 */
                return API.get(url).then((component) => oozieComponentFilesWrapper(component)).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getTenantComponentFiles = function (apiVersion, tenantComponentId) {
                var url = stringFormat(urlTemplates.getTenantComponentFiles, apiVersion, tenantComponentId);
                return API.get(url).then(({files = []}) => files).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.updateTenantComponent = function (tenantId, data) {
                var url = stringFormat(urlTemplates.updateTenantComponent, 'v1.0', tenantId);
                return API.put(url, data).catch(processErrors.bind(null, this.doNotShowError));
            };

            /**
             * @param source
             * @param {string}path
             * @param {string|Object}data - file content (if textToContent is true) or workflow in format "workflow"
             * @param {boolean}textToContent - true if need to convert text to content, false - if content to text
             * @returns {*}
             */
            this.convertFile = function (source, path, data, textToContent) {
                var url = stringFormat(urlTemplates.convertFile,
                    source.platform.id,
                    source.cluster.id,
                    source.service.id,
                    normalizeOozieId(source.module.id),
                    path,
                    textToContent ? 'workflow' : 'text');
                var json = {};
                json[textToContent ? 'text' : 'content'] = data;

                return API.post(url, json)
                    .then(function (data) {
                        return data[textToContent ? 'content' : 'text'];
                    })
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            /**
             * @param tenantId
             * @param {string}path
             * @param {string|Object}data - file content (if textToContent is true) or workflow in format "workflow"
             * @param {boolean}textToContent - true if need to convert text to content, false - if content to text
             * @returns {*}
             */
            this.convertTenantFile = function (tenantId, path, data, textToContent) {
                var url = stringFormat(urlTemplates.convertTenantFile,
                    tenantId,
                    path,
                    textToContent ? 'workflow' : 'text');
                var json = {};
                json[textToContent ? 'text' : 'content'] = data;

                return API.post(url, json)
                    .then(function (data) {
                        return data[textToContent ? 'content' : 'text'];
                    })
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.copyFilesFromPlatform = function (flatSource, flatTarget, fileList) {
                var url = stringFormat(urlTemplates.copyFilesFromPlatform, flatSource.platformId, flatSource.clusterId, flatSource.serviceId, normalizeOoziePath(flatSource.moduleId));
                return API.post(url, ng.extend({}, flatTarget, {files: fileList})).catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getDeployedComponents = function (source) {
                var url = stringFormat(urlTemplates.getDeployedComponents, 'v1.0', source.platform.id, source.cluster.id);
                return API.get(url, {}).catch(processErrors.bind(null, this.doNotShowError));
            };


            this.copyFilesFromTenant = function (flatSource, flatTarget, fileList) {
                var url = stringFormat(urlTemplates.copyFilesFromTenant, flatSource.templateId);
                return API.post(url, ng.extend({}, flatTarget, {files: fileList})).catch(processErrors.bind(null, this.doNotShowError));
            };

            var getMetaData = function (metadataType, _workflowVersion) {
                var baseUrl = 'oozie-web/api/v1.0/metadata/';
                var workflowVersion = _workflowVersion ? "/" + _workflowVersion : "";
                return API.get(remoteUrl + baseUrl + metadataType + workflowVersion);
            };

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

            function processErrors(doNotShowError, error) {
                if (!doNotShowError) {
                    var errorMessage = {
                        title: "Server error",
                        text: error.message
                    };
                    dashboardAlertsManager.addAlertError(errorMessage);
                }
                return $q.reject(error);
            }

            function processErrorsAndHide(doNotShowError, error) {
                if (!doNotShowError && !isSilentAlertOnDirectoryRequest(error)) {
                    var errorMessage = {
                        title: "Server error",
                        text: error.message
                    };
                    dashboardAlertsManager.addAlertError(errorMessage);
                }

                return $q.reject(error);
            }
        }

        function isSilentAlertOnDirectoryRequest(error) {
            if (error.message) {
                return error.message.indexOf('Is a directory') !== -1 || error.message.indexOf('not found') !== -1 || error.message.indexOf('Not found') !== -1;
            }
            return false;
        }

        function normalizeOozieId(id) {
            return id.replace(/^(\/+)/, '');
        }

        function normalizeOoziePath(path) {
            return path.replace(/^(\/+)/, '');
        }

        function startsWith(str, prefix) {
            return str.indexOf(prefix) === 0;
        }

        function endsWith(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        }
    }

});
