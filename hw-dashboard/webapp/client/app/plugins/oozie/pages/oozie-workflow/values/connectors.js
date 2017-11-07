define(function (require) {
    "use strict";

    require("../ngModule").constant("oozie.NodeConnectors", getConnectors());

    function getConnectors() {
        return {
            in: {
                isTarget: true,
                endpoint: ["Dot", {radius: "12", cssClass: "e-node__incoming-ep"}],
                paintStyle: {fillStyle: "transparent"},
                anchor: "Left",
                maxConnections: 500
            },
            out: {
                isSource: true,
                endpoint: ["Dot", {radius: "8.5", cssClass: "e-node__outgoing-ep"}],
                paintStyle: {fillStyle: "transparent"},
                anchor: "Right",
                maxConnections: 500
            },
            ok: {
                isSource: true,
                endpoint: ["Rectangle", {width: "13", height: "13", cssClass: "e-node__outgoing-ok-ep"}],
                paintStyle: {fillStyle: "transparent"},
                anchor: [1, 0.3, 0, 1],
                maxConnections: 500
            },
            error: {
                isSource: true,
                endpoint: ["Rectangle", {width: "13", height: "13", cssClass: "e-node__outgoing-error-ep"}],
                paintStyle: {fillStyle: "transparent"},
                anchor: [1, 0.7, 0, 1],
                maxConnections: 500
            },
            case: {
                isSource: true,
                endpoint: ["Rectangle", {width: "13", height: "13", cssClass: "e-node__outgoing-case-ep"}],
                paintStyle: {fillStyle: "transparent"},
                anchor: [1, 0.3, 0, 1],
                maxConnections: 500
            },
            default: {
                isSource: true,
                endpoint: ["Rectangle", {width: "13", height: "13", cssClass: "e-node__outgoing-default-ep"}],
                paintStyle: {fillStyle: "transparent"},
                anchor: [1, 0.7, 0, 1],
                maxConnections: 500
            }
        };
    }

});
