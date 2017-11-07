export default store => next => action => {
    if (!Array.isArray(action.types) || action.types.length !== 3 || !Array.isArray(action.notifications || action.notifications.length !== 3)) {
        return next(action);
    }

    let { call } = action;
    const { types } = action;
    const { notifications } = action;

    if (typeof call !== 'function') {
        throw new Error('"call" must be a function.')
    }

    if (!Array.isArray(types) || types.length !== 3) {
        throw new Error('Expected an array of three action types.')
    }
    if (!types.every(type => typeof type === 'string')) {
        throw new Error('Expected action types to be strings.')
    }

    function actionWith(data) {
        return Object.assign({}, action, data);
    }

    const [ requestType, successType, failureType ] = types;
    const [ requestNotification, successNotification, failureNotification ] = notifications;

    next(actionWith({type: requestType}));
    if (requestNotification) {
        next({type: 'SEND_NOTIFICATION', notification: requestNotification()});
    }

    return call().then(
        result => {
            if (successNotification) {
                next({type: 'SEND_NOTIFICATION', notification: successNotification()});
            }
            return next(actionWith({
                result,
                type: successType
            }))
        },
        error => {
            if (failureNotification) {
                next({type: 'SEND_NOTIFICATION', notification: failureNotification(error.message)});
            }
            return next(actionWith({
                type: failureType,
                error: error.message || 'Something bad happened',
                errorType: error.errorType
            }))
        }
    )
}
