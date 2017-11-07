define(function (require, exports, module) {
    "use strict";

    var ng = require('angular');

    InfoViewerController.$inject = ['$scope', 'params'];
    function InfoViewerController($scope, params) {
        var editSections = params.editSections || [];
        var originalEditSectionsData = editSections.map(function (s) {
            return s.toJSON();
        });
        ng.extend($scope, {
            sections: params.sections,
            editSections: editSections,
            editMode: !!params.editMode,
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
            update: params.onUpdate || ng.noop
        });
    }

    module.exports = InfoViewerController;
});
