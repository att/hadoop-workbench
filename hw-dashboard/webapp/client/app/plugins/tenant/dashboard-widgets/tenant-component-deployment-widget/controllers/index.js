/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('tenant-component-deployment-widget.IndexController', DeploymentController);

    DeploymentController.$inject = [
        '$scope',
        'dashboard-isolated-widget-accessor.WidgetStore',
        'componentDescriptor',
        'deploymentDescriptor',
        'tenant.deploy-component.wizards.services.base',
        'tenant.deploy-component.wizards.services.oozie',
        'tenant.deploy-component.wizards.services.oozie-space',
        'tenant.deploy-component.wizards.services.flume',
        'tenant.deploy-component.wizards.services.flume-hdp',
        "dashboard.WidgetsActions"
    ];
    function DeploymentController($scope, WidgetStore, componentDescriptor, deploymentDescriptor, baseWizard, oozieWizard, oozieSpaceWizard, flumeWizard, flumeHdpWizard, WidgetsActions) {
        var dashboardWidget = WidgetStore.getWidget();
        let {useSpaces = false} = deploymentDescriptor;
        dashboardWidget.title = useSpaces ? 'Component Promotion' : 'Tenant component deployment';
        dashboardWidget.fullWidth = true;
        dashboardWidget.hSize = 3;
        dashboardWidget.hideSizeControls = true;

        ng.extend($scope, {
            steps: [],
            sharedData: {
                componentDescriptor: componentDescriptor,
                deploymentDescriptor: deploymentDescriptor
            },
            currentStep: null,
            currentStepNumber: 0,
            isLoading: false
        });

        ng.extend($scope, {
            prevStep: function () {
                back();
            },
            nextStep: function () {
                if ($scope.currentStep.isCompleted()) {
                    var nextStep = $scope.currentStep.nextStep();
                    nextStep.showValidationErrors = false;
                    if (nextStep === $scope.currentStep) {
                        return;
                    }
                    pushStep(nextStep);
                    if (nextStep) {
                        $scope.currentStep = nextStep;
                    }
                } else {
                    $scope.currentStep.showValidationErrors = true;
                }
            },
            save: function () {
                if (!this.currentStep.isCompleted()) {

                }
                let parentWidget = $scope.sharedData.deploymentDescriptor.parentWidget;
                if (parentWidget) {
                    let clusterId = $scope.currentStep.data.cluster.id;
                    let platformId = $scope.currentStep.data.platform.id;
                    parentWidget.params = {
                        defaultTab: {
                            clusterId: clusterId,
                            platformId: platformId
                        }
                    };
                }

                $scope.currentStep.showValidationErrors = true;
                $scope.currentStep.finish(dashboardWidget, parentWidget);
            },
            showValidationErrors: function () {
                return $scope.currentStep.showValidationErrors;
            },
            key: function (index) {
                switch (index) {
                    case 0:
                        return "Platform: ";
                    case 1:
                        return "Cluster: ";
                    case 2:
                        return "Service: ";
                }
            },
            cancelDeploy: function () {
                let parentWidget = $scope.sharedData.deploymentDescriptor.parentWidget;
                if (parentWidget) {
                    WidgetsActions.addWidget(parentWidget, {replace: dashboardWidget});
                } else {
                    WidgetsActions.removeWidget(dashboardWidget);
                }

            }
        });

        $scope.$on('next-step.deploy-component-service', function () {
            $scope.nextStep();
        });
        $scope.$watch('currentStep', function (step) {
            $scope.currentStepNumber = $scope.steps.indexOf(step) + 1;
        });

        var baseWizardInstance = baseWizard.create($scope.sharedData);
        var oozieWizardInstance = oozieWizard.create($scope.sharedData, setSpinner);
        var oozieSpaceWizardInstance = oozieSpaceWizard.create($scope.sharedData, setSpinner);
        var flumeWizardInstance = flumeWizard.create($scope.sharedData, setSpinner);
        var flumeHdpWizardInstance = flumeHdpWizard.create($scope.sharedData, setSpinner);
        baseWizardInstance.addForkStep('oozie', oozieWizardInstance.startStep());
        baseWizardInstance.addForkStep('oozie-space', oozieSpaceWizardInstance.startStep());
        baseWizardInstance.addForkStep('flume', flumeWizardInstance.startStep());
        baseWizardInstance.addForkStep('flume-hdp', flumeHdpWizardInstance.startStep());

        $scope.currentStep = baseWizardInstance.startStep();
        pushStep($scope.currentStep);

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
            }
        }

        function setSpinner(val) {
            $scope.isLoading = !!val;
        }
    }
});
