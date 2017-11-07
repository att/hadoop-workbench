/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        require('../ngModule').controller('oozie.pages.NodePropertiesController', indexController);

        var angular = require("angular");

        indexController.$inject = [
            '$scope',
            '$widgetParams',
            'dashboard.models.TabPage'
        ];

        function indexController($scope, $widgetParams, TabPage) {
            $scope.source = $widgetParams.params.source;
            $scope.module = $widgetParams.params.module;
            $scope.selectedNodeContainer = {
                node: null
            };
            $scope.selectedConnection = null;
            $scope.propertyFiles = [];
            $scope.modulePropertyFilesLoaders = processModulePropertyFiles();

            // @TODO: refactor this logic to:
            //  1) check if coordinator.xml exists
            //  2) if exists show coordinator config options and allow create them
            //  3) if not exists, do not show coordinator config option
            $scope.showCoordinator = $widgetParams.params.coordinatorConfigDefault;

            $scope.readonly = $widgetParams.params.readonly || false;

            $scope.$on('open-file.options-editor', function (event, file) {
                event.stopPropagation();
                $widgetParams.page.notifySubscribers("file-open", file);
            });

            $scope.$on("connection-remove.options-editor", function (event, connection) {
                $widgetParams.params.removeConnection(connection);
            });

            $widgetParams.page.on('oozie-node-selected', function (event, node) {
                $scope.propertyFiles = [];
                $scope.selectedNodeContainer.node = node;
                processNodePropertyFiles();
            });
            $widgetParams.page.on('oozie-connection-selected', function (event, connection) {
                $scope.propertyFiles = [];
                $scope.selectedConnection = connection;
            });

            function processModulePropertyFiles() {
                return $scope.module.getPropertyFilesLoaders().map(function (loader) {
                    var result = {
                        params: {
                            title: loader.file.title,
                            readonly: !!$widgetParams.params.readonly,
                            configItems: loader.loadedFile ? loader.loadedFile.content.config : [],
                            file: loader.file,
                            noDescriptionOnView: true,
                            noDescriptionOnCreate: true,
                            isSingleSection: true,
                            isCollapsed: true
                        },
                        page: TabPage.factory(),
                        propertyFile: loader
                    };

                    if (loader.loadedFile === null) {
                        loader.loading = true;
                        loader.load().then((file) => {
                            loader.loadedFile = file;
                            result.params.configItems = file.content.config;
                        }).catch((error) => {
                            loader.loadedFile = {content: {config: null}};
                            result.params.configItems = null;
                            loader.error = error.message;
                        }).finally(() => {
                            loader.loading = false;
                        });
                    }

                    return result;
                });
            }

            function processNodePropertyFiles() {
                if ($scope.selectedNodeContainer.node && $scope.selectedNodeContainer.node.propertyFilesDeferreds) {
                    $scope.propertyFiles = $scope.selectedNodeContainer.node.propertyFilesDeferreds.map(function (modelContainer) {
                        var result = {
                            params: {
                                title: modelContainer.file.title,
                                readonly: !!$widgetParams.params.readonly,
                                configItems: modelContainer.loadedFile ? modelContainer.loadedFile.content.config : [],
                                file: modelContainer.file,
                                noDescriptionOnView: true,
                                noDescriptionOnCreate: true,
                                isSingleSection: true,
                                isCollapsed: true
                            },
                            page: TabPage.factory(),
                            propertyFile: modelContainer
                        };
                        if (!modelContainer.loadedFile) {
                            modelContainer.load()
                                .then(function () {
                                    result.params.configItems = modelContainer.loadedFile ? modelContainer.loadedFile.content.config : [];
                                })
                        }
                        return result;
                    });
                }
            }
        }
    }
);
