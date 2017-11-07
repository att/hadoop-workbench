define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').service('core.get-file-uploader', GetFileUploader);

    GetFileUploader.$inject = [
        'FileUploader'
    ];
    function GetFileUploader(FileUploader) {
        this.create = function (options) {
            //implementation from https://github.com/nervgh/angular-file-upload/wiki/FAQ#4-no-file-chosen-or-re-add-same-file
            FileUploader.FileSelect.prototype.isEmptyAfterSelection = function () {
                return true;
            };

            return new FileUploader(ng.extend({
                queueLimit: 1,
                autoUpload: false,
                removeAfterUpload: true,
                headers: {
                    Authorization: localStorage.token
                }
            }, options));
        };
    }
});
