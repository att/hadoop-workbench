require('../../ngModule').controller('addService.wizards-tenant.oozie.templateController', templateController);
let {assign, keys} = Object;
let {copy} = angular;

templateController.$inject = [
    '$scope',
    '$widgetParams',
    '$filter',
    '$ngRedux',
    'oozie.redux-actions'
];
function templateController($scope, $widgetParams, $filter, $ngRedux, oozieActions) {
    assign($scope, {
        data: $widgetParams.data,
        stepNumber: $widgetParams.stepNumber,
        templates: [],
        templatesFiltered: [],
        searchString: ''
    });

    assign($scope, {
        selectTemplate: (template) => {
            if (template.isBlank) {
                $scope.data['workflow-template'] = null;
            }
            $scope.data['workflow-template'] = copy(template);
            $scope.$emit('nextStep.addService');
        },
        title: ()=>''
    });

    let lastStoreTemplates;
    let unsubscribe = $ngRedux.connect(onStateChange)($scope);

    $scope.$on('$destroy', unsubscribe);
    $scope.$watchCollection('templates', filterTemplates);
    $scope.$watch('searchString', filterTemplates);

    $scope.showValidationErrors = false;
    $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
        $scope.showValidationErrors = show;
    });

    $ngRedux.dispatch(oozieActions.getTemplates($widgetParams.data.version));

    function onStateChange(state) {
        if (lastStoreTemplates === state.data.oozie.templates) {
            return {};
        }
        lastStoreTemplates = state.data.oozie.templates;
        return {
            templates: retrieveTemplates(state)
        };
    }

    function retrieveTemplates(state) {
        let templatesInState = state.data.oozie.templates;
        let templates = keys(templatesInState).reduce((host, templateId)=> {
            if (templatesInState[templateId].workflowVersion === $widgetParams.data.version) {
                host.push(templatesInState[templateId]);
            }
            return host;
        }, []);
        templates.unshift({
            isBlank: true,
            info: {
                title: 'Blank'
            }
        });
        return templates;
    }

    function filterTemplates() {
        $scope.templatesFiltered = $filter('filter')($scope.templates, $scope.searchString);
    }
}
