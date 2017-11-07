define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    var ng = require("angular");

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('hdfs-manager-widget', {
            templateUrl: dapConfig.pathToPlugins + '/hdfs/dashboard-widgets/hdfs-manager-widget/views/index.html',
            controller: 'hdfs-manager-widget.IndexController',
            resolve: {
                source: ["$widgetParams", function ($widgetParams) {
                    return $widgetParams.src;
                }],
                loader: ["$widgetParams", function ($widgetParams) {
                    return $widgetParams.loader || "hdfs";
                }],
                restService: ["$widgetParams", "hdfs.RestService", "loader", function ($widgetParams, RestService, loader) {
                    return RestService.factory(loader);
                }],
                Item: ["restService", "hdfs.Item", function (restService, Item) {
                    return {
                        factory: function (json, source) {
                            return Item.factory(restService, json, source);
                        }
                    };
                }],
                currentUser: ["$widgetParams", 'restService', 'source', 'loader', function ($widgetParams, restService, source, loader) {
                    if (loader === "hdfs") {
                        if (source.path !== undefined) {
                            return {
                                available: true,
                                homePath: source.path
                            };
                        } else {
                            return restService.getCurrentUser(source).then(function (user) {
                                return {
                                    available: true,
                                    homePath: user.homePath,
                                    name: user.name
                                };
                            }).catch(function (error) {
                                return {
                                    available: false,
                                    errorDescription: error.message
                                };
                            });
                        }
                    } else {
                        return {
                            available: true,
                            homePath: "/"
                        };
                    }
                }],
                users: ['restService', 'source', function (restService, source) {
                    return restService.getUsers(source).then(function (data) {
                        return data.users.map(user => {
                            return {
                                name: user.name,
                                homePath: user.homePath,
                                id: user.id,
                                available: true
                            };
                        });
                    });
                }],
                fileNavigator: ["restService", "source", "hdfs.FileNavigator", function (restService, source, FileNavigator) {
                    return new FileNavigator(restService, source);
                }],
                config: ["$widgetParams", "fileBrowser.configuration", function ($widgetParams, configuration) {
                    var options = ng.extend({}, $widgetParams);
                    options.tplPath = dapConfig.pathToPlugins + "/hdfs/dashboard-widgets/hdfs-manager-widget/views/";
                    return configuration.getConfig(options);
                }]
            }
        });
    }
});
