define(function (require) {
    "use strict";
    var ng = require('angular');
    require('../ngModule').provider('core.focusCatcherService', focusCatcherServiceProvider);

    focusCatcherServiceProvider.$inject = [];
    function focusCatcherServiceProvider() {

        this.$get = ['hotkeys', '$timeout', function (hotkeys, $timeout) {
            return new FocusCatcherService(hotkeys, $timeout);
        }];

        function FocusCatcherService(hotkeys, $timeout) {

            var self = this;
            /*
             var config = [
             {
             key: 'w',
             preventDefault: true,
             cb: function(){}
             },
             {
             key: 'ctrl+c',
             preventDefault: true,
             cb: function(){}
             },
             ....
             ]
             */

            this.queueFromDown = [];
            this.actualQueue = [];
            this.register = function (config, isLast) {
                if (!ng.isArray(config)) {
                    config = [];
                }

                this.queueFromDown.push(config);
                if (isLast) {
                    unregisterQueue(this.actualQueue);
                    this.actualQueue.length = 0;
                    this.actualQueue = flattenQueue(this.queueFromDown);

                    this.queueFromDown.length = 0;
                    registerQueue(this.actualQueue);

                }
            };

            /**
             * This method several time attemps to get hotKeyBinding by calling "configGetter" function
             * on success attempt, it set's returned hotkeys
             * On multiple failure (50 times by 200ms) it stops
             * 
             * Main usage of this method is postLoad setup, then only widget containers are available, 
             * but data(and hotkey binding) been loaded later
             * 
             * @param configGetter {Function}
             */
            this.delayedRegister = function(configGetter) {
                var hotkeyBindings = configGetter();
                if (hotkeyBindings) {
                    self.register(hotkeyBindings, true)
                } else {
                    delayedBindingsGetterRecursiveLoop(configGetter);
                }
            };

            function registerQueue(queue) {
                queue.forEach(function (binding) {
                    hotkeys.add({
                        combo: binding.key,
                        callback: function (event, hotkey) {
                            event.stopPropagation();
                            if (binding.preventDefault) {
                                event.preventDefault();
                            }
                            binding.cb();
                        }
                    })
                });
            }

            function unregisterQueue(queue) {
                if (queue && queue.length) {
                    queue.forEach(function (binding) {
                        hotkeys.del(binding.key);
                    });
                }
            }

            function flattenQueue(queue) {
                var flatKeyCallbackMap = [];
                var existingKeys = {};
                queue.forEach(function (queueItemBindings) {
                    queueItemBindings.forEach(
                        function (binding) {
                            if (!existingKeys[binding.key]) {
                                existingKeys[binding.key] = true;
                                flatKeyCallbackMap.push(binding);
                            }
                        }
                    );
                });
                return flatKeyCallbackMap;
            }

            function delayedBindingsGetterRecursiveLoop(configGetter, infiniteLoopBlockerCounter) {
                if (infiniteLoopBlockerCounter === undefined) {
                    infiniteLoopBlockerCounter = 1;
                } else {
                    infiniteLoopBlockerCounter++;
                }
                if (infiniteLoopBlockerCounter == 50) {
                    // exit from loop
                    console.log('Delayed initialization of hotkey widget bindings failed');
                    return;
                }
                $timeout(function () {
                    var hotkeyBindings = configGetter();
                    if (hotkeyBindings) {
                        self.register(hotkeyBindings, true)
                    } else {
                        delayedBindingsGetterRecursiveLoop(configGetter, infiniteLoopBlockerCounter);
                    }
                }, 200);
            }

        }

    }
});
