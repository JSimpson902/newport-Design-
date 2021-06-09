// @ts-nocheck
/**
 * Add an item to an array and return a new array. It is shallow copy of the array.
 *
 * @param {Array} arr array to be modified
 * @param {Object} newItem item to be added in the array
 * @returns {Array} new array with updated item
 */
export function addItem(arr, newItem) {
    if (newItem === undefined || newItem === null) {
        throw new Error('item is undefined');
    }
    return [...arr, newItem];
}

/**
 * Creates a shallow copy of the given array. If the param
 * is not an array it returns an array with the param as the only value
 *
 * @param {Array} arr   the item we want to create a shallow copy of
 * @returns {Array} the shallow copy array
 */
export function shallowCopyArray(arr) {
    return [...arr];
}

/**
 * insert an item at the specific location in an array and return a new array. It is shallow copy of the array.
 *
 * @param {Array} arr array to be modified
 * @param {*} newItem item to be added in the array
 * @param {number} itemAt where new item needs to be inserted
 * @returns {Array} new array with inserted item
 */
export function insertItem(arr, newItem, itemAt) {
    if (arr === undefined || newItem === undefined || itemAt === undefined || itemAt < 0 || itemAt > arr.length) {
        throw new Error(`could not insert ${newItem} at position ${itemAt}, something went wrong`);
    }
    return [...arr.slice(0, itemAt), newItem, ...arr.slice(itemAt)];
}

/**
 * Replace an item at the sepecific location in an array and return
 *
 * @param {Array} arr array to be modified
 * @param {*} newItem item to be set in the array
 * @param {number} itemAt where the item needs to be replaced
 * @returns {Array} new array with updated item
 */
export function replaceItem(arr, newItem, itemAt) {
    if (arr === undefined || newItem === undefined || itemAt === undefined || itemAt < 0 || itemAt > arr.length) {
        throw new Error(`could not replace position ${itemAt} with ${newItem}, something went wrong`);
    }
    const end = parseInt(itemAt, 10) + 1;
    return [...arr.slice(0, itemAt), newItem, ...arr.slice(end)];
}

/**
 * Delete an item at the specified location and return a new array. It is shallow copy of a new array.
 *
 * @param {Array} arr array to be modified
 * @param {number} itemAt of item to be deleted
 * @returns {Array} new updated array
 */
export function deleteItem(arr, itemAt) {
    if (arr === undefined || itemAt === undefined || itemAt < 0 || itemAt > arr.length) {
        throw new Error(`could not delete at position ${itemAt}, something went wrong`);
    }
    return [...arr.slice(0, itemAt), ...arr.slice(itemAt + 1)];
}

/**
 * Returns an array with union (unique set) of all elements from multiple arrays supplied
 *
 * @param {...Object[]} arrays list of arrays
 * @returns {Object[]} list of unique set of elements from all the arrays
 */
export function unionOfArrays<T>(...arrays: T[][]) {
    const setFromArrays = arrays.reduce<Set<T>>((acc, arr) => {
        for (let i = 0, len = arr.length; i < len; i++) {
            acc.add(arr[i]);
        }
        return acc;
    }, new Set());
    return [...setFromArrays];
}
