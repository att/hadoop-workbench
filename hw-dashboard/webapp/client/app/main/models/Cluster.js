define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory("dap.main.models.Cluster", getCluster);

    getCluster.$inject = [];
    function getCluster() {
        return Cluster;
    }

    /**
     * @typedef {{
     *  id: string,
     *  title: string
     * }} Main.Models.clusterOptions
     */


    /**
     * @param {clusterOptions}options
     * @constructor
     */
    function Cluster(options) {
        this.id = options.id;
        this.title = options.title;
    }

    Cluster.prototype.toJSON = function () {
        return {
            id: this.id,
            title: this.title
        };
    };

    Cluster.factory = function (json) {
        json = ng.extend({
            id: '',
            title: ''
        }, json);

        return new Cluster(json);
    };
});
