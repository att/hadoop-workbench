define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').value("dap.main.models.Node", Node);

    function Node(data, isAbsoluteCoordinates, offset, templateId) {

        if (!offsetIsValid()) {
            throw new Error("Offset should be specified and be number greater than zero");
        }

        // absolutePositionsAvailable variable will be changed in `dataIsInvalid` validation function
        var absolutePositionsAvailable = isAbsoluteCoordinates;
        if (dataIsInvalid()) {
            throw new Error("Some of constructor parameters are invalid");
        }

        this.id = data.id;
        this.type = data.type;
        this.subtype = data.subtype;
        this.templateId = templateId || null;
        this.propertyFiles = [];
        this.propertyFilesDeferreds = [];

        this.position = {};

        if (absolutePositionsAvailable) {
            this.position.top = data.position.absolute.y;
            this.position.left = data.position.absolute.x;
        } else {
            this.position.top = data.position.relative.y * offset.y;
            this.position.left = data.position.relative.x * offset.x;
        }

        function dataIsInvalid() {
            /*jshint -W074*/
            var idIsInvalid = ng.isUndefined(data.id) || data.id === null;
            var typeIsInvalid = ng.isUndefined(data.type) || data.type === null;
            var subtypeIsInvalid = ng.isUndefined(data.subtype) || data.subtype === null;
            var posXIsInvalid = true;
            var posYIsInvalid = true;
            if (!ng.isUndefined(data.position)) {

                // check absolute coordinates first
                if (!ng.isUndefined(data.position.absolute)) {
                    posXIsInvalid = ng.isUndefined(data.position.absolute.x) || data.position.absolute.x === null || typeof data.position.absolute.x !== "number";
                    posYIsInvalid = ng.isUndefined(data.position.absolute.y) || data.position.absolute.y === null || typeof data.position.absolute.y !== "number";
                    absolutePositionsAvailable = !posXIsInvalid && !posYIsInvalid;
                }

                // if absolute coordinates are invalid, check relative coordinates then
                if (!absolutePositionsAvailable) {
                    if (!ng.isUndefined(data.position.relative)) {
                        posXIsInvalid = ng.isUndefined(data.position.relative.x) || data.position.relative.x === null || typeof data.position.relative.x !== "number";
                        posYIsInvalid = ng.isUndefined(data.position.relative.y) || data.position.relative.y === null || typeof data.position.relative.y !== "number";
                    }
                }
            }
            return idIsInvalid || typeIsInvalid || subtypeIsInvalid || posXIsInvalid || posYIsInvalid;
        }

        function offsetIsValid() {
            return ng.isUndefined(offset) || offset === null || typeof offset !== "number" || offset > 0;
        }
    }

    Node.prototype.toJSON = function () {
        var nodeProperties = {};

        this.properties.forEach(function (property) {
            var propertyName = property.key;
            var propertyValue = property.value || "";
            nodeProperties[propertyName] = propertyValue;
        });

        return {
            id: this.id,
            type: this.type,
            subtype: this.subtype,
            properties: nodeProperties,
            position: {
                x: this.position.left,
                y: this.position.top
            }
        };
    };

});
