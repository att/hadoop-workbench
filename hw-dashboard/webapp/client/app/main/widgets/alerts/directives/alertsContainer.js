define(function (require) {
    "use strict";

    require('../ngModule').directive('alertsContainer', alertsContainer);

    alertsContainer.$inject = ['main.alerts.alertsManagerService', 'dap.core.config', '$ngRedux', 'alerts.redux-action-creators'];
    function alertsContainer(alertsManagerService, dapConfig, $ngRedux, alertsActionCreators) {
        return {
            restrict: 'EA',
            replace: true,
            scope: true,
            templateUrl: '/app/main/widgets/alerts/views/alertsContainer.html',
            link: function ($scope, element, attrs, controller) {
                let {assign} = Object;
                let {dispatch} = $ngRedux;

                assign($scope, {
                    reduxAlerts: [],
                    serviceAlerts: alertsManagerService.alerts,
                    confirm: alertsManagerService.confirm,
                    closeAlert: alertsManagerService.closeAlert,
                    closeReduxAlert(ra){
                        dispatch(alertsActionCreators.clearNotification(ra));
                    }
                });

                let unsubscribe = $ngRedux.connect(onStateChange)($scope);
                $scope.$on('$destroy', unsubscribe);

                function onStateChange(state) {
                    return {
                        reduxAlerts: state.data.alerts
                    }
                }
            }
        };
    }
});