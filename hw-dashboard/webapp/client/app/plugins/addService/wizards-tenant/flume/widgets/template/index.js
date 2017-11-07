define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../../ngModule').controller('addService.wizards-tenant.flume.templateController', templateController);

    templateController.$inject = [
        '$scope',
        '$widgetParams',
        'templates',
        '$filter'
    ];
    function templateController($scope, $widgetParams, templates, $filter) {
        $scope.data = $widgetParams.data;
        $scope.stepNumber = $widgetParams.stepNumber;
        $scope.searchString = '';
        $scope.templatesFiltered = [];
        $scope.templates = templates;
        $scope.templates.unshift({
            isBlank: true,
            info: {
                title: 'Blank'
            }
        });

        var noTemplateSelected = ng.isUndefined($scope.data['template']);
        if (noTemplateSelected) {
            $scope.data['template'] = null;
        }

        $scope.selectTemplate = function (template) {
            if (template.isBlank) {
                template = null;
            }
            $scope.data['template'] = ng.copy(template);
            $scope.$emit('nextStep.addService');
        };
        $scope.title = function () {
            return "";
        };
        $scope.$watch('searchString', function (searchString) {
            var list = $filter('filter')($scope.templates, searchString);
            $scope.templatesFiltered.splice(0);
            $scope.templatesFiltered.push.apply($scope.templatesFiltered, list);
        });

        $scope.showValidationErrors = false;
        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });
    }
});
