define(function (require) {
    "use strict";

    var types = require('./types');
    require('../ngModule').service('shared.subtypePropertyRestrictionPreprocessor', subtypePropertyRestrictionPreprocessor);

    function subtypePropertyRestrictionPreprocessor() {

        this.unpackRestrictions = function (subtypeMetadata) {
            return unpackRestrictions(subtypeMetadata);
        };
        /**
         *
         *   Example of JsonSchema property restrictions:
         *
         *
         *      "propertyRestrictions" : [
         *      {
             *        "name" : "alphanumericFirstLetter",
             *        "type" : "pattern",
             *        "value": "^[a-zA-Z_][a-zA-Z0-9_-]*$"
             *      },
         *      {
             *        "name" : "max-length-1000",
             *        "type" : "max-length",
             *        "value" : 1000
             *      },
         *      {
             *        "name" : "size-255",
             *        "type" : "max-length",
             *        "value" : 255
             *      },
         *      {
             *        "name" : "min-length-10",
             *        "type" : "min-length",
             *        "value" : 1000
             *      },
         *      {
             *        "name": "numberOozieVar",
             *        "type" : "pattern",
             *        "value": "^\d*(?:\$\{.*\})?\d*$"
             *      },
         *      {
             *        "name": "path",
             *        "type" : "pattern",
             *        "value": "^(?:[^ !$`&*()+]|(?:\\[ !$`&*()+]))+$"
             *      }
         *      ],
         *      "propertyRestrictionSets" : [
         *      {
             *        "name" : "alphanum-1000",
             *        "restrictions" : [
             *          "alphanumericFirstLetter",
             *          "max-length-1000"
             *        ]
             *
             *      },
         *      {
             *        "name": "path-255",
             *        "restrictions": [
             *          "path",
             *          "size-255"
             *        ]
             *      }
         *      ],
         */
        function unpackRestrictions(data) {
            var restrictionsImplementations = getRestrictionsAliases(data.propertyRestrictions, data.propertyRestrictionSets);

            if (restrictionsImplementations) {
                if (data.subtypes) {
                    Object.keys(data.subtypes).forEach(function (subtype) {
                        data.subtypes[subtype].forEach(function (element) {
                            if (element.jsonSchema.properties) {
                                traversePropertyTreeAndConvertAliasesIntoRestrictions(element.jsonSchema, restrictionsImplementations);
                            }
                        })
                    });
                } else if (data.properties && data.propertyRestrictions) {
                    //Object.keys(data.properties).forEach(function (prop) {
                        try {
                            traversePropertyTreeAndConvertAliasesIntoRestrictions(data, restrictionsImplementations);
                        } catch (e) {
                            console.log(e);
                        }
                    //});
                }

            }
            return data;
        }

        /**
         * Composes restrictionAliases into one flat object
         *
         * @param {Array} restrictions      // data.propertyRestrictions
         * @param {Array} restrictionSets   // data.propertyRestrictionSets
         */
        function getRestrictionsAliases(restrictions, restrictionSets) {
            var restrictionSetsNames = {};
            var singleRestrictionsObject = {};
            var finalRestrictionsObject = {};

            if (restrictions) {

                restrictions.forEach(function (restrictionContainer) {
                    if (restrictionContainer.name && restrictionContainer.type) {
                        var restriction = {
                            type: restrictionContainer.type,
                            value: restrictionContainer.value
                        };
                        if (restrictionContainer.message) {
                            restriction.message = restrictionContainer.message
                        }
                        singleRestrictionsObject[restrictionContainer.name] = restriction;
                        finalRestrictionsObject[restrictionContainer.name] = [restriction];
                    } else {
                        console.log("Warning!, metadata parse error: incorrect propertyRestriction", restrictionContainer);
                    }

                });

                if (restrictionSets) {
                    restrictionSets.forEach(function (restrictionSet) {
                        if (restrictionSet.name && restrictionSet.restrictions && restrictionSet.restrictions.length > 0) {
                            restrictionSetsNames[restrictionSet.name] = true;
                            finalRestrictionsObject[restrictionSet.name] = restrictionSet.restrictions.map(function (restrictionAlias) {
                                if (restrictionSetsNames[restrictionAlias]) {
                                    console.log("Warning!, metadata parse error: restrictionSet links to another restrictionSet which is prohibited. ", restrictionSet);
                                } else if (singleRestrictionsObject[restrictionAlias]) {
                                    return singleRestrictionsObject[restrictionAlias];
                                } else {
                                    console.log("Warning!, metadata parse error: restriction alias '" + restrictionAlias + "' implementation is not found. ", restrictionSet);
                                }
                            })
                        }
                    });
                }
            }

            return finalRestrictionsObject;
        }

        function traversePropertyTreeAndConvertAliasesIntoRestrictions(element, restrictions) {
            if (element.properties) {
                Object.keys(element.properties).forEach(function (propertyKey) {
                    var property = element.properties[propertyKey];
                    if (property.type == "string") {
                        if (property.restrictions) {
                            property.restrictions = convertAliasesToImplementations(property.restrictions, restrictions);
                        }
                    } else if (property.type == "object") {
                        traversePropertyTreeAndConvertAliasesIntoRestrictions(property, restrictions);
                    } else if (property.type == "array") {
                        if (property.items) {
                            var itemsElement = property.items;
                            if (itemsElement.type == "string") {
                                if (itemsElement.restrictions) {
                                    itemsElement.restrictions = convertAliasesToImplementations(itemsElement.restrictions, restrictions);
                                }

                            } else if (itemsElement.type == "object") {
                                traversePropertyTreeAndConvertAliasesIntoRestrictions(itemsElement, restrictions);
                            } else if (itemsElement.oneOf) {
                                itemsElement.oneOf.forEach(function (oneOfElemenet) {
                                    traversePropertyTreeAndConvertAliasesIntoRestrictions(oneOfElemenet, restrictions);
                                })
                            }
                        }
                    }
                });
            }

        }

        function convertAliasesToImplementations(aliases, implementationsObject) {
            var result = [];
            if (!aliases || !aliases.length) {
                return [];
            }

            aliases.forEach(function (alias) {
                if (implementationsObject[alias]) {
                    result.push.apply(result, implementationsObject[alias]);
                }
            });
            return result;
        }

    }
});
