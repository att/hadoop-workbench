/**
 * @namespace Main.Models
 */

define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory("dap.main.models.User", getUser);

    getUser.$inject = [];
    function getUser() {
        return User;
    }

    /**
     * @typedef {{
     *  login: string
     * }} Main.Models.userOptions
     */

    /**
     * @param {Main.Models.userOptions}options
     * @constructor
     */
    function User(options) {
        this.login = options.login;
        this.features = options.features;
    }

    User.prototype.toJSON = function () {
        return {
            login: this.login,
            features: this.features
        };
    };

    User.factory = function (json) {
        json = ng.extend({
            login: '',
            features: []
        }, json);

        return new User(json);
    };
});
