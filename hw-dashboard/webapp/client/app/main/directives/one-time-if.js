define(function (require) {
    "use strict";

    require('../ngModule').directive('oneTimeIf', ['$animate', function ($animate) {
            return {
                multiElement: true,
                transclude: 'element',
                priority: 600,
                terminal: true,
                restrict: 'A',
                $$tlb: true,
                link: function ($scope, $element, $attr, ctrl, $transclude) {
                    var block, childScope, previousElements;
                    var clearWatcher = $scope.$watch($attr.oneTimeIf, function ngIfWatchAction(value) {
                        if (value) {
                            if (!childScope) {
                                $transclude(function (clone, newScope) {
                                    childScope = newScope;
                                    clone[clone.length++] = document.createComment(' end ngIf: ' + $attr.oneTimeIf + ' ');
                                    // Note: We only need the first/last node of the cloned nodes.
                                    // However, we need to keep the reference to the jqlite wrapper as it might be changed later
                                    // by a directive with templateUrl when its template arrives.
                                    block = {
                                        clone: clone
                                    };
                                    $animate.enter(clone, $element.parent(), $element);
                                });
                                clearWatcher();
                            }
                        } else {
                            if (previousElements) {
                                previousElements.remove();
                                previousElements = null;
                            }
                            if (childScope) {
                                childScope.$destroy();
                                childScope = null;
                            }
                            if (block) {
                                previousElements = getBlockNodes(block.clone);
                                $animate.leave(previousElements).then(function () {
                                    previousElements = null;
                                });
                                block = null;
                            }
                        }
                    });
                }
            };
        }]
    );
});
