// @ts-nocheck
import { readonly } from 'lwc';

export const SERVER_ACTION_TYPE = {
    GET_FLOW: 'getFlow',
    SAVE_FLOW: 'saveFlow',
    GET_RULES: 'getRules',
    GET_SUPPORTED_ELEMENTS: 'getElements',
    GET_SUPPORTED_SCREEN_FIELD_TYPES: 'getScreenFieldTypes',
    GET_INVOCABLE_ACTIONS: 'getInvocableActions',
    GET_APEX_PLUGINS: 'getApexPlugins',
    GET_SUBFLOWS: 'getSubflows',
    GET_INVOCABLE_ACTION_PARAMETERS: 'getInvocableActionParameters',
    GET_APEX_PLUGIN_PARAMETERS: 'getApexPluginParameters',
    GET_ENTITIES: 'getEntities',
    GET_ENTITY: 'getEntity',
    GET_ENTITY_FIELDS: 'getEntityFields',
    GET_ALL_GLOBAL_VARIABLES: 'getAllGlobalVariables',
    GET_SYSTEM_VARIABLES: 'getSystemVariables',
    GET_PROCESS_TYPES: 'getProcessTypes',
    GET_RUN_IN_MODES: 'getRunInModes',
    GET_HEADER_URLS: 'getHeaderUrls',
    GET_RESOURCE_TYPES: 'getResourceTypes',
    GET_FLOW_EXTENSIONS: 'getFlowExtensions',
    GET_FLOW_EXTENSION_PARAMS: 'getFlowExtensionParams',
    GET_FLOW_EXTENSION_LIST_PARAMS: 'getFlowExtensionListParams',
    SET_USER_PREFERENCES: 'setUserPreferences',
    GET_CONTEXT: 'getContext',
    GET_OPERATORS: 'getOperators',
    GET_FLOW_INPUT_OUTPUT_VARIABLES: 'getFlowInputOutputVariables',
    GET_FLOW_ACTIVE_OR_LATEST_RUN_IN_MODE: 'getFlowActiveOrLatestRunInMode',
    GET_EVENT_TYPES: 'getEventTypes',
    GET_EVENT_TYPE: 'getEventType',
    GET_EVENT_TYPE_PARAMETERS: 'getParametersForEventType',
    GET_PERIPHERAL_DATA_FOR_PROPERTY_EDITOR: 'getPeripheralDataForPropertyEditor',
    GET_APEX_TYPES: 'getApexTypes',
    GET_TEMPLATES: 'getTemplates',
    GET_TEMPLATE_DATA: 'getTemplateData',
    GET_PROCESS_TYPE_FEATURES: 'getSupportedFeaturesList',
    TOGGLE_FLOW_STATUS: 'toggleFlowStatus',
    GET_INVOCABLE_ACTION_DETAILS: 'getInvocableActionDetails',
    GET_WORKFLOW_ENABLED_ENTITIES: 'getWorkflowEnabledEntities',
    GET_FLOW_EXTENSION_DETAILS: 'getFlowExtensionDetails',
    GET_FLOW_ENTRIES: 'getFlowEntries',
    GET_TRIGGER_TYPE_INFO: 'getTriggerTypeInfo',
    GET_PALETTE: 'getPalette',
    GET_VERSIONING_INFO: 'getVersioningInfo',
    RUN_DEBUG: 'runDebug',
    RETRIEVE_INTERVIEW_HISTORY: 'retrieveInterviewHistory',
    GET_AUTOMATIC_FIELD_OBJECT_MANAGER_URLS: 'getObjectManagerUrls',
    RESUME_DEBUG_INTERVIEW: 'resumeDebugInterview'
};

const actionConfig = {
    [SERVER_ACTION_TYPE.GET_FLOW]: 'c.retrieveFlow',
    [SERVER_ACTION_TYPE.SAVE_FLOW]: 'c.saveFlow',
    [SERVER_ACTION_TYPE.GET_RULES]: 'c.retrieveAllRules',
    [SERVER_ACTION_TYPE.GET_SUPPORTED_ELEMENTS]: 'c.getSupportedElements',
    [SERVER_ACTION_TYPE.GET_SUPPORTED_SCREEN_FIELD_TYPES]: 'c.getSupportedScreenFields',
    [SERVER_ACTION_TYPE.GET_INVOCABLE_ACTIONS]: 'c.getAllInvocableActionsForType',
    [SERVER_ACTION_TYPE.GET_APEX_PLUGINS]: 'c.getApexPlugins',
    [SERVER_ACTION_TYPE.GET_SUBFLOWS]: 'c.getSubflows',
    [SERVER_ACTION_TYPE.GET_INVOCABLE_ACTION_PARAMETERS]: 'c.getInvocableActionParameters',
    [SERVER_ACTION_TYPE.GET_APEX_PLUGIN_PARAMETERS]: 'c.getApexPluginParameters',
    [SERVER_ACTION_TYPE.GET_ENTITIES]: 'c.getEntities',
    [SERVER_ACTION_TYPE.GET_ENTITY]: 'c.getEntity',
    [SERVER_ACTION_TYPE.GET_ENTITY_FIELDS]: 'c.getFieldsForEntity',
    [SERVER_ACTION_TYPE.GET_ALL_GLOBAL_VARIABLES]: 'c.getAllGlobalVariables',
    [SERVER_ACTION_TYPE.GET_SYSTEM_VARIABLES]: 'c.getSystemVariables',
    [SERVER_ACTION_TYPE.GET_PROCESS_TYPES]: 'c.getProcessTypes',
    [SERVER_ACTION_TYPE.GET_RUN_IN_MODES]: 'c.getRunInModes',
    [SERVER_ACTION_TYPE.GET_HEADER_URLS]: 'c.retrieveHeaderUrls',
    [SERVER_ACTION_TYPE.GET_RESOURCE_TYPES]: 'c.getResourceTypes',
    [SERVER_ACTION_TYPE.GET_FLOW_EXTENSIONS]: 'c.getFlowExtensions',
    [SERVER_ACTION_TYPE.GET_FLOW_EXTENSION_PARAMS]: 'c.getFlowExtensionParams',
    [SERVER_ACTION_TYPE.GET_FLOW_EXTENSION_LIST_PARAMS]: 'c.getFlowExtensionListParams',
    [SERVER_ACTION_TYPE.SET_USER_PREFERENCES]: 'c.setUserPreferences',
    [SERVER_ACTION_TYPE.GET_CONTEXT]: 'c.getContext',
    [SERVER_ACTION_TYPE.GET_OPERATORS]: 'c.getOperators',
    [SERVER_ACTION_TYPE.GET_FLOW_INPUT_OUTPUT_VARIABLES]: 'c.getFlowInputOutputVariables',
    [SERVER_ACTION_TYPE.GET_FLOW_ACTIVE_OR_LATEST_RUN_IN_MODE]: 'c.getFlowActiveOrLatestRunInMode',
    [SERVER_ACTION_TYPE.GET_EVENT_TYPES]: 'c.getEventTypes',
    [SERVER_ACTION_TYPE.GET_EVENT_TYPE]: 'c.getEventType',
    [SERVER_ACTION_TYPE.GET_EVENT_TYPE_PARAMETERS]: 'c.getParametersForEventType',
    [SERVER_ACTION_TYPE.GET_APEX_TYPES]: 'c.getApexTypes',
    [SERVER_ACTION_TYPE.GET_TEMPLATES]: 'c.getTemplates',
    [SERVER_ACTION_TYPE.GET_TEMPLATE_DATA]: 'c.getTemplateData',
    [SERVER_ACTION_TYPE.GET_PROCESS_TYPE_FEATURES]: 'c.getSupportedFeaturesList',
    [SERVER_ACTION_TYPE.TOGGLE_FLOW_STATUS]: 'c.toggleFlowStatus',
    [SERVER_ACTION_TYPE.GET_INVOCABLE_ACTION_DETAILS]: 'c.getInvocableActionDetails',
    [SERVER_ACTION_TYPE.GET_WORKFLOW_ENABLED_ENTITIES]: 'c.getWorkflowEnabledEntities',
    [SERVER_ACTION_TYPE.GET_FLOW_EXTENSION_DETAILS]: 'c.getFlowExtensionDetails',
    [SERVER_ACTION_TYPE.GET_FLOW_ENTRIES]: 'c.getFlowEntries',
    [SERVER_ACTION_TYPE.GET_TRIGGER_TYPE_INFO]: 'c.getTriggerTypeInfo',
    [SERVER_ACTION_TYPE.GET_PALETTE]: 'c.getPalette',
    [SERVER_ACTION_TYPE.GET_VERSIONING_INFO]: 'c.getVersioningInfo',
    [SERVER_ACTION_TYPE.RUN_DEBUG]: 'c.runDebugInterview',
    [SERVER_ACTION_TYPE.RETRIEVE_INTERVIEW_HISTORY]: 'c.retrieveInterviewHistory',
    [SERVER_ACTION_TYPE.GET_AUTOMATIC_FIELD_OBJECT_MANAGER_URLS]: 'c.getObjectManagerUrls',
    [SERVER_ACTION_TYPE.RESUME_DEBUG_INTERVIEW]: 'c.resumeDebugInterview'
};

let auraFetch;
let auraCallback;

/**
 * Set the generic function to get server data
 * @param {Function} fn aura fetch function
 */
export function setAuraFetch(fn?) {
    auraFetch = fn;
}

export function setAuraGetCallback(value) {
    auraCallback = value;
}

/**
 * Provides the aura wrapper function, which ensures that a function supplied to the wrapper
 * is executed under aura context. This is used for making sure the aura can bundle
 * together multiple foreground calls.
 */
export function getAuraCallback(fn) {
    return auraCallback(fn);
}

/**
 * Makes the call to get server data and executes callback if component is still connected.
 * @param {String} serverActionType type of action to be executed
 * @param {Function} callback function to be executed after getting response from server
 * @param {Object} params any parameters to make server call
 * @param {Object} storable set to true if results need to be cached, Background set to true if request needs to be run as background action
 * @return {Function} setComponentDisconnected this should be called in disconnected callback of a component
 */
export function fetch(
    serverActionType,
    callback,
    params,
    { background = false, storable = false, disableErrorModal = false, messageForErrorModal } = {}
) {
    let executeCallback = true;

    function shouldExecuteCallback() {
        return executeCallback;
    }

    function stopCallbackExecution() {
        executeCallback = false;
    }

    if (actionConfig[serverActionType] && auraFetch) {
        auraFetch(
            actionConfig[serverActionType],
            shouldExecuteCallback,
            callback,
            params,
            background,
            storable,
            disableErrorModal,
            messageForErrorModal
        );
    }
    return stopCallbackExecution;
}

const KEY_PROVIDER = {
    [SERVER_ACTION_TYPE.GET_APEX_PLUGINS]: () => 'default',
    [SERVER_ACTION_TYPE.GET_RULES]: () => SERVER_ACTION_TYPE.GET_RULES,
    [SERVER_ACTION_TYPE.GET_OPERATORS]: () => SERVER_ACTION_TYPE.GET_OPERATORS,
    [SERVER_ACTION_TYPE.GET_ENTITIES]: () => SERVER_ACTION_TYPE.GET_ENTITIES,
    [SERVER_ACTION_TYPE.GET_ENTITY]: () => (params) => `${params.entityApiName}`,
    [SERVER_ACTION_TYPE.GET_RESOURCE_TYPES]: () => SERVER_ACTION_TYPE.GET_RESOURCE_TYPES,
    [SERVER_ACTION_TYPE.GET_EVENT_TYPES]: () => (params) => params.eventType,
    [SERVER_ACTION_TYPE.GET_EVENT_TYPE]: (params) => params.eventTypeApiName,
    [SERVER_ACTION_TYPE.GET_ALL_GLOBAL_VARIABLES]: () => SERVER_ACTION_TYPE.GET_ALL_GLOBAL_VARIABLES,
    [SERVER_ACTION_TYPE.GET_SYSTEM_VARIABLES]: () => SERVER_ACTION_TYPE.GET_SYSTEM_VARIABLES,
    [SERVER_ACTION_TYPE.GET_HEADER_URLS]: () => SERVER_ACTION_TYPE.GET_HEADER_URLS,
    [SERVER_ACTION_TYPE.GET_PROCESS_TYPES]: (params) => `${params.builderType}`,
    [SERVER_ACTION_TYPE.GET_RUN_IN_MODES]: () => SERVER_ACTION_TYPE.GET_RUN_IN_MODES,
    [SERVER_ACTION_TYPE.GET_SUBFLOWS]: (params) => params.flowProcessType,
    [SERVER_ACTION_TYPE.GET_INVOCABLE_ACTIONS]: (params) => params.flowProcessType,
    [SERVER_ACTION_TYPE.GET_SUPPORTED_SCREEN_FIELD_TYPES]: (params) => params.flowProcessType,
    [SERVER_ACTION_TYPE.GET_INVOCABLE_ACTION_PARAMETERS]: (params) => `${params.actionName}-${params.actionType}`,
    [SERVER_ACTION_TYPE.GET_APEX_PLUGIN_PARAMETERS]: (params) => `${params.apexClass}`,
    [SERVER_ACTION_TYPE.GET_ENTITY_FIELDS]: (params) => params.entityApiName,
    [SERVER_ACTION_TYPE.GET_FLOW_INPUT_OUTPUT_VARIABLES]: (params) => params.flowName,
    [SERVER_ACTION_TYPE.GET_FLOW_ACTIVE_OR_LATEST_RUN_IN_MODE]: (params) => params.flowName,
    [SERVER_ACTION_TYPE.GET_APEX_TYPES]: (params) => params.flowProcessType,
    [SERVER_ACTION_TYPE.GET_TEMPLATES]: (params) => params.processTypes,
    [SERVER_ACTION_TYPE.GET_TEMPLATE_DATA]: (params) => params.versionIdOrEnum,
    [SERVER_ACTION_TYPE.GET_PROCESS_TYPE_FEATURES]: (params) => params.flowProcessType,
    [SERVER_ACTION_TYPE.GET_INVOCABLE_ACTION_DETAILS]: (params) => `${params.actionName}-${params.actionType}`,
    [SERVER_ACTION_TYPE.GET_WORKFLOW_ENABLED_ENTITIES]: () => SERVER_ACTION_TYPE.GET_WORKFLOW_ENABLED_ENTITIES,
    [SERVER_ACTION_TYPE.GET_FLOW_ENTRIES]: (params) => `${params.builderType}`,
    [SERVER_ACTION_TYPE.GET_TRIGGER_TYPE_INFO]: (params) => `${params.triggerType}`,
    [SERVER_ACTION_TYPE.GET_PALETTE]: (params) => params.flowProcessType,
    [SERVER_ACTION_TYPE.GET_VERSIONING_INFO]: (params) => params.builderType,
    [SERVER_ACTION_TYPE.GET_AUTOMATIC_FIELD_OBJECT_MANAGER_URLS]: () =>
        SERVER_ACTION_TYPE.GET_AUTOMATIC_FIELD_OBJECT_MANAGER_URLS
};

const fetchOnceCache = {};

/**
 * Makes the call to get server data. Ensure call is only made once if successful.
 *
 * @param {String}
 *            serverActionType type of action to be executed
 * @param {Object}
 *            params any parameters to make server call
 * @param {{background: (boolean|undefined), disableErrorModal: (boolean|undefined), messageForErrorModal: (string|undefined)}} optionalParams
 *            background need to be set to true if request needs to be run as a background action
 *            disableErrorModal need to be set to true to disable the default error modal panel
 *            messageForErrorModal the message to use instead of the default error message
 * @return {Promise} Promise object represents the return value from the server
 *         side action
 */
export function fetchOnce(
    serverActionType,
    params = {},
    { background = false, disableErrorModal = false, messageForErrorModal } = {}
) {
    const keyProvider = KEY_PROVIDER[serverActionType];
    if (!keyProvider) {
        throw new Error(`No keyProvider configured for ${serverActionType}`);
    }
    const key = keyProvider(params);
    let serverActionTypeCache = fetchOnceCache[serverActionType];
    if (serverActionTypeCache) {
        // we retry fetching if rejected
        if (serverActionTypeCache[key] && !serverActionTypeCache[key].isRejected()) {
            return serverActionTypeCache[key];
        }
    } else {
        serverActionTypeCache = {};
        fetchOnceCache[serverActionType] = serverActionTypeCache;
    }
    // we can use a promise because we don't use a storable action
    let rejected = false;
    let pending = true;
    serverActionTypeCache[key] = new Promise((resolve, reject) => {
        fetch(
            serverActionType,
            ({ data, error }) => {
                pending = false;
                if (error) {
                    rejected = true;
                    const errorMessage =
                        Array.isArray(error) && error.length === 1 && error[0].message ? error[0].message : error;
                    const newError = new Error(errorMessage);
                    if (typeof error === 'object') {
                        newError.cause = error;
                    }
                    reject(newError);
                } else {
                    resolve(readonly(data));
                }
            },
            params,
            {
                background,
                storable: false,
                disableErrorModal,
                messageForErrorModal
            }
        );
    });
    serverActionTypeCache[key].isRejected = () => !pending && rejected;
    serverActionTypeCache[key].isFulfilled = () => !pending && !rejected;
    serverActionTypeCache[key].isPending = () => pending;
    return serverActionTypeCache[key];
}

export function isAlreadyFetched(serverActionType, params = {}) {
    const keyProvider = KEY_PROVIDER[serverActionType];
    if (!keyProvider) {
        throw new Error(`No keyProvider configured for ${serverActionType}`);
    }
    const key = keyProvider(params);
    const serverActionTypeCache = fetchOnceCache[serverActionType];
    if (!serverActionTypeCache) {
        return false;
    }
    const promise = serverActionTypeCache[key];
    if (!promise) {
        return false;
    }
    return promise.isFulfilled();
}

export function resetFetchOnceCache() {
    for (const prop in fetchOnceCache) {
        if (fetchOnceCache.hasOwnProperty(prop)) {
            delete fetchOnceCache[prop];
        }
    }
}
