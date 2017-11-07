/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('create-tenant-component-widget.IndexController', SearchController);

    SearchController.$inject = [
        '$scope',
        'dashboard-isolated-widget-accessor.WidgetStore',
        'addService.wizards-tenant.services.base',
        'addService.wizards-tenant.services.oozie',
        'addService.wizards-tenant.services.flume',
        '$widgetParams',
        "dashboard.WidgetsActions",
        '$ngRedux',
        'tenant.redux-actions'
    ];
    function SearchController($scope, WidgetStore, baseWizard, oozieWizard, flumeWizard, $widgetParams, WidgetsActions, $ngRedux, tenantActions) {
        var dashboardWidget = WidgetStore.getWidget();
        dashboardWidget.title = 'Create New Component';
        dashboardWidget.fullWidth = true;
        dashboardWidget.hSize = 3;
        dashboardWidget.hideSizeControls = true;

        /*--------------------------------------------------------------------*/
        ng.extend($scope, {
            steps: [],
            sharedData: $widgetParams.sharedData || {},
            currentStep: null,
            currentStepNumber: 0,
            isLoading: false
        });

        /**
         * Set default properties
         */
        ng.extend($scope.sharedData, {
            componentVersion: "1.0"
        });
        ng.extend($scope, {
            cancelCreateNew: function () {
                WidgetsActions.removeWidget(dashboardWidget);
            },
            prevStep: function () {
                back();
            },
            nextStep: function () {
                if ($scope.currentStep.isCompleted()) {
                    var nextStep = $scope.currentStep.nextStep();
                    nextStep.showValidationErrors = false;
                    pushStep(nextStep);
                    if (nextStep) {
                        $scope.currentStep = nextStep;
                    }
                } else {
                    $scope.currentStep.showValidationErrors = true;
                }
            },
            save: function () {
                $scope.currentStep.showValidationErrors = true;
                if (!$scope.currentStep.isCompleted() || !$scope.currentStep.readyToCreate()) {
                    return;
                }
                $scope.currentStep.finish(dashboardWidget).then(
                    function () {
                        $ngRedux.dispatch(tenantActions.getComponentsListing());
                    }
                );
            },
            showValidationErrors: function () {
                return $scope.currentStep.showValidationErrors;
            },
            key: function (index) {
                /*jshint -W027*/
                /*jshint -W074*/
                switch (index) {
                    case 0:
                        return "Tenant: ";
                        break;
                    case 1:
                        return "Component type: ";
                        break;
                    case 2:
                        return $scope.sharedData.componentType.id === "OOZIE" ? "Oozie version: " : "Create from: ";
                        break;
                    case 3:
                        return $scope.sharedData.componentType.id === "OOZIE" ? "Create from: " : "Agent name: ";
                        break;
                }
            }
        });

        $scope.$on('nextStep.addService', function () {
            $scope.nextStep();
        });
        $scope.$watch('currentStep', function (step) {
            $scope.currentStepNumber = $scope.steps.indexOf(step) + 1;
        });

        /*--------------------------------------------------------------------*/

        var baseWizardInstance = baseWizard.create($scope.sharedData);
        var oozieWizardInstance = oozieWizard.create($scope.sharedData, setSpinner);
        var flumeWizardInstance = flumeWizard.create($scope.sharedData, setSpinner);
        baseWizardInstance.addForkStep('OOZIE', oozieWizardInstance.startStep());
        baseWizardInstance.addForkStep('FLUME', flumeWizardInstance.startStep());

        $scope.currentStep = baseWizardInstance.startStep();
        pushStep($scope.currentStep);

        var skipTenantSelection = !!$widgetParams.sharedData.container;
        if (skipTenantSelection) {
            $scope.nextStep();
        }

        function pushStep(step) {
            var currentStepIndex = $scope.steps.indexOf($scope.currentStep);
            if (currentStepIndex < $scope.steps.length - 1) {
                $scope.steps.splice(currentStepIndex + 1);
            }
            $scope.steps.push(step);
        }

        function back() {
            var currentStepIndex = $scope.steps.indexOf($scope.currentStep);
            if (currentStepIndex > 0) {
                $scope.currentStep = $scope.steps[currentStepIndex - 1];
                $scope.currentStep.showValidationErrors = false;
            }
        }

        function setSpinner(val) {
            $scope.isLoading = !!val;
        }
    }
});
