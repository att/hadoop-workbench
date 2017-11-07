/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        var ng = require('angular');
        require('../ngModule').controller('flume.pages.PipelinePageController', IndexController);

        var angular = require("angular");

        IndexController.$inject = [
            '$scope',
            '$widgetParams',
            'dashboard.models.TabPage',
            'restGetRawFileFunction'
        ];

        function IndexController($scope, $widgetParams, TabPage, restGetRawFileFunction) {
            var page = $widgetParams.page;
            $scope.page = page;

            var visualPage = TabPage.factory({
                name: 'flume-workflow',
                params: {
                    file: $widgetParams.params.file,
                    fileManager: $widgetParams.params.fileManager,
                    source: $widgetParams.params.source,
                    isTenantComponent: $widgetParams.params.isTenantComponent,
                    componentId: $widgetParams.params.componentId,
                    isDeployed: $widgetParams.params.isDeployed,
                    agent: $widgetParams.params.agent,
                    sharedActions: $widgetParams.params.sharedActions,
                    openTextTabView: function () {
                        page.leftTabManager.setActive(indexText);
                    },
                    componentSaver: $widgetParams.params.componentSaver,
                    isPlatformHDP: $widgetParams.params.isPlatformHDP
                }
            });
            var index = page.leftTabManager.addTab(visualPage, '', 'Visual view', 'b-oozie-plugin__flowchart-widget__schema-icon', true);
            visualPage.on(TabPage.EVENTS.ACTIVE_STATE_CHANGE, onVisualPageActiveStateChange);
            function onVisualPageActiveStateChange(event, isActive) {
                if (isActive) {
                    visualPage.reload();
                    visualPage.on(TabPage.EVENTS.ACTIVE_STATE_CHANGE, onVisualPageActiveStateChange);
                }
            }

            var textPage = TabPage.factory({
                name: 'file-text-viewer',
                params: {
                    getFile: function () {
                        return restGetRawFileFunction($widgetParams.params.file);
                    }
                }
            });
            var indexText = page.leftTabManager.addTab(textPage, '', 'Text view', 'b-oozie-plugin__flowchart-widget__text-icon', true);
            textPage.on(TabPage.EVENTS.ACTIVE_STATE_CHANGE, onTextPageActiveStateChange);
            function onTextPageActiveStateChange(event, isActive) {
                if (isActive) {
                    textPage.reload();
                    textPage.on(TabPage.EVENTS.ACTIVE_STATE_CHANGE, onTextPageActiveStateChange);
                }
            }

            $scope.$on('update-node-counters', function (event) {
                event.stopPropagation();
                $scope.$broadcast('update-node-counters');
            });

            page.leftTabManager.setActive(index);
        }
    }
);
