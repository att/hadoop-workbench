/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        var ng = require('angular');
        require('../ngModule').controller('shared.pages.ConfigPageController', indexController);

        var angular = require("angular");

        indexController.$inject = [
            '$scope',
            '$widgetParams',
            'dashboard.models.TabPage'
        ];

        function indexController($scope, $widgetParams, TabPage, loadedConfigFile) {
            var page = $widgetParams.page;
            $scope.page = page;

            var index = page.leftTabManager.addTab(TabPage.factory({
                name: 'config-properties-editor',
                params: {
                    title: $widgetParams.params.title,
                    readonly: $widgetParams.params.readonly,
                    configItems: $widgetParams.params.configItems,
                    isConfigDefaultError: $widgetParams.params.isConfigDefaultError,
                    file: $widgetParams.params.file,
                    noDescriptionOnView: $widgetParams.params.noDescriptionOnView,
                    noDescriptionOnCreate: $widgetParams.params.noDescriptionOnCreate,
                    isSingleSection: $widgetParams.params.isSingleSection,
                    isCollapsed: $widgetParams.params.isCollapsed
                }
            }), '', 'Visual view', 'b-oozie-plugin__flowchart-widget__schema-icon', true);
            page.leftTabManager.setActive(index);

            page.leftTabManager.addTab(TabPage.factory({
                name: 'file-text-viewer',
                params: {
                    file: $widgetParams.params.file,
                    readonly: $widgetParams.params.readonly
                }
            }), '', 'Text view', 'b-oozie-plugin__flowchart-widget__text-icon', true);
        }
    }
);
