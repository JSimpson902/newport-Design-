// @ts-nocheck
import { fetch, SERVER_ACTION_TYPE } from 'builder_platform_interaction/serverDataLib';

export const MANAGED_SETUP = 'ManagedSetup';
export const RUNTIME = 'Runtime';

/**
 * Holds all the event types fetched from the server.
 *
 * @type {Array}
 */
const eventTypes = { RUNTIME: [], MANAGED_SETUP: [] };

const EVENT_FIELD_TYPE = {
    INPUT: 'input',
    OUTPUT: 'output'
};

/**
 * Cache to hold the event type input/output fields to avoid call to the server.
 *
 * @example
 * [
 *     "PlatformEvent1__e" : {
 *          input : [
 *               "CreatedById" : { dataType: "string", isRequired: false, label: "Created By", qualifiedApiName: "CreatedById" },
 *          ],
 *         output : [
 *              "PlatformEvent1__e" : { dataType: "sobject", isRequired: true, label: "PlatformEvent1", qualifiedApiName: "PlatformEvent1__e" }
 *         ]
 *     },
 *     'PlatformEvent2__e' : {
 *         input : [...],
 *         output : [...]
 *     },
 *     ...
 *]
 */
const eventTypeParameters = {};

/**
 * An event type parameter
 *
 * @typedef {Object} eventTypeParameter
 * @property {string} dataType          data type of the parameter. eg: 'reference'
 * @property {boolean} isRequired       whether it is a required or not
 * @property {string} label             parameter label
 * @property {string} qualifiedApiName  parameter api name
 */

/**
 * Callback once the fields for an entity type have been fetched
 *
 * @param {eventTypeParameter[]} eventTypeParametersData The fields and their properties, in stringified format
 * @param {string} eventTypeApiName The api name for the event type
 * @param {string} paramType The type of param. Either input or output
 * @param {Function} callback The callback
 */
const getParametersForEventTypeCallback = (eventTypeParametersData = [], eventTypeApiName, paramType, callback) => {
    // Cache check added here since Aura Action bundles the request and
    // for an given eventType we get all input and output params together.
    if (isEventTypeParamsInCache(eventTypeApiName, paramType)) {
        if (typeof callback === 'function') {
            callback(eventTypeParameters[eventTypeApiName][paramType]);
        }
        return;
    }

    const eventTypeAllParameters = Array.isArray(eventTypeParametersData) ? eventTypeParametersData : [];
    const inputParams = {};
    const outputParams = {};
    const parameters = {};
    eventTypeAllParameters.forEach((eventTypeParameter) => {
        // These additional properties are needed for expression builder
        eventTypeParameter.sobjectName = eventTypeApiName;
        eventTypeParameter.prefixedApiName = eventTypeApiName + '.' + eventTypeParameter.qualifiedApiName;

        if (eventTypeParameter.isSubscription) {
            inputParams[eventTypeParameter.qualifiedApiName] = eventTypeParameter;
        }
        if (eventTypeParameter.isPublication) {
            outputParams[eventTypeParameter.qualifiedApiName] = eventTypeParameter;
        }
    });
    parameters[EVENT_FIELD_TYPE.INPUT] = inputParams;
    parameters[EVENT_FIELD_TYPE.OUTPUT] = outputParams;
    eventTypeParameters[eventTypeApiName] = parameters;

    if (callback) {
        callback(parameters[paramType]);
    }
};

/**
 * Gets the parameters for a specific event type, then calls the callback
 * Only goes to the server if the parameters for that event type are not cached
 *
 * @param {string} eventTypeApiName Event Type Api Name
 * @param {string} paramType Parameter type to fetch. Either input or output.
 * @param {Function} callback function to call once the server call is complete
 */
function getParametersForEventType(eventTypeApiName, paramType, callback) {
    if (isEventTypeParamsInCache(eventTypeApiName, paramType)) {
        if (callback) {
            callback(eventTypeParameters[eventTypeApiName][paramType]);
        }
        return;
    }

    const params = { eventTypeApiName };
    fetch(
        SERVER_ACTION_TYPE.GET_EVENT_TYPE_PARAMETERS,
        ({ data, error }) => {
            if (error) {
                // Error is handled and shown in pop up in serverDataLibInit.cmp
            } else {
                getParametersForEventTypeCallback(data, eventTypeApiName, paramType, callback);
            }
        },
        params
    );
}

/**
 * Check if the event type parameters exists in the cache, if yes call the callback
 * Only goes to the server if the parameters for that event type are not cached
 *
 * @param {string} eventTypeApiName Event Type Api Name
 * @param {string} paramType Parameter type to fetch. Either input or output.
 * @param {Function} callback function to call once the server call is complete
 * @returns {boolean} returns true if event type in cache, false otherwise
 */
function isEventTypeParamsInCache(eventTypeApiName, paramType) {
    const paramsForEventType = eventTypeParameters[eventTypeApiName];
    return paramsForEventType && paramsForEventType[paramType];
}

/**
 * Gets the input parameters for a specific event type, then calls the callback
 * Only goes to the server if the input fields for that event type are not cached
 *
 * @param {string} eventTypeApiName Event Type Api Name
 * @param {Function} callback function to call once the server call is complete
 */
export const getInputParametersForEventType = (eventTypeApiName, callback) => {
    getParametersForEventType(eventTypeApiName, EVENT_FIELD_TYPE.INPUT, callback);
};

/**
 * Gets the output parameters for a specific event type, then calls the callback
 * Only goes to the server if the output fields for that event type are not cached
 *
 * @param {string} eventTypeApiName Event Type Api Name
 * @param {Function} callback function to call once the server call is complete
 */
export const getOutputParametersForEventType = (eventTypeApiName, callback) => {
    getParametersForEventType(eventTypeApiName, EVENT_FIELD_TYPE.OUTPUT, callback);
};

/**
 * Set all the event types. This is called at the very beginning of the flow.
 *
 * @param eventTypesData Array of all event types.
 * @param type
 */
export const setEventTypes = (eventTypesData, type) => {
    if (!Array.isArray(eventTypesData)) {
        throw new Error(`Expected input to be an Array but was ${eventTypesData}`);
    }
    eventTypes[type] = eventTypesData;
};

/**
 * Returns all the event types except the Alarm events.
 *
 * @param type
 * @returns {Array} All Event types except Alarm events.
 */
export const getEventTypes = (type) => {
    return eventTypes[type];
};
