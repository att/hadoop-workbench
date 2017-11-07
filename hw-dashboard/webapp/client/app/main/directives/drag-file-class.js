define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').directive('dragFileClass', function () {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attr) {
                var overClass = $attr.dragFileClass || 'drag-file-over';
                var leaveTimeout = null;
                $element.on('dragenter.dragFileClass', onDragEnter);
                //$element.on('dragstart.dragFileClass', onDragStart);
                $element.on('dragover.dragFileClass', onDragOver);

                $element.on('dragleave.dragFileClass', onDragLeave);
                $element.on('dragend.dragFileClass', onDragEnd);
                $element.on('drop.dragFileClass', onDrop);
                $element.on('mouseup.dragFileClass', onDrop);

                $scope.$on('$destroy', function () {
                    $element.off('.dragFileClass');
                });

                function onDragStart(event) {
                    if (leaveTimeout) {
                        clearTimeout(leaveTimeout);
                        leaveTimeout = null;
                    }
                    $element.addClass(overClass);
                }

                function onDragEnter(event) {
                    if (leaveTimeout) {
                        clearTimeout(leaveTimeout);
                        leaveTimeout = null;
                    }
                    $element.addClass(overClass);
                }

                function onDragOver(event) {
                    if (leaveTimeout) {
                        clearTimeout(leaveTimeout);
                        leaveTimeout = null;
                    }
                    $element.addClass(overClass);
                }

                function onDragLeave(event) {
                    leaveTimeout = setTimeout(function () {
                        $element.removeClass(overClass);
                    }, 100);
                }

                function onDragEnd(event) {
                    $element.removeClass(overClass);
                }

                function onDrop(event) {
                    $element.removeClass(overClass);
                }
            }
        };
    });
});
