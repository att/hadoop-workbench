define(function (require) {
    "use strict";

    require('./ngModule');

    // load module services
    require('./services/minNodeOccurs');
    require('./services/maxNodeOccurs');
    require('./services/ConnectionOccursRule');
    require('./services/maxConnectionOccurs');
    require('./services/minConnectionOccurs');
    require('./services/transitionOccurs');
    require('./services/patternMatcher');
    require('./services/uniqueField');
    require('./services/restrictionsService');
    require('./services/validator');

});
