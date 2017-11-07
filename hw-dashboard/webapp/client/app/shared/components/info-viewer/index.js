define(function (require, exports, module) {
    "use strict";

    module.exports = {
        pathPrefix: 'articles/',
        controller: require('./controller'),
        scope: {
            sections: '=',
            editSections: '=',
            editMode: '=',
            onUpdate: '&'
        }
    };
});
