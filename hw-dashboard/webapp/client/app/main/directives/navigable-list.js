define(function (require) {
    "use strict";
    var angular = require('angular');
    require('../ngModule').directive('navigableList', function () {
        return {
            restrict: 'A',
            scope: {
                onChoose: '=nlOnChoose',
                listExternallySelectedIndex: '=nlExternallySelectedIndex'
            },
            controller: ['$scope', function ($scope) {
                var onSelect = function () {
                };
                var onListChanged = function () {
                };
                this.list = [];

                this.choose = function (item) {
                    $scope.$apply(function(){
                        $scope.onChoose.call(null, item);
                    });
                };
                this.onSelect = function (cb) {
                    onSelect = cb;
                };
                this.onListChanged = function (cb) {
                    onListChanged = cb;
                };
                this.select = function (index) {
                    onSelect(index);
                };
                this.listChanged = function () {
                    onListChanged();
                };
            }],
            link: function (scope, element, attrs, ctrl) {
                scope.$watch('listExternallySelectedIndex', function (newIndex) {
                    if (newIndex != undefined) {
                        ctrl.select(newIndex);
                    }
                });
            }
        };
    });
    require('../ngModule').directive('navigableListInput', function () {
        return {
            restrict: 'A',
            require: "^navigableList",
            link: function (scope, element, attrs, navigableListCtrl) {
                var selectedIndex = -1;

                element.on('keydown', function (event) {
                    var keyCodeUp = 38;
                    var keyCodeDown = 40;
                    var keyCodeEnter = 13;
                    if (event.keyCode === keyCodeUp) {
                        if (selectedIndex <= 0) {
                            setSelectedIndex(navigableListCtrl.list.length - 1);
                        } else {
                            setSelectedIndex(selectedIndex - 1);
                        }
                        return false;
                    }
                    if (event.keyCode === keyCodeDown) {
                        if (selectedIndex >= navigableListCtrl.list.length - 1) {
                            setSelectedIndex(0);
                        } else {
                            setSelectedIndex(selectedIndex + 1);
                        }
                        return false;
                    }
                    if (event.keyCode === keyCodeEnter && selectedIndex > -1) {
                        var selectedModule = navigableListCtrl.list[selectedIndex];
                        if (selectedModule) {
                            navigableListCtrl.choose(selectedModule);
                        }
                        return false;
                    }
                });

                navigableListCtrl.onListChanged(function () {
                    selectedIndex = -1;
                    navigableListCtrl.select(selectedIndex);
                });

                function setSelectedIndex(index) {
                    selectedIndex = index;
                    navigableListCtrl.select(selectedIndex);
                }
            }
        };
    });
    require('../ngModule').directive('navigableListItems', function () {
        return {
            restrict: 'A',
            require: "^navigableList",
            scope: {
                list: '=navigableListItems'
            },
            link: function (scope, element, attrs, navigableListCtrl) {
                var itemSelector = attrs.nlSelector || 'li';
                var selectedClass = attrs.nlSelectedClass || 'selected';
                var highlightedClass = attrs.nlHighlightedClass || 'highlighted';

                var mouseCoords = [];

                navigableListCtrl.list = scope.list || [];
                navigableListCtrl.onSelect(function (index) {
                    var items = element.find(itemSelector);
                    items.removeClass(selectedClass);
                    element.removeClass(highlightedClass);
                    if (index > -1) {
                        var el = items.eq(index);
                        el.addClass(selectedClass);
                        scroll(el);
                    }
                });
                scope.$watchCollection('list', function () {
                    navigableListCtrl.listChanged();
                });

                angular.element('body').on('mousemove', function(event) {
                    if (mouseCoords.clientX != event.clientX && mouseCoords.clientY != event.clientY) {
                        mouseCoords = {clientX: event.clientX, clientY: event.clientY};
                        element.addClass(highlightedClass);
                    }
                });

                function scroll(el) {
                    var containerHeight = element.height();
                    var containerScrollTop = element.scrollTop();
                    var elHeight = el.height();
                    var elOffsetToVisibleParentTopLine = findOffsetChildRelativeToParentVisibleTopLine(element, el);
                    if (elOffsetToVisibleParentTopLine < 0) {
                        // element's top line is above "visible container window"
                        element.scrollTop(containerScrollTop + elOffsetToVisibleParentTopLine);
                    } else if (containerHeight < elOffsetToVisibleParentTopLine + elHeight) {
                        // element's bottom line is below "visible container window"
                        element.scrollTop(containerScrollTop + (elOffsetToVisibleParentTopLine + elHeight - containerHeight));
                    }
                }

                /**
                 * 
                 * @param rootEl    {Jquery DOM element container}      @required
                 * @param childEl   {Jquery DOM element container}      @required
                 * @param _calculatedOffset  {undefined|number}          @private - do not use
                 * @param _infiniteLoopBreaker {undefined|number}       @private - do not use
                 * @returns {number}
                 */
                function findOffsetChildRelativeToParentVisibleTopLine(rootEl, childEl, _calculatedOffset, _infiniteLoopBreaker) {
                    var childElPositionObj, childElPositionTop, rootElPositionObj, rootElPositionTop;
                    if (_infiniteLoopBreaker === undefined) {
                        /*
                         * Some complex html elements could have deep structure,
                         * but normal is from 1 to 3
                         */
                        _infiniteLoopBreaker = 50;
                    } else if (_infiniteLoopBreaker-- < 0) {
                        return 0;
                    }
                    if (_calculatedOffset === undefined) {
                        _calculatedOffset = 0;
                    }
                    var childOffsetParentEl = childEl.offsetParent();
                    if (childOffsetParentEl === undefined || childOffsetParentEl[0] === undefined) {
                        return 0;
                    }
                    childElPositionObj = childEl.position();
                    childElPositionTop = childElPositionObj ? childElPositionObj.top : 0;

                    if (childOffsetParentEl[0] == rootEl[0]) {
                        return _calculatedOffset + childElPositionTop;
                    } else {
                        var rootOffsetParentEl = rootEl.offsetParent();
                        if (rootOffsetParentEl && (childOffsetParentEl[0] == rootOffsetParentEl[0])) {
                            rootElPositionObj = rootEl.position();
                            rootElPositionTop = rootElPositionObj ? rootElPositionObj.top : 0;
                            return _calculatedOffset + childElPositionTop - rootElPositionTop;
                        } else {
                            return findOffsetChildRelativeToParentVisibleTopLine(rootEl, childOffsetParentEl, childElPositionTop, _infiniteLoopBreaker);
                        }
                    }
                }
            }
        };
    });
});
