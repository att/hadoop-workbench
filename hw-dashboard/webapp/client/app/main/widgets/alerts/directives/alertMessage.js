define(function (require) {
    'use strict';

    require('../ngModule').directive('alertMessage', alertMessage);

    alertMessage.$inject = ['dap.core.config', '$timeout'];
    function alertMessage(dapConfig, $timeout) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                model: '=alertMessage',
                closeIt: '=close',
                index: '='
            },
            templateUrl: '/app/main/widgets/alerts/views/alertMessage.html',
            link: function ($scope, element, attrs, controller) {
                var $clearTimeout;
                $scope.close = $scope.closeIt.bind(null, $scope.model);
                $scope.onMouseEnter = function () {
                    if ($clearTimeout) {
                        $timeout.cancel($clearTimeout);
                        $clearTimeout = null;
                    }
                };
                $scope.onMouseLeave = function () {
                    delayClose();
                };

                delayClose();

                function delayClose() {
                    if ($scope.model.delay > 0 && $scope.model.buttons.length === 0) {
                        $clearTimeout = $timeout($scope.close, $scope.model.delay);
                    }
                }
            }
        };
    }
});
