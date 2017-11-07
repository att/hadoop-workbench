define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../../ngModule').controller('platform-wizard-base.universalController', universalController);

    universalController.$inject = [
        '$scope',
        '$widgetParams',
        'shared.jsonSchemaBuilder',
    ];
    function universalController($scope, $widgetParams, jsonSchemaBuilder) {
        $scope.data = $widgetParams.data;
        $scope.stepNumber = $widgetParams.stepNumber;
        var stepIndex = $scope.stepNumber - 1;


        var schema = $scope.data.schemaSteps[stepIndex];

        init();
        $scope.showValidationErrors = false;
        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });

        function init() {

            $scope.propertiesJsonSchema = jsonSchemaBuilder.createSchema(schema);
            $scope.data.schemaInstanceSteps[stepIndex] = $scope.propertiesJsonSchema;
        }
    }
});
