import { createStore, applyMiddleware, compose } from 'redux';
import async from '../middleware/async-action'
import thunk from 'redux-thunk'
import rootReducer from '../reducers/index';

export default function configureStore(initialState) {
    let finalCreateStore = compose(applyMiddleware(thunk, async))(createStore);
    const store = finalCreateStore(rootReducer, initialState);

    if (module.hot) {
        // Enable Webpack hot module replacement for reducers
        module.hot.accept('../reducers/index', () => {
            const nextReducer = require('../reducers/index');
            store.replaceReducer(nextReducer);
        });
    }

    return store;
}
