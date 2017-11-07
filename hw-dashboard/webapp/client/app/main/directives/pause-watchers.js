/**
 * Usage:
 * <pause-watchers when="{{ pause }}">
 *  <!-- Your Tab View -->
 * </pause-watchers>
 */
define(function (require) {
    "use strict";
    var ng = require('angular');

    require('../ngModule').directive('pauseWatchers', function () {
        // pauseWatcher deceleration here
        return {
            restrict: 'EA',
            scope: true,
            link: function(scope, element, attribute) {
                var playWatchers;
                attribute.$observe('when', function(value) {
                    if(value === 'true') {
                        playWatchers = pauseWatchers(scope, true);
                    } else {
                        if (playWatchers) {
                            playWatchers();
                        }
                    }
                });
            }
        }
    });

    /**
     * Pause watchers on ng-repeat list
     *  watchers disabled for items with pauseWatchersInListPauseCondition
     *
     *  enabled only if "pauseWatchersInListPauseConditionCallback" attribute is equal true
     */
    require('../ngModule').directive('pauseWatchersInList', ['$parse', '$window', function ($parse) {
        // pauseWatcher deceleration here
        return {
            restrict: 'EA',
            link: function(scope, element, attribute) {
                var childrenPlayWatchers = [], whenHandler;
                var pauseConditionCallback = $parse(attribute.pauseWatchersInListPauseConditionCallback)(scope);

                var systemIsActive = false;

                whenHandler = function(value) {
                    if (value > 0) {
                        systemIsActive = true;
                        scanChildList();
                    } else {
                        systemIsActive = false;
                        // Add back the watchers for the children
                        restoreAllChildWatchers();
                    }
                };
                attribute.$observe('pauseWatchersInListWhen', whenHandler);

                function scanChildList() {
                    var child = scope.$$childHead;

                    var i = 0;
                    while (child) {

                        if (pauseConditionCallback(child)) {

                            if (!(typeof  childrenPlayWatchers[maskId(child.$id)] === 'function')) {
                                childrenPlayWatchers[maskId(child.$id)] = pauseWatchers(child);
                            } else {
                                //skip, already paused !
                            }
                        } else {

                            if (childrenPlayWatchers[maskId(child.$id)] && (typeof  childrenPlayWatchers[maskId(child.$id)] === 'function')) {
                                childrenPlayWatchers[maskId(child.$id)]();
                                delete childrenPlayWatchers[maskId(child.$id)];
                            }
                        }

                        child = child.$$nextSibling;
                        i++;
                    }
                }

                // Make object key string, not integer
                function maskId(id) {
                    return '_' + id;
                }

                function restoreAllChildWatchers() {
                    ng.forEach(childrenPlayWatchers, function(playChildWatcher){
                        playChildWatcher();
                    });
                }
            }
        }
    }]);

    function pauseWatchers(scope, skip) {
        var child = scope.$$childHead,
            childrenPlayWatchers = [],
            watchers;
        // Save the watchers and then remove them from scope. Unless we are skipping this parent scope.
        if(!skip && scope && scope.$$watchers && scope.$$watchers.length !== 0) {
            watchers = scope.$$watchers;
            scope.$$watchers = [];
        }
        // Call pauseWatchers on all the children and save their playWatcher functions
        while(child) {
            childrenPlayWatchers.push(pauseWatchers(child));
            child = child.$$nextSibling;
        }
        return function playWatcher() {
            // Add back the watchers
            if(scope && watchers) {
                scope.$$watchers = watchers;
            }
            // Add back the watchers for the children
            if (childrenPlayWatchers.length !== 0) {
                ng.forEach(childrenPlayWatchers, function(playChildWatcher) {
                    playChildWatcher();
                });
            }
        };
    }
});
