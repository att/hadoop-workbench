define(function (require) {
    "use strict";

    require('../ngModule').directive('scrollTo', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var selector = attrs['stSelector'] || 'li';
                var scrollPadding = attrs['scrollToPadding'] || 0;
                attrs.$observe('scrollTo', function (newVal, oldVal) {
                    if (newVal && newVal !== oldVal) {
                        var el = element.find(selector).eq(newVal);
                        if (el[0]) {
                            var rootOffset = findOffsetParentShift(element, el);
                            var containerHeight = element.height();
                            var containerScrollTop = element.scrollTop();
                            var elHeight = el.height();
                            var paddingHeight = elHeight * scrollPadding;
                            var elPositionTop = el.position().top - rootOffset;
                            if (elPositionTop - paddingHeight< 0) {
                                element.scrollTop(containerScrollTop + elPositionTop - paddingHeight);
                            } else if (containerHeight < elPositionTop + elHeight + paddingHeight) {
                                element.scrollTop(containerScrollTop + (elPositionTop + elHeight + paddingHeight - containerHeight));
                            }
                        }
                    }
                });
            }
        };

        function findOffsetParentShift(rootEl, childEl) {
            var childOffsetParent = childEl.offsetParent();
            if (childOffsetParent[0] == rootEl[0]) {
                return 0;
            } else {
                return rootEl.position().top;
            }
        }

    });
});
