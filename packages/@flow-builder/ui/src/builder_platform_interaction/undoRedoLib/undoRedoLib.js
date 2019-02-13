/**
 * @owner: Process UI Design Time team.
 * @design-doc: https://salesforce.quip.com/Ax4HAoPvhmAb
*/
// Internal State Holder variables for past, present and future state of the app
let past =  [];
let present;
let future = [];

/**
 * Undo Function
 *  - Adds the present state object to the future state array.
 *  - Slices the last element of the past array and sets it to present.
 * @param {Object[]} pastStates - Array of past state objects
 * @param {Object} presentState - Present state object
 * @param {Object[]} futureStates - Array of future state objects
 * @returns {Object} Object containing past present and future.
 */
const undo = (pastStates, presentState, futureStates) => {
    if (pastStates && pastStates.length < 1) {
        throw new Error("Undo: Past State Array Length cannot be less than 1");
    }
    const previous = pastStates[pastStates.length - 1];
    const updatedPast = pastStates.slice(0, pastStates.length - 1);
    return {
        future: [presentState, ...futureStates],
        past: updatedPast,
        present: previous
    };
};

/**
 * Redo Function
 *  - Adds the present state object to the last of past state array
 *  - Slices the first element from the future array and sets it to present.
 * @param {Object[]} pastStates - Array of past state objects
 * @param {Object} presentState - Present state object
 * @param {Object[]} futureStates - Array of future state objects
 * @returns {Object} Object containing past present and future.
 */
const redo = (pastStates, presentState, futureStates) => {
    if (futureStates && futureStates.length < 1) {
        throw new Error("Redo: Future State Array length cannot be less than 1");
    }
    const next = futureStates[0];
    const updatedFuture = futureStates.slice(1);
    return {
        past: [...pastStates, presentState],
        present: next,
        future: updatedFuture
    };
};

export const UNDO = 'UNDO';
export const REDO = 'REDO';
export const INIT = 'INIT';

/**
 * @returns {Boolean} True if past array contains any state objects, false otherwise
 */
export const isUndoAvailable = () => {
    return past.length > 0 ? true : false;
};

/**
 * @returns {Boolean} True if future array contains any state objects, false otherwise
 */
export const isRedoAvailable = () => {
    return future.length > 0 ? true : false;
};

/**
 * Higher order function to be used on top of reducer function in the app.
 * @param {*} reducer - reducer function for the app. Combined Reducer in case of flow builder
 * @param {Object} config - Config object containing blacklistedActions array
 * @returns {Object} Reduced state object
 */
export const undoRedo = (reducer, {blacklistedActions = []}) => (state = {}, action) => {
    switch (action.type) {
        case UNDO: {
            ({past, present, future} = undo(past, present, future));
            break;
        }
        case REDO : {
            ({past, present, future} = redo(past, present, future));
            break;
        }
        default: {
            const newState = reducer(state, action);
            if (blacklistedActions.includes(action.type)) {
                return newState;
            }
            // Do not ever put undefined in the past state. This would result in undo state corruption.
            if (present) {
                past = [...past, present];
            }
            present = newState;
            future = [];
        }
    }
    return present;
};