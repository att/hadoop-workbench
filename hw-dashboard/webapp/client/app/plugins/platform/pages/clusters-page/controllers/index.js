/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        var ng = require('angular');
        require('../ngModule').controller('platform.pages.ClustersPageContainerPageController', IndexController);

        var angular = require("angular");

        IndexController.$inject = [
            '$scope',
            '$widgetParams',
            'dashboard.models.TabPage',
            "dashboard.models.TabPage.EVENTS"
        ];

        function IndexController($scope, $widgetParams, TabPage, TabPageEvents) {
            var page = $widgetParams.page;
            $scope.page = page;

            var clustersBrowser = TabPage.factory({
                name: 'clusters-browser',
                params: {
                    selectedCluster: $widgetParams.params.selectedCluster
                }
            });
            var index = page.leftTabManager.addTab(clustersBrowser, '', '', '', true);
            page.leftTabManager.setActive(index);

            page.on(TabPageEvents.ACTIVE_STATE_CHANGE, function (event, active) {
                clustersBrowser.setActive(active);
            });
        }
    }
);
