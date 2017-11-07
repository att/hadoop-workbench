/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        var ng = require('angular');
        require('../ngModule').controller('userSettings.pages.SettingsPageController', IndexController);

        var angular = require("angular");

        IndexController.$inject = [
            '$scope',
            '$widgetParams',
            'dashboard.models.TabPage'
        ];

        function IndexController($scope, $widgetParams, TabPage) {
            var page = $widgetParams.page;
            $scope.page = page;

            var clustersBrowser = TabPage.factory({
                name: 'user-settings.pages.settings-nodes'
            });
            var index = page.leftTabManager.addTab(clustersBrowser, '', '', '', true);
            page.leftTabManager.setActive(index);
        }
    }
);
