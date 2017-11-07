define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('oozie-job-page', {
            templateUrl: dapConfig.pathToPlugins + '/oozie/pages/job-page/views/index.html',
            controller: 'oozie.pages.JobPageController',
            resolve: {
                loadedWorkflow: [
                    '$widgetParams',
                    'oozie.restService',
                    "$q",
                    function ($widgetParams, restService, $q) {
                        var file = $widgetParams.params.file;
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

                        function getDefaultFileFullPath(file) {
                            return file.path + '/' + file.defaultFile;
                        }

                        function isErrorHasNotFoundStatus(error) {
                            return error.status == 404
                        }
                    }],
                workflowData: [
                    'loadedWorkflow',
                    function (loadedWorkflow) {
                        return loadedWorkflow.content;
                    }],
                restrictionsServiceInstance: ['dap.shared.validation.RestrictionsService', function (RestrictionsService) {
                    return RestrictionsService.factory();
                }],
                typesMetadata: ['oozie.restService', 'restrictionsServiceInstance', 'loadedWorkflow', function (restService, restrictionsServiceInstance, loadedWorkflow) {
                    var workflowVersion = loadedWorkflow.content.version;
                    return restService.getNodeTypesMetadata(workflowVersion).then(function (data) {
                        restrictionsServiceInstance.processRestrictions(data);
                        return data;
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
                    function ($q, subtypesMetadata, oozieRestService, $widgetParams, workflowData, workflowFiles) {
                        var source = $widgetParams.params.source;
                        return oozieRestService.convertModule(source, workflowData, $widgetParams.params.workflowFiles, {x: 192, y: 96});
                    }],
                connectionsSubtypesMetadata: ['oozie.restService', 'oozie.services.connectionFactory', 'loadedWorkflow', function (restService, connectionFactory, loadedWorkflow) {
                    var workflowVersion = loadedWorkflow.content.version;
                    restService.getConnectionsSubtypesMetadata(workflowVersion).then(function (data) {
                        connectionFactory.createConnectionConstructors(data);
                        return data;
                    });
                }]
            }
        });
    }
});
