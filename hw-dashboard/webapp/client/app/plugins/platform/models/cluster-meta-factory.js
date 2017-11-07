define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.models.ClusterMetaFactory', getMetaFactory);

    getMetaFactory.$inject = [
        'platform.models.ClusterIndexation',
        'platform.models.ClusterConfigRequest',
        'platform.models.JsonSectionPropertyMetaFactory'
    ];
    function getMetaFactory(ClusterIndexation,
                            ClusterConfigRequest,
                            JsonSectionPropertyMetaFactory) {
        function ClusterMeta(metadata) {

            function Cluster(options) {
                Object.keys(metadata).forEach((sectionKey) => {
                    this[sectionKey] = options[sectionKey];
                });

                this.titlePath = findTitleFieldPath();
                this.title = getTitle(options, this.titlePath);
                this.listPath = findListPath();
                this.indexation = options.indexation;
                this.configRequest = options.configRequest;
            }

            Cluster.prototype = {
                toJSON: function () {
                    var json = {
                        indexation: this.indexation.toJSON(),
                        configRequest: this.configRequest.toJSON(),
                    };
                    Object.keys(metadata)
                        .filter(key => metadata[key].type === "object")
                        .forEach(key => {
                            if (this[key] && this[key].toJSON == undefined) {
                                this[key] = JsonSectionPropertyMetaFactory(metadata[key])(this[key]);
                            }
                            json[key] = this[key].toJSON();
                        });

                    Object.keys(metadata)
                        .filter(key => metadata[key].type === "array")
                        .forEach(key => {
                            json[key] = this[key];
                        });

                    return json;
                }
            };

            Cluster.factory = function (options) {
                options = ng.extend({}, options);

                Object.keys(metadata)
                    .filter(key => metadata[key].type === "object")
                    .forEach(key => {
                        options[key] = JsonSectionPropertyMetaFactory(metadata[key]).factory(options[key]);
                    });
                options.indexation = ClusterIndexation.factory(options.indexation);
                options.configRequest = ClusterConfigRequest.factory();
                return new Cluster(options);
            };

            Cluster.processApiResponse = function (data) {
                if (ng.isArray(data)) {
                    return data.map(Cluster.processApiResponse);
                }
                return Cluster.factory(data);
            };


            function getTitle(options, titlePath) {
                let section = options[titlePath.section];
                if (section) {
                    return section[titlePath.property];
                }
                return '';
            }

            function findTitleFieldPath() {
                var result = {
                    section: Object.keys(metadata)[0],
                    property: Object.keys(metadata[Object.keys(metadata)[0]].properties)[0]
                };
                Object.keys(metadata).some((sectionKey) => {
                    let properties = metadata[sectionKey].properties;
                    return Object.keys(properties).some(propertyKey => {
                        if (properties[propertyKey].isTitleField) {
                            result = {
                                section: sectionKey,
                                property: propertyKey
                            };
                            return true;
                        }
                        return false;
                    });
                });
                return result;
            }

            function findListPath() {

                return Object.keys(metadata)
                    .filter(sectionKey => metadata[sectionKey].list !== undefined)
                    .map(sectionKey => Object.assign({}, {section: sectionKey}, metadata[sectionKey].list));
            }

            return Cluster;
        }


        return ClusterMeta;
    }
});
