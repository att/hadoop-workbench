define(function (require) {
    "use strict";

    require('../ngModule').constant('core.makeAsyncAPIRequest', function makeAsyncAPIRequest(flux, action) {
            var types = action.types;
            var callAPI = action.callAPI;
            var shouldCallAPI = action.shouldCallAPI || function () {
                    return true;
                };
            var payload = action.payload;


            if (!types) {
                // Normal action: pass it on
                return;
            }

            if (
                !Array.isArray(types) ||
                types.length !== 3 || !types.every(function (type) {
                    return typeof type === 'string';
                })
            ) {
                throw new Error('Expected an array of three string types.');
            }

            if (typeof callAPI !== 'function') {
                throw new Error('Expected fetch to be a function.');
            }

            if (!shouldCallAPI()) {
                return;
            }

            var requestType = types[0],
                successType = types[1],
                failureType = types[2];

            flux.dispatch(requestType, Object.assign({}, payload, {
                type: requestType
            }));

            return callAPI().then(function (response) {
                    return flux.dispatch(successType, Object.assign({}, payload, {
                        response: response,
                        type: successType
                    }));
                },
                function (error) {
                    return flux.dispatch(failureType, Object.assign({}, payload, {
                        error: error,
                        type: failureType
                    }));
                }
            );
        }
    );
});
