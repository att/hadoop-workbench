define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('oozie-workflow', {
            templateUrl: dapConfig.pathToPlugins + '/oozie/pages/oozie-workflow/views/index.html',
            controller: 'oozieWorkflow.indexController',
            resolve: {
                workflowFiles: ['$widgetParams', function ($widgetParams) {
                    return $widgetParams.params.files;
                }],
                loadedWorkflow: [
                    '$widgetParams',
                    'oozie.restService',
                    "$q",
                    function ($widgetParams, restService, $q) {
                        var file = $widgetParams.params.file;
                        if ($widgetParams.params.isTenantComponent) {
                            return restService.getWorkflowTemplate('v1.0', $widgetParams.params.componentId, file.path, true)
                                .then(function (workflow) {
                                        workflow.path = file.path;
                                        return workflow;
                                    }, function (error) {
                                        // If file path was a directory, server returns 404 error
                                        if (isErrorHasNotFoundStatus(error)) {
                                            // Lets check if file.path was a directory:
                                            var defaultFileFullPath = getDefaultFileFullPath(file);
                                            return restService.getWorkflowTemplate('v1.0', $widgetParams.params.componentId, defaultFileFullPath)
                                                .then(function (workflow) {
                                                    workflow.path = defaultFileFullPath;
                                                    return workflow;
                                                }, function () {
                                                    return null;
                                                });
                                        } else {
                                            return null;
                                        }
                                    }
                                )
                                .catch(function () {
                                    return null;
                                });
                        } else {
                            var source = $widgetParams.params.source;
                            if (source) {
                                return restService.loadWorkflow(source, file.path, true).then(function (workflow) {
                                    workflow.path = file.path;
                                    return workflow;
                                }, function (error) {
                                    // If file path was a directory, server returns 404 error
                                    if (isErrorHasNotFoundStatus(error)) {
                                        // Lets check if file.path was a directory:
                                        var defaultFileFullPath = getDefaultFileFullPath(file);
                                        return restService.loadWorkflow(source, defaultFileFullPath).then(function (workflow) {
                                            workflow.path = defaultFileFullPath;
                                            return workflow;
                                        }, function () {
                                            return null;
                                        });
                                    } else {
                                        return null;
                                    }
                                });
                            } else {
                                return $q.reject({
                                    reason: 'NoData',
                                    message: 'Widget model and source are not defined. Nothing to load'
                                });
                            }
                        }

                        function getDefaultFileFullPath(file) {
                            return file.path + '/' + file.defaultFile;
                        }

                        function isErrorHasNotFoundStatus(error) {
                            return error.status == 404
                        }
                    }],
                workflowData: [
                    'loadedWorkflow',
                    '$widgetParams',
                    'oozie.restService',
                    function (loadedWorkflow, $widgetParams, restService) {
                        let addPropertyFilesFunction = function (files) {
                            let fileList = files.children ? files.children: files;
                            loadedWorkflow.content.propertyFiles = fileList
                                .filter((file) =>
                                    /conf\/.+\.(xml|properties)$/.test(file.path)
                                ).map((file) => {
                                    let title = file.name ?
                                        file.name :
                                        file.path.substr(file.path.lastIndexOf("/") + 1);
                                    return {link: file.path, title: title}
                                });
                            return loadedWorkflow.content;
                        };

                        let handleError = function () {
                            if (loadedWorkflow.content) {
                                loadedWorkflow.content.propertyFiles = [];
                            }

                            return loadedWorkflow.content;
                        };

                        if (loadedWorkflow) {
                            if ($widgetParams.params.isTenantComponent) {
                                let componentId = $widgetParams.params.componentId;
                                return restService.silent().listTenantFiles(componentId, 'conf')
                                    .then(addPropertyFilesFunction)
                                    .catch(handleError);
                            } else {
                                let source = $widgetParams.params.source;
                                if (source.path) {
                                    return restService.silent().listWorkflowFiles(source, 'conf')
                                        .then(addPropertyFilesFunction)
                                        .catch(handleError);
                                } else if (source) {
                                    // Handle workflow deployment scenario when source.path is undefined
                                    return restService.silent().loadOozieModuleFiles('v1.0', source)
                                        .then(addPropertyFilesFunction)
                                        .catch(handleError);
                                }
                            }

                        } else {
                            return null;
                        }
                    }],
                restrictionsServiceInstance: ['dap.shared.validation.RestrictionsService', function (RestrictionsService) {
                    return RestrictionsService.factory();
                }],
                typesMetadata: ['oozie.restService', 'restrictionsServiceInstance', 'loadedWorkflow', function (restService, restrictionsServiceInstance, loadedWorkflow) {
                    var workflowVersion = loadedWorkflow.content.version;
                    return restService.getNodeTypesMetadata(workflowVersion).then(function (data) {
                        restrictionsServiceInstance.processRestrictions(data);
                        return data;
                    }, function () {
                    });
                }],
                subtypesMetadata: ['oozie.restService', 'oozie.services.nodeFactory', 'restrictionsServiceInstance', 'loadedWorkflow', 'typesMetadata', function (restService, nodeFactory, restrictionsServiceInstance, loadedWorkflow, typesMetadata) {
                    var workflowVersion = loadedWorkflow.content.version;
                    return restService.getNodeSubtypesMetadata(workflowVersion).then(function (data) {
                        nodeFactory.createNodeConstructors(data.subtypes, typesMetadata.types);
                        restrictionsServiceInstance.processRestrictions(data);
                        return data;
                    });
                }],
                nodesMetadata: ['subtypesMetadata', function (subtypesMetadata) {
                    var nodeMetadata = [];
                    $.each(subtypesMetadata.subtypes, function (type, subtypes) {
                        var data = {
                            title: type,
                            name: type,
                            type: "node-type",
                            children: []
                        };

                        subtypes.forEach(function (subtype) {
                            data.children.push({
                                version: subtype.version,
                                groupName: type,
                                canHaveTemplates: false,
                                title: subtype.name + (subtype.version ? " " + subtype.version : ""),
                                name: subtype.name,
                                readonly: subtype.readonly,
                                type: "node-subtype"
                            });
                        });

                        nodeMetadata.push(data);
                    });

                    return nodeMetadata;
                }],
                module: [
                    '$q',
                    "subtypesMetadata", // is here because module should be resolved after typesMetadata
                    'oozie.restService',
                    '$widgetParams',
                    "workflowData",
                    'workflowFiles',
                    'oozie.restService',
                    function ($q, subtypesMetadata, oozieRestService, $widgetParams, workflowData, workflowFiles, restService) {
                        let getFile;
                        if ($widgetParams.params.isTenantComponent) {
                            getFile = (path) => {
                                return restService.getTenantFileAsConfig('v1.0', $widgetParams.params.componentId, path);
                            };
                        } else {
                            getFile = (path) => {
                                return restService.getFileAsConfig('v1.0', $widgetParams.params.source, path)
                            };
                        }

                        if (workflowData) {
                            var propertyFilesLoaders = workflowData.propertyFiles.map((f) => {
                                return {
                                    loadedFile: null,
                                    file: {title: f.title, path: f.link},
                                    loading: false,
                                    error: null,
                                    load: () => getFile(f.link),
                                    toJSON: () => ({title: f.title, link: f.link})
                                };
                            });
                        } else {
                            propertyFilesLoaders = [];
                        }

                        var source = $widgetParams.params.isTenantComponent ? {} : $widgetParams.params.source;
                        let moduleInstance = oozieRestService.convertModule(source, workflowData, workflowFiles);
                        moduleInstance.addPropertyFilesLoaders(propertyFilesLoaders);
                        return moduleInstance;
                    }],
                connectionsSubtypesMetadata: ['oozie.restService', 'oozie.services.connectionFactory', 'loadedWorkflow', function (restService, connectionFactory, loadedWorkflow) {
                    var workflowVersion = loadedWorkflow.content.version;
                    restService.getConnectionsSubtypesMetadata(workflowVersion).then(function (data) {
                        connectionFactory.createConnectionConstructors(data);
                        return data;
                    });
                }],
                propertyFilesDeferred: ['$widgetParams', 'module', 'oozie.restService', function ($widgetParams, module, restService) {
                    var isTenantComponent = $widgetParams.params.isTenantComponent;
                    module.getNodes().forEach(function (node) {
                        node.propertyFilesDeferreds = node.propertyFiles.map(function (file) {
                            var container = {
                                file: file,
                                loadedFile: null,
                                isLoading: false,
                                load: ng.noop
                            };
                            if (isTenantComponent) {
                                container.load = function () {
                                    container.isLoading = true;
                                    return restService.getTenantFileAsConfig('v1.0', $widgetParams.params.componentId, file.path)
                                        .then(function (file) {
                                            this.loadedFile = file;
                                            return file;
                                        }.bind(this))
                                        .catch((error) => {
                                            container.loadedFile = {content: {config: null}};
                                        })
                                        .finally(function () {
                                            this.isLoading = false;
                                        }.bind(this));
                                }.bind(container);
                            } else {
                                container.load = function () {
                                    container.isLoading = true;
                                    return restService.getFileAsConfig('v1.0', $widgetParams.params.source, file.path)
                                        .then(function (file) {
                                            this.loadedFile = file;
                                        }.bind(this))
                                        .catch((error) => {
                                            container.loadedFile = {content: {config: null}};
                                        })
                                        .finally(function () {
                                            this.isLoading = false;
                                        }.bind(this));
                                }.bind(container);
                            }
                            return container;
                        });
                    });
                }]
            }
        });
    }
});
