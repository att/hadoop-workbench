define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('flume.pages.instance-page', {
            templateUrl: dapConfig.pathToPlugins + '/flume/pages/instance-page/views/index.html',
            controller: 'flume.pages.FlumeInstancePageController',
            resolve: {
                restrictionsService: ['dap.shared.validation.RestrictionsService', function (RestrictionsService) {
                    return RestrictionsService.factory();
                }],
                typesMetadata: ['flume.restService', function (restService) {
                    return restService.getNodeTypesMetadata();
                }],
                subtypesMetadata: ['flume.restService', function (restService) {
                    return restService.getNodeSubtypesMetadata();
                }],
                typesRestrictions: ['restrictionsService', 'typesMetadata', function (restrictionsService, typesMetadata) {
                    return restrictionsService.processRestrictions(typesMetadata);
                }],
                nodeConstructors: ['subtypesMetadata', 'flume.services.nodeFactory', function (subtypesMetadata, nodeFactory) {
                    return nodeFactory.createNodeConstructors(subtypesMetadata);
                }],
                nodesMetadata: ['subtypesMetadata', function (subtypesMetadata) {
                    var nodes = subtypesMetadata.subtypes;
                    var nodesMetadata = {};
                    ng.forEach(nodes, function (subtypes, type) {
                        if (ng.isUndefined(nodesMetadata[type])) {
                            nodesMetadata[type] = [];
                        }
                        subtypes.forEach(function (subtype) {
                            nodesMetadata[type].push(subtype.name);
                        });
                    });

                    var sortingOrder = ["source", "channel", "sink"];
                    var nodesMetaDataSorted = [];
                    sortingOrder.forEach(function (key) {
                        nodesMetaDataSorted.push({
                            type: key,
                            subtypes: nodesMetadata[key]
                        });
                    });
                    return nodesMetaDataSorted;
                }],
                loadedPipeline: ['$widgetParams', 'flume.restService', function ($widgetParams, restService) {
                    return restService.getFileAsPipeline('v1.0', $widgetParams.params.source, $widgetParams.params.file.path)
                        .then(function (response) {
                                return response;
                        },
                        function (e) {
                            return null;
                        }
                    );
                }],
                flumeModule: ['$widgetParams', 'loadedPipeline', 'flume.restService', 'nodesMetadata', function ($widgetParams, loadedPipeline, restService) {
                    if (!loadedPipeline) {
                        return null;
                    }
                    return  restService.convertModule($widgetParams.params.source, loadedPipeline.content);
                }]
            }
        });
    }
});
