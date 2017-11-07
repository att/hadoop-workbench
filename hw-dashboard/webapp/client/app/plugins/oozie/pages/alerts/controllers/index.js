/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        require('../ngModule').controller('oozie.pages.AlertsController', indexController);

        var angular = require("angular");

        indexController.$inject = [
            '$scope',
            '$widgetParams'
        ];

        function indexController($scope, $widgetParams) {
            $scope.removeAlert = $widgetParams.params.removeAlert;
            $scope.validationMessages = $widgetParams.params.validationMessages;

            $widgetParams.page.on('validation-messages-updated', function (event, messages) {
                $scope.validationMessages = messages;
            });
        }
    }
);
