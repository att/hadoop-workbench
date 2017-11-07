/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        var ng = require('angular');
        require('../ngModule').controller('oozie.pages.CoordinatorJobPageController', indexController);

        var angular = require("angular");

        indexController.$inject = [
            '$scope',
            '$widgetParams',
            'dashboard.models.TabPage'
        ];

        function indexController($scope, $widgetParams, TabPage) {
            var page = $widgetParams.page;
            $scope.page = page;

            var index = page.leftTabManager.addTab(TabPage.factory({
                name: 'oozie-coordinator-job',
                params: {
                    file: $widgetParams.params.file,
                    jobId: $widgetParams.params.jobId,
                    page: page,
                    restGetRawFileFunction: $widgetParams.params.restGetRawFileFunction,
                    coordinator: $widgetParams.params.coordinator,
                    checkIfTabActive: function () {
                        return $widgetParams.page.isActive;
                    }
                }
            }), '', '', true);

            page.leftTabManager.setActive(index);
        }
    }
);
