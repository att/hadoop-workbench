define(function (require) {
    "use strict";

    var angular = require('angular');
    require('../ngModule').factory('kafka.models.KafkaTopic', getFactory);

    // currently only value is :"topicId"

    // future provided value: [not returned by API now]
    // {
    //     "id": "Topic_1",
    //     "replication": 1,
    //     "partitionNumber": 1,
    //     "brokerNumber": 1
    // },

    getFactory.$inject = [];
    function getFactory() {
        function KafkaTopic(options) {
            this.id = options.id;
            this.replication = options.replication;
            this.partitionNumber = options.partitionNumber;
            this.brokerNumber = options.brokerNumber;
        }

        KafkaTopic.prototype = {
            toJSON: function () {
                var json = {
                    id: this.id,
                    replication: this.replication,
                    partitionNumber: this.partitionNumber,
                    brokerNumber: this.brokerNumber,
                };
                return json;
            }
        };

        KafkaTopic.factory = function (options) {
            //@TODO: remove after server API changed to full data response not just "id" as string
            if (typeof options === "string") {
                options = {id: options};
            }
            options = angular.extend({
                id: "",
                replication: "",
                partitionNumber: "",
                brokerNumber: "",
            }, options);

            return new KafkaTopic(options);
        };

        KafkaTopic.processApiResponse = function (data) {
            if (angular.isArray(data)) {
                return data.map(KafkaTopic.processApiResponse);
            }
            return KafkaTopic.factory(data);
        };

        return KafkaTopic;
    }
});
