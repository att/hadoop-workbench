/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        var ng = require('angular');
        require('../ngModule').controller('platform.pages.KafkaTopicsPageContainerPageController', IndexController);

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

            var kafkaTopicsBrowser = TabPage.factory({
                name: 'kafka-topics-browser',
                params: {
                    selectedCluster: $widgetParams.params.selectedCluster,
                    platformIdClusterIdObj: $widgetParams.params.platformIdClusterIdObj
                }
            });
            var index = page.leftTabManager.addTab(kafkaTopicsBrowser, '', '', '', true);
            page.leftTabManager.setActive(index);

            page.on(TabPageEvents.ACTIVE_STATE_CHANGE, function (event, active) {
                kafkaTopicsBrowser.setActive(active);
            });
        }
    }
);
