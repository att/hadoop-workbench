/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        var ng = require('angular');
        require('../ngModule').controller('oozie.pages.JobPageController', indexController);

        var angular = require("angular");

        indexController.$inject = [
            '$scope',
            '$widgetParams',
            'dashboard.models.TabPage',
            'loadedWorkflow'
        ];

        function indexController($scope, $widgetParams, TabPage, loadedWorkflow) {
            var page = $widgetParams.page;
            $scope.page = page;

            var index = page.leftTabManager.addTab(TabPage.factory({
                name: 'oozie-job',
                params: {
                    source: $widgetParams.params.source,
                    file: $widgetParams.params.file,
                    jobId: $widgetParams.params.jobId,
                    page: page,
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
