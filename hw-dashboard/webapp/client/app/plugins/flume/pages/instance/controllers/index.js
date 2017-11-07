/*jshint maxparams:15*/
define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').controller('flume.pages.FlumeInstanceController', IndexController);

    IndexController.$inject = [
        '$scope',
        '$widgetParams',
        'flumeModule',
        'dashboard.models.TabPage',
        '$timeout',
        'flume.restService',
        'dashboard-isolated-widget-accessor.WidgetStore'
    ];
    function IndexController($scope, $widgetParams, flumeModule, TabPage, $timeout, restService, WidgetStore) {
        if (!flumeModule) {
            $scope.loadDataError = true;
            $scope.goToTextTab = $widgetParams.params.openTextTabView;
            return;
        }

        var dashboardWidget = WidgetStore.getWidget();
        var page = $widgetParams.page;
        var nodePropertiesPage;

        //scope properties
        ng.extend($scope, {
            module: flumeModule,
            metrics: {},
            moduleConnections: [],
            selectedNodeContainer: {
                node: null
            },
            dashboardWidgetContainer: {
                dashboardWidget: dashboardWidget
            },
            nodeValidatorCallback: false,
            selectedConnection: null,
            instance: $widgetParams.params.instance
        });

        //scope methods
        ng.extend($scope, {});

        init();

        //setup functions
        function init() {
            nodePropertiesPage = TabPage.factory({
                name: 'flume-node-properties',
                params: {
                    readonly: true
                }
            });
            page.rightTabManager.addTab(nodePropertiesPage, '', 'Properties', 'b-flume-plugin__options-editor-widget__icon', true);
            page.rightTabManager.setActive(-1);

            nodePropertiesPage.on('pageLoadSuccess', function () {
                nodePropertiesPage.notifySubscribers('flume-node-selected', $scope.selectedNodeContainer.node);
                nodePropertiesPage.notifySubscribers('flume-connection-selected', $scope.selectedConnection);
            });
            $scope.$watch('selectedNodeContainer.node', function (node) {
                nodePropertiesPage.notifySubscribers('flume-node-selected', node);
            });
            $scope.$watch('selectedConnection', function (connection) {
                nodePropertiesPage.notifySubscribers('flume-connection-selected', connection);
            });
            bindToWidgetsEvents();
        }

        function bindToWidgetsEvents() {
            // bind to widget events (syntax is "eventname.widgetname") to conduct validation
            $scope.$on("nodeadd.nodeselector", function (event, data) {
                event.preventDefault();
            });

            $scope.$on("connectionadd.flowchart", function (event, connection) {
                event.preventDefault();
            });

            $scope.$on("connection-select.flowchart", function (event, jsPlumbConnection) {
                event.stopPropagation();

                $scope.selectedNodeContainer.node = null;
                var connection = null;
                $scope.module.getConnections().some(function (c) {
                    if (c.$connection === jsPlumbConnection) {
                        connection = c;
                        return true;
                    } else {
                        return false;
                    }
                });

                $scope.selectedConnection = connection;

                console.assert(connection !== null, "No matching connection for jsPlumbConnection found");

            });

            // TODO(maximk): this function seems to be redundant and is never called - check
            $scope.$on("connection-deselect.flowchart", function (event, jsPlumbConnection) {
                event.stopPropagation();

                $scope.selectedConnection = null;
            });

            $scope.$on("node-select.flowchart", function (event, node) {
                event.stopPropagation();

                $scope.selectedNodeContainer.node = node;
                $scope.selectedConnection = null;
            });

            $scope.$on("node-deselect.flowchart", function (event, data) {
                event.stopPropagation();
                $scope.selectedNodeContainer.node = null;
            });

            var renderedNodesCount = 0;
            $scope.$on("endpoints-configured.js-plumb-item", function (event) {
                event.stopPropagation();

                renderedNodesCount += 1;
                if ($scope.module.getNodes().length === renderedNodesCount) {
                    $scope.moduleConnections = $scope.module.getConnections();
                }
            });

            $scope.$on("node-double-clicked", function (event, data) {
                var index = $widgetParams.page.rightTabManager.getIndexByPage(nodePropertiesPage);
                if (index > -1) {
                    $widgetParams.page.rightTabManager.setActive(index);
                }
            });

            $scope.$on("update-node-counters", function (event) {
                updateNodeCounters();
            });
        }
    }
});
