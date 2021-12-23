import { createElement } from 'lwc';
import { setDocumentBodyChildren } from './domTestUtils';

const DEFAULT_MAX_TICKS = 10;

/**
 * Returns a promise that is fulfilled when condition is truthy and rejected if we exceed given max number of event loop ticks
 *
 * @param {Function} condition should return truthy value when condition is met
 * @param {number} maxTicks max number of event loop ticks before the condition becomes truthy
 * @returns {Promise} if fulfilled, value is the condition returned value
 */
export const until = (condition, maxTicks = DEFAULT_MAX_TICKS) => {
    return Promise.resolve().then(() => {
        try {
            const result = condition();
            if (result) {
                return Promise.resolve(result);
            }
            if (maxTicks === 0) {
                return Promise.reject(Error('Condition not met'));
            }
        } catch (error) {
            if (maxTicks === 0) {
                return Promise.reject(error);
            }
        }
        return until(condition, maxTicks - 1);
    });
};

/**
 * Returns a promise that is fulfilled when expectations are met
 *
 * @param {Function} expectations should throw an exception if an expectation is not met
 * @param {number} maxTicks max number of event loop ticks before the condition becomes truthy
 * @returns {Promise} fulfilled when expectations are met
 */
export const untilNoFailure = (expectations, maxTicks = DEFAULT_MAX_TICKS) => {
    return until(() => {
        expectations();
        return true;
    }, maxTicks);
};

/**
 * Returns a promise that is fulfilled after the given number of event loop ticks
 *
 * @param {number} maxTicks number of event loop ticks before the promise is fulfilled
 * @returns {Promise} fulfilled after the given number of event loop ticks
 */
export const ticks = (maxTicks = DEFAULT_MAX_TICKS) => {
    return until(() => false, maxTicks).catch(() => {});
};

/**
 * Create a new promise with status properties.
 *
 * @param promise
 */
export const makeQuerablePromise = (promise) => {
    // Don't modify any promise that has been already modified.
    if (promise.isResolved) {
        return promise;
    }

    let isPending = true;
    let isRejected = false;
    let isFulfilled = false;

    const result = promise.then(
        (value) => {
            isFulfilled = true;
            isPending = false;
            return value;
        },
        (e) => {
            isRejected = true;
            isPending = false;
            throw e;
        }
    );

    result.isFulfilled = () => isFulfilled;
    result.isPending = () => isPending;
    result.isRejected = () => isRejected;
    return result;
};

/**
 * Formats a string to camelcase
 *
 * @param s - the string to format
 * @returns the formatted string
 */
function camelCase(s) {
    return s.replace(/-[a-zA-Z]/gi, (match) => {
        return match.charAt(1).toUpperCase();
    });
}

/**
 * Creates a component for for use in jest tests
 *
 * @param tagName - The component name
 * @param options - The component properties
 * @param optionsOverride - The overridden component properties
 * @returns the html element for the component
 */
export const createComponent = async (tagName, options = {}, optionsOverride = {}) => {
    options = { ...options, ...optionsOverride };

    const namespace = tagName.substring(0, tagName.indexOf('-'));
    const moduleName = camelCase(tagName.replace(`${namespace}-`, ''));

    const el = createElement(tagName, {
        is: require(`${namespace}/${moduleName}`).default
    });

    if (options) {
        Object.assign(el, options);
    }

    setDocumentBodyChildren(el);
    await ticks(1);
    return el;
};
