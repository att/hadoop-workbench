define(function (require) {
    "use strict";

    require("../ngModule").directive('tabHeadingTransclude', [function () {
        return {
            restrict: 'A',
            require: '^tab',
            link: function (scope, elm, attrs, tabCtrl) {
                scope.$watch('headingElement', function updateHeadingElement(heading) {
                    if (heading) {
                        elm.html('');
                        elm.append(heading);
                    }
                });
            }
        };
    }]);
});
