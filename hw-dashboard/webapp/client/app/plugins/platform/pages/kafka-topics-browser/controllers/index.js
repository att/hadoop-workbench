/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('platform.pages.KafkaTopicsBrowserPageController', Controller);

    Controller.$inject = [
        '$scope',
        'dashboard.models.PageControl',
        '$widgetParams',
        'kafka.restService',
    ];
    function Controller($scope, PageControl, $widgetParams, kafkaRestService) {

        ng.extend($scope, {
            platformId: $widgetParams.params.platformIdClusterIdObj.platformId,
            clusterId: $widgetParams.params.platformIdClusterIdObj.clusterId,
            pageErrorMessage: null,
            kafkaTopics: [],
            selectedItem: null,
        });

        ng.extend($scope, {
            selectKafkaTopic: function (event, kafkaTopic) {
                event.stopPropagation();
                $scope.selectedItem = kafkaTopic;
            },
        });

        init();

        function init() {

            setupWatchers();

            var backToPlatformsControl = PageControl.factory({
                label: '← Back to platforms',
                tooltip: '← Back to platforms',
                type: 'control',
                icon: 'b-clusters-browser__icon-back',
                css: '',
                active: false,
                enable: true,
                action: function () {
                    $scope.$emit('open-platforms.clusters-browser');
                }
            });
            $widgetParams.page.addControl(backToPlatformsControl);

        }

        function loadTopics() {
            kafkaRestService.getKafkaTopics($scope.platformId, $scope.clusterId)
                .then(
                    (kafkaTopics) => {
                        $scope.kafkaTopics = kafkaTopics;
                    }).catch((err) => {
                var strErr = 'Server error, can\'t load kafka topics';
                $scope.pageErrorMessage = strErr;
            });
        }

        function setupWatchers() {
            $scope.$watch(function () {
                return $widgetParams.params.platformIdClusterIdObj.clusterId + ' ' + $widgetParams.params.platformIdClusterIdObj.platformId;
            }, function (newValue) {
                $scope.platformId = $widgetParams.params.platformIdClusterIdObj.platformId;
                $scope.clusterId = $widgetParams.params.platformIdClusterIdObj.clusterId;
                loadTopics();
            });
        }
    }
});
