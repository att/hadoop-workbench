/**
 * @namespace Main.Models
 */

define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory("dap.main.models.Service", getService);

    getService.$inject = [
    ];
    function getService() {

        /**
         * @typedef {{
         *  id: string,
         *  title: string
         *  type?:string
         * }} Main.Models.serviceOptions
         */

        /**
         * @param {Main.Models.serviceOptions}options
         * @constructor
         */
        function Service(options) {
            this.id = options.id;
            this.title = options.title;
            this.type = options.type;
        }

        Service.prototype.toJSON = function () {
            return {
                id: this.id,
                title: this.title,
                type: this.type
            };
        };

        Service.factory = function (json) {
            json = ng.extend({
                id: '',
                title: '',
                type: ''
            }, json);

            return new Service(json);
        };

        return Service;
    }
});
