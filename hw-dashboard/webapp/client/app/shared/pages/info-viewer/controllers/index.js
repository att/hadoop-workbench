define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('shared.pages.InfoViewerController', Controller);

    Controller.$inject = [
        '$scope',
        '$widgetParams'
    ];
    function Controller($scope, $widgetParams) {
        var editSections = $widgetParams.params.editSections || [];
        var originalEditSectionsData;
        ng.extend($scope, {
            sections: $widgetParams.params.sections,
            data: $widgetParams.params.data || [],
            editSections: editSections,
            editMode: !!$widgetParams.params.editMode,
            savedAt: $widgetParams.params.savedAt,
            editable: editSections.length > 0
        });

        ng.extend($scope, {
                hideInfoViewer: function () {
                    $scope.$emit('hide.left-tab-panel');
                },
                switchToEditMode: function () {
                    $scope.editMode = true;
                },
                cancelEditMode: function () {
                    $scope.editMode = false;
                    $scope.editSections.forEach(function (s, i) {
                        s.populate(originalEditSectionsData[i]);
                    });
                },
                update: $widgetParams.params.onUpdate || ng.noop
            }
        );

        this.onParamChanged = function (param, newValue, oldValue) {
            switch (param) {
                case 'params.savedAt':
                    $scope.savedAt = newValue;
                    originalEditSectionsData = $scope.editSections.map(function (s) {
                        return s.toJSON();
                    });
                    $scope.cancelEditMode();
                    break;
                case 'params.data':
                    $scope.data = newValue;
                    init();
                    $scope.cancelEditMode();
            }
        };

        init();

        function init() {
            $scope.sections.forEach(function (schema, index) {
                schema.populate($scope.data[index]);
            });
            originalEditSectionsData = editSections.map(function (s) {
                return s.toJSON();
            });
        }
    }
});
