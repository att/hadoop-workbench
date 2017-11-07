define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // load module controllers

    // load module services

    // load module models

    // load module values


    // load module constants
    require("./constants/actions");
    require("./constants/widget-store-events");

    //load actions
    require('./actions/widget');

    //load stores
    require("./stores/widget");
});
