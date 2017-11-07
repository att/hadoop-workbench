define(function (require) {
    "use strict";

    require("../ngModule").directive('tab', ['$parse', function ($parse) {
        return {
            require: '^tabset',
            restrict: 'EA',
            replace: true,
            templateUrl: '/app/shared/tabset-widget/views/tab.html',
            transclude: true,
            scope: {
                active: '=?',
                heading: '@',
                //This callback is called in contentHeadingTransclude once it inserts the tab's content into the dom
                onSelect: '&select',
                onDeselect: '&deselect'
            },
            controller: function () {
            },
            link: function postLink(scope, elm, attrs, tabsetCtrl, transclude) {
                scope.$watch('active', function (active) {
                    if (active) {
                        tabsetCtrl.select(scope);
                    }
                });

                scope.disabled = false;
                if (attrs.disabled) {
                    scope.$parent.$watch($parse(attrs.disabled), function (value) {
                        scope.disabled = !!value;
                    });
                }

                scope.select = function () {
                    if (!scope.disabled) {
                        scope.active = true;
                    }
                };

                tabsetCtrl.addTab(scope);
                scope.$on('$destroy', function () {
                    tabsetCtrl.removeTab(scope);
                });

                //We need to transclude later, once the content container is ready.
                //when this link happens, we're inside a tab heading.
                scope.$transcludeFn = transclude;
            }
        };
    }]);

});
