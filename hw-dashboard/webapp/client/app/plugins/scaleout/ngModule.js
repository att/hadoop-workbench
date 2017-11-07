define(function (require) {
    "use strict";

    require('dashboard');

    return require('angular').module('scaleout', ['dashboard']);
});
