define(function (require) {
    "use strict";
    require('../ngModule').provider('core.autocomplete-dictionary', AutocompleteDictionaryProvider);

    function AutocompleteDictionaryProvider() {
        this.$get = RestService;
    }

    RestService.$inject = [
        'flume.restService', 'oozie.restService',
    ];
    function RestService(flumeRestService, oozieRestService) {
        var oozieDictionaryDeffered = null;
        var isOozieRequestFailed = false;
        var flumeDictionaryDeffered = null;
        var isFlumeRequestFailed = false;

        return new AutocompleteDictionaryService();

        function AutocompleteDictionaryService() {

            this.getOozieMustacheDictionary = function () {
                if (oozieDictionaryDeffered === null || isOozieRequestFailed) {
                    oozieDictionaryDeffered = oozieRestService.getMustacheDictionary().then(function (data) {
                        isOozieRequestFailed = false;
                        return data;
                    }).catch(function () {
                        isOozieRequestFailed = true;
                    });
                }
                return oozieDictionaryDeffered;
            };

            this.getFlumeMustacheDictionary = function () {
                if (flumeDictionaryDeffered === null || isFlumeRequestFailed) {
                    flumeDictionaryDeffered = flumeRestService.getMustacheDictionary().then(function (data) {
                        isFlumeRequestFailed = false;
                        return data;
                    }).catch(function () {
                        isFlumeRequestFailed = true;
                    });
                }
                return flumeDictionaryDeffered;
            };
        }
    }
});
