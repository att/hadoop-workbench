/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        var ng = require('angular');
        require('../ngModule').controller('oozie.pages.WorkflowPageController', indexController);

        var angular = require("angular");

        indexController.$inject = [
            '$scope',
            '$widgetParams',
            'dashboard.models.TabPage'
        ];

        function indexController($scope, $widgetParams, TabPage) {
            var page = $widgetParams.page;
            $scope.page = page;

            var visualPage = TabPage.factory({
                name: 'oozie-workflow',
                params: {
                    configDefaultFile: $widgetParams.params.configDefaultFile,
                    coordinatorConfigDefaultFile: $widgetParams.params.coordinatorConfigDefaultFile,
                    file: $widgetParams.params.file,
                    files: $widgetParams.params.files,
                    fileManager: $widgetParams.params.fileManager,
                    isTenantComponent: $widgetParams.params.isTenantComponent,
                    source: $widgetParams.params.source,
                    workflowVersion: $widgetParams.params.workflowVersion,
                    componentId: $widgetParams.params.componentId,
                    isFileOpenedFromSubworkflowNodeProperties: $widgetParams.params.isFileOpenedFromSubworkflowNodeProperties,
                    openTextViewTab: function () {
                        page.leftTabManager.setActive(indexText);
                    },
                    componentSaver: $widgetParams.params.componentSaver,
                    ideTabTitleChangerCallback: $widgetParams.params.ideTabTitleChangerCallback
                }
            });
            var indexVisual = page.leftTabManager.addTab(visualPage, '', 'Visual view', 'b-oozie-plugin__flowchart-widget__schema-icon', true);
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
                        return $widgetParams.params.restGetRawFileFunction($widgetParams.params.file);
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


            page.leftTabManager.setActive(indexVisual);
        }
    }
);
