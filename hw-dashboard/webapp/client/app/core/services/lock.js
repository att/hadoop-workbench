define(function (require) {
    "use strict";
    require('../ngModule').factory('core.lockProvider', lockProvider);

    function lockProvider() {
        var lock = {
            getInstance: function () {
                return new Lock();
            }
        };
        return lock;
    }

    function Lock() {
        this._transitive = [];
    }

    Lock.prototype = {
        add: function (path) {
            if (!this.isExists(path)) {
                this._transitive.push(path);
            }
        },

        remove: function (path) {
            var index = this._transitive.indexOf(path);
            if (index != -1) {
                this._transitive.splice(index);
            }
        },

        isExists: function (path) {
            return (this._transitive.indexOf(path) != -1);
        }

    };

    Lock.prototype.constructor = Lock;

});
