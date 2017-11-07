define(function (require) {
    "use strict";

    let ng = require("angular");
    /**
     *      Usage :
     *      infinite-scroll-callback - (required) called when list is scrolled to the bottom
     *      infinite-scroll-container-selector - (optional) - selector to the container element
     *      infinite-scroll-distance - (optional) - number of container height * count for preload
     *      infinite-scroll-disabled - (optional) - disabled watcher
     *      infinite-scroll-immediate-check - (optional) - run immediate check for scrolling
     *
     *      Example:
     *             <div class="b-menu-search-items__list-container" ng-show="!requesting"
     *                       infinite-scroll
     *                       infinite-scroll-callback="loadMoreFilteredComponents()"
     *                       infinite-scroll-container-selector="ul.b-menu-search-items__list-container__list"
     *                       infinite-scroll-distance="1"
     *              >
     *                   <div class="b-menu-search-items__list-container__no-matches"
     *                          ng-show="componentsFiltered.length === 0">
     *                          No matches found
     *                   </div>
     *                  <!-- container !!!!!!! -->
     *                   <ul class="b-menu-search-items__list-container__list"
     *                               ng-show="componentsFiltered.length > 0"
     *                               navigable-list-items="componentsFiltered"
     *                               nl-selector="li"
     *                               nl-selected-class="selected"
     *                               nl-highlighted-class="highlighted">
     *
     *                               <li class="b-add-service-search__omnibox__item" >
     *                                      <!-- container items
     *                              </li>
     *                  </ul>
     *              </div>
     */
    require('../ngModule').directive('infiniteScroll', [
        '$rootScope', '$window', '$timeout', function ($rootScope, $window, $timeout) {
            return {
                link: function (scope, elem, attrs) {
                    var checkWhenEnabled, handler, scrollDistance, scrollEnabled, container;
                    $window = angular.element($window);

                    if (attrs.infiniteScrollContainerSelector != null) {
                        container = elem.find(attrs.infiniteScrollContainerSelector);
                    } else {
                        container = elem;
                    }
                    //container.css('overflow-y', 'scroll');
                    //container.css('overflow-x', 'hidden');
                    //container.css('height', 'inherit');

                    scrollDistance = 0;
                    if (attrs.infiniteScrollDistance != null) {
                        scope.$watch(attrs.infiniteScrollDistance, function (value) {
                            return scrollDistance = parseInt(value, 10);
                        });
                    }
                    scrollEnabled = true;
                    checkWhenEnabled = false;
                    if (attrs.infiniteScrollDisabled != null) {
                        scope.$watch(attrs.infiniteScrollDisabled, function (value) {
                            scrollEnabled = !value;
                            if (scrollEnabled && checkWhenEnabled) {
                                checkWhenEnabled = false;
                                return handler();
                            }
                        });
                    }
                    $rootScope.$on('refreshStart', function (event, parameters) {
                        elem.animate({scrollTop: "0"});
                    });
                    handler = function () {
                        var remaining, shouldScroll,
                            containerHeight, containerScrollHeight, containerScrollValue;
                        containerHeight = container.height();
                        containerScrollHeight = container[0].scrollHeight;
                        containerScrollValue = container.scrollTop();

                        remaining = containerScrollHeight - (containerHeight + containerScrollValue);
                        shouldScroll = remaining <= containerHeight * scrollDistance;
                        if (shouldScroll && scrollEnabled) {
                            if ($rootScope.$$phase) {
                                return scope.$eval(attrs.infiniteScrollCallback);
                            } else {
                                return scope.$apply(attrs.infiniteScrollCallback);
                            }
                        } else if (shouldScroll) {
                            return checkWhenEnabled = true;
                        }
                    };
                    container.on('scroll', handler);
                    scope.$on('$destroy', function () {
                        $window.off('scroll', handler);
                        container.off();
                        return container.remove();
                    });
                    return $timeout((function () {
                        if (attrs.infiniteScrollImmediateCheck) {
                            if (scope.$eval(attrs.infiniteScrollImmediateCheck)) {
                                return handler();
                            }
                        } else {
                            return handler();
                        }
                    }), 0);
                }
            };
        }
    ]);
});