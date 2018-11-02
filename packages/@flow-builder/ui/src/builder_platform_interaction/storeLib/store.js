import { isPlainObject } from './isPlainObject';
import { deepFreeze } from './deepFreeze';
import { isDevMode } from "builder_platform_interaction/contextLib";
import { logFlowBuilderError } from 'builder_platform_interaction/loggingUtils';
/**
 * Library for UI state management
 *
 * @ScrumTeam Process UI
 * @author Ankush Bansal
 * @since 214
 */

/**
 * contains the state of the store
 */
let currentState;

/**
 * contains definition of a reducer which can used to transform state of the store
 */
let currentReducer;

/**
 * contains an instance of the store
 */
let storeInstance;

/**
 * contains list of all the listeners(aka callback that needs to be executed when state changes) of the store.
 * @type {Array}
 */
let currentListeners = [];

/**
 * Store singleton class
 */
export class Store {
    constructor(reducer) {
        if (!reducer) {
            logFlowBuilderError('Store must be initialized with reducer');
        } else if (!currentReducer) {
            currentReducer = reducer;
        } else {
            logFlowBuilderError('Reducer already exists');
        }
    }

    /**
     * Static method to create a single instance of a store
     * @param {Function} reducer reducer function
     * @returns {Object} instance of the store
     */
    static getStore(reducer) {
        if (!storeInstance) {
            storeInstance = new Store(reducer);
            storeInstance.dispatch({type: 'INIT'});
        }
        return storeInstance;
    }

    /**
     * @returns {Object} current state of the store
     */
    getCurrentState() {
        return currentState;
    }

    /**
     * Subscribe a listener to the store
     * @param {Function} listener function that will be executed when state of store changes
     * @returns {Function} unSubscribe function to unSubscribe from the store.
     */
    subscribe(listener) {
        currentListeners = [...currentListeners, listener];
        return function unSubscribe() {
            const index = currentListeners.indexOf(listener);
            if (index !== -1) {
                currentListeners = [...currentListeners.slice(0, index), ...currentListeners.slice(index + 1)];
            } else {
                logFlowBuilderError(`Failed to unsubscribe listener. Listener ${listener} not found!`);
            }
        };
    }

    /**
     * To change the state of the store, call this method with appropriate action
     * @param {Object} action object which contains a type property
     */
    dispatch(action) {
        if (!isPlainObject(action)) {
            logFlowBuilderError('Action is not a plain javascript object');
        }

        if (!action.type) {
            logFlowBuilderError('Type of action is not defined');
        }

        // Using deepFreeze has a performance impact which is why we only use
        // it in development mode.
        currentState = currentReducer(currentState, action);
        if (isDevMode()) {
            currentState = deepFreeze(currentState);
        }
        // once state is changes, executing all the listeners
        currentListeners.forEach((listener) => {
            listener();
        });
    }
}
