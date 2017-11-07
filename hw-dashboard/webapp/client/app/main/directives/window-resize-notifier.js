define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').directive('windowResizeNotifier', ["$window", "$rootScope", function ($window, $rootScope) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var w = ng.element($window);
                w.on('resize', function () {
                    $rootScope.windowHeight = w.height();
                    $rootScope.windowWidth = w.width();
                    $rootScope.$apply();
                });
            }
        };
    }]);
});
