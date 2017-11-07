/**
 * @namespace Main.Models
 */

define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory("dap.main.models.Platform", getPlatform);

    getPlatform.$inject = ['Restangular'];
    function getPlatform(Restangular) {

        //var platforms = Restangular.all('platforms');

       /* Restangular.extendModel('platforms', function (model) {
            //add custom functions here
        });*/

        /**
         * @typedef {{
         *  id: string,
         *  installationId: string,
         *  title: string,
         *  host: string
         * }} Main.Models.platformOptions
         */


        /**
         * @param {platformOptions}options
         * @constructor
         */
        function Platform(options) {
            this.id = options.id;
            this.installationId = options.installationId;
            this.title = options.title;
            this.host = options.host;
            this.type = options.type;
        }

        Platform.prototype.toJSON = function () {
            return {
                id: this.id,
                installationId: this.installationId,
                title: this.title,
                host: this.host,
                type: this.type
            };
        };

        Platform.factory = function (json) {
            json = ng.extend({
                id: '',
                installationId: '',
                title: '',
                host: '',
                type: ''
            }, json);

            return new Platform(json);
        };

        return Platform;
    }
});
