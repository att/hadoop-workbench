/**
 * API service
 *
 * It has almost the same interface as angular's $http service.
 * This service should be used instead of $http service to communicate with the backend.
 * All methods returns a Promise object, which is resolved with an extracted data
 *      or is rejected with an error object with an error message (depending of the response's status code)
 *
 * Example:
 *
 * function getPlatforms(){
 *      return API.get('/url/to/platforms').then(function(data){
 *          //process success here
 *
 *          return data.platforms || [];
 *      }, function(error){
 *
 *          //process error here
 *          alertManager.addAlertError({
 *              title: 'Error with status code ' + error.originalResponse.status,
 *              text: error.message
 *          });
 *      });
 * }
 */
/*jshint maxcomplexity: 10*/
define(function (require) {
    "use strict";

    require('../ngModule').provider('core.API', ApiProvider);

    ApiProvider.$inject = [];
    function ApiProvider() {
        this.$get = ['$http', '$q', '$log', function ($http, $q, $log) {
            return new ApiService($http, $q, $log);
        }];

        function ApiService($http, $q, $log) {
            /**
             * @param {string} url
             * @param {object} [config]
             * @returns $q.Promise
             */
            this.get = function (url, config) {
                return $http.get(url, config).then(processSuccess, processError);
            };

            /**
             * @param {string} url
             * @param {*} data
             * @param {object} [config]
             * @returns $q.Promise
             */
            this.post = function (url, data, config) {
                return $http.post(url, data, config).then(processSuccess, processError);
            };

            /**
             * @param {string} url
             * @param {*} data
             * @param {object} [config]
             * @returns $q.Promise
             */
            this.put = function (url, data, config) {
                return $http.put(url, data, config).then(processSuccess, processError);
            };

            /**
             * @param {string} url
             * @param {*} data
             * @param {object} [config]
             * @returns $q.Promise
             */
            this.patch = function (url, data, config) {
                return $http.put(url, data, config).then(processSuccess, processError);
            };

            /**
             * @param {string} url
             * @param {object} [config]
             * @returns $q.Promise
             */
            this.delete = function (url, config) {
                return $http.delete(url, config).then(processSuccess, processError);
            };

            function processSuccess(response) {
                return response.data.data;
            }

            function processError(response) {
                var error = createErrorObject(response, getErrorMessageFromResponse(response));
                $log.error('API response error: ', error);
                return $q.reject(error);
            }

            function getErrorMessageFromResponse(response) {
                if (response.data && response.data.message) {
                    return response.data.message;
                }

                switch (response.status) {
                    case -1:
                        return 'No connection with server at this time.';
                    case 404:
                        return 'Not found';
                    case 400:
                        return 'Bad request';
                    case 401:
                        return 'Wrong credentials';
                    case 403:
                        return 'Authorization failed';
                    case 419:
                        return 'Session expired';
                    case 500:
                        return response.data || 'Internal server error';
                    case 501:
                        return 'The request you try send is not implemented on the server. Check your code, please.';
                    case 504:
                        return 'Request timeout';
                    default:
                        return 'Oops... Something went wrong on the server';
                }
            }

            function createErrorObject(originalResponse, message) {
                return {
                    status: originalResponse.status,
                    statusText: originalResponse.statusText,
                    originalResponse: originalResponse,
                    message: message
                };
            }
        }

    }
});
