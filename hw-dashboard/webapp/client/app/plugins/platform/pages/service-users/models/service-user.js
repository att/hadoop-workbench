define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.pages.service-users.models.ServiceUser', getFactory);

    getFactory.$inject = [];
    function getFactory() {
        function User(options) {
            this.id = options.id;
            this.name = options.name;
            this.keyId = options.keyId;
            this.homePath = options.homePath;
        }

        User.prototype = {
            toJSON: function () {
                return {
                    id: this.id,
                    name: this.name,
                    keyId: this.keyId,
                    homePath: this.homePath
                };
            }
        };

        User.factory = function (options) {
            options = ng.extend({
                id: null,
                keyId: null,
                name: "",
                homePath: "/"
            }, options);

            return new User(options);
        };

        return User;
    }
});
