/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        require('../ngModule').controller('flume.pages.NodePropertiesController', indexController);

        var angular = require("angular");

        indexController.$inject = [
            '$scope',
            '$widgetParams',
            'main.alerts.alertsManagerService'
        ];

        function indexController($scope, $widgetParams, alertsManagerService) {
            $scope.module = $widgetParams.params.module;
            $scope.readonly = $widgetParams.params.readonly;
            $scope.agent = $widgetParams.params.agent;
            $scope.isPluginDirReadonly = $widgetParams.params.isPluginDirReadonly;

            $scope.selectedNodeContainer = {
                node: null
            };
            $scope.selectedConnection = null;
            $scope.nodesMetadata = $widgetParams.params.nodesMetadata;

            $widgetParams.page.on('flume-node-selected', function (event, node) {
                $scope.selectedNodeContainer.node = node;
            });

            $scope.showWarning = function(){
                alertsManagerService.addAlertWarning({
                    title: 'Field editing is disabled',
                    text: 'Plugin dir is not configurable for Hortonworks.<br> Go to platform settings to change this value'
                });
            };

            $scope.$on("connection-remove.options-editor", function (event, connection) {
                event.stopPropagation();
                $widgetParams.params.removeConnection(connection);
            });

            $widgetParams.page.on('flume-connection-selected', function (event, connection) {
                $scope.selectedConnection = connection;
            });

        }
    }
);
