/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        var ng = require('angular');
        require('../ngModule').controller('platform.pages.PlatformsPageContainerPageController', IndexController);

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

            var platformsBrowser = TabPage.factory({
                name: 'platforms-browser',
                params: {
                    newPlatformName: $widgetParams.params.newPlatformName,
                    newPlatformTypeId: $widgetParams.params.newPlatformTypeId
                }
            });
            var index = page.leftTabManager.addTab(platformsBrowser, '', '', '', true);
            page.leftTabManager.setActive(index);

            page.on(TabPageEvents.ACTIVE_STATE_CHANGE, function (event, active) {
                platformsBrowser.setActive(active);
            });
        }
    }
);
