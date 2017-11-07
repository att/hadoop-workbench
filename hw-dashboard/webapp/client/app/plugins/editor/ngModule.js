define(function (require) {
    "use strict";
    require('uiCodemirror');
    require('codemirrorSqlMode');
    require('codemirrorXmlMode');
    require('codemirrorPigMode');
    require('codemirrorShellMode');
    require('codemirrorPythonMode');
    require('codemirrorPropertiesMode');
    require('codemirrorAddonSearch');
    require('codemirrorAddonDialog');

    return require('angular').module('editor', [
        'ui.codemirror'
    ]);
});
