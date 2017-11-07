(function (window, angular) {
    "use strict";

    angular.module('flux', [])
        .provider('flux', function fluxProvider() {
            var EventEmitter2 = require('eventemitter2');
            this.$get = ['$rootScope', 'flux-dispatcher', function fluxFactory($rootScope, dispatcher) {
                /* STORE */
                function Store() {
                    this.eventEmitter = new EventEmitter2({
                        wildcard: '*'
                    });
                }

                Store.prototype = {
                    on: function (eventName, callback) {
                        return dispatcher.on(eventName, callback);
                    },
                    emit: function (eventName) {
                        return this.eventEmitter.emit(eventName);
                    },
                    emitChange: function () {
                        return this.emit('change');
                    }
                };

                return {
                    createStore: function (constr) {
                        var store = new Store();
                        var storeExport = {
                            $listenTo: function (eventName, callback) {
                                if (!callback) {
                                    callback = eventName;
                                    eventName = '*';
                                }
                                store.eventEmitter.on(eventName, callback);

                                return function () {
                                    store.eventEmitter.off(eventName, callback);
                                };
                            }
                        };
                        constr.call(store, storeExport);

                        return storeExport;
                    },
                    dispatch: function () {
                        return dispatcher.dispatch.apply(dispatcher, arguments);
                    }
                };
            }];

        })
        .service('flux-dispatcher', Dispatcher);

    Dispatcher.$inject = ['$rootScope'];
    function Dispatcher($rootScope) {
        var EventEmitter2 = require('eventemitter2');
        var eventEmitter = new EventEmitter2({
            wildcard: '*'
        });

        this.dispatch = function () {
            eventEmitter.emit.apply(eventEmitter, arguments);
            //$rootScope.$emit.apply($rootScope, arguments);
        };

        this.on = function (eventName, callback) {
            if (callback === undefined) {
                callback = eventName;
                eventName = '*';
            }
            if (typeof eventName !== 'string') {
                throw new Error('EventName must be a string');
            }
            if (typeof callback !== 'function') {
                throw new Error('Callback must be a function');
            }
            eventEmitter.on(eventName, callback);
            return function () {
                eventEmitter.off(eventName, callback);
            };
        };

        $rootScope.constructor.prototype.$listenTo = function (storeExport, eventName, callback) {
            var unwatch = storeExport.$listenTo(eventName, callback);

            this.$on('$destroy', function () {
                unwatch();
            });

            return unwatch;
        };
    }


}(window, window.angular));
