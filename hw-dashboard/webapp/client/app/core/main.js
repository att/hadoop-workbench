define(function (require) {
    "use strict";

    require('./ngModule');

    require('./services/RecursionHelper');
    require('./services/api-service');
    require('./services/get-file-uploader');
    require('./services/selected-item');
    require('./services/makeActionCreator');
    require('./services/makeAsyncAPIRequest');
    require('./services/lock');
    require('./services/metadata');
    require('./services/credits');
    require('./services/settings');
    require('./services/autocomplete-dictionary');
    require('./services/focus-catcher');
    require('./services/widgetUiControl');
    require('./services/safe-apply');
    require('./services/utils');

    require('./config');

    require('./values/config');

    require('./constants/string-format');
    require('./constants/guid');
    require('./constants/processing-states');

});
