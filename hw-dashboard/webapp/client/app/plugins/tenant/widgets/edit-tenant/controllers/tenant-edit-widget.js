import {getCuidById} from '../../../reducers/tenants';

    require('../ngModule').controller('tenant.TenantEditWidgetController', TenantEditWidgetController);

    TenantEditWidgetController.$inject = [
        '$scope',
        '$widgetParams',
        'main.alerts.alertsManagerService',
        'core.utils.string-format',
        "tenant.redux-actions",
        '$ngRedux'

    ];
    function TenantEditWidgetController($scope, $widgetParams, alertsManager, stringFormat, tenantActions, $ngRedux) {

        let tenantId = $widgetParams.tenantId;
        let tenantCuid = null;

        angular.extend($scope, {
            tenantName: $widgetParams.tenantName || "",
            description: $widgetParams.description || "",
            version: $widgetParams.version || "",
            error: null,
            isPutting: false,
            showValidationErrors: false,
        });

        angular.extend($scope, {
            save: function () {
                if ($scope.tenantForm.$valid) {
                        $ngRedux.dispatch(tenantActions.updateTenant({
                            name: $scope.tenantName,
                            description: $scope.description,
                            version: $scope.version,
                            id: tenantId,
                            $cuid:tenantCuid
                        }));
                    } else {
                        $scope.showValidationErrors = true;
                    }
            }
        });

        init();

        function init() {
            if (!tenantId) {
                console.log('Tenant ID should be provided');
                return;
            }

            tenantCuid = getCuidById(tenantId);

            bindStateToScope();
        }
        function bindStateToScope() {
            let unsubscribe = $ngRedux.connect(onStateChange)($scope);
            $scope.$on('$destroy', unsubscribe);
        }

        function onStateChange(state) {
            let result = {};

            if (!tenantCuid) {
                return {};
            }
            let tenant = state.data.tenant.tenants[tenantCuid];
            if (!tenant) {
                return {};
            }
            if (tenant.id) {
                result.tenantName = tenant.name;
                result.description = tenant.description;
                result.version = tenant.version;
            }

            result.isPutting = tenant.$meta.isPutting;
            result.error = tenant.$meta.error;

            /**
             * Was in Put state, and now not in put state, so save action was called
             */
            if ($scope.isPutting === true && result.isPutting === false && !result.error) {
                var successMessageTemplate = 'Tenant "{0}" has been successfully updated';
                var successMessageText = stringFormat(
                    successMessageTemplate,
                    tenant.name
                );

                alertsManager.addAlertSuccess({
                    title: 'Success',
                    text: successMessageText
                });
            }

            return result;
        }
    }

