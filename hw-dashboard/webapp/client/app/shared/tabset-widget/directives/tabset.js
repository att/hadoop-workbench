define(function (require) {
    "use strict";

    require("../ngModule").directive('tabset', function () {
        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            scope: {},
            controller: 'dap.shared.TabsetController',
            templateUrl: '/app/shared/tabset-widget/views/tabset.html'
        };
    });

});
