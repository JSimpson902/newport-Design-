// @ts-nocheck
import { isObject, isUndefinedOrNull } from 'builder_platform_interaction/commonUtils';
import { getIsoTime } from 'builder_platform_interaction/dateTimeUtils';
import {
    CONDITION_LOGIC,
    CONNECTOR_TYPE,
    ELEMENT_TYPE,
    FLOW_PROCESS_TYPE,
    WAIT_EVENT_FIELDS,
    WAIT_TIME_EVENT_FIELDS,
    WAIT_TIME_EVENT_OFFSET_UNIT,
    WAIT_TIME_EVENT_TYPE
} from 'builder_platform_interaction/flowMetadata';
import { generateGuid } from 'builder_platform_interaction/storeLib';
import { getElementByGuid, getProcessType } from 'builder_platform_interaction/storeUtils';
import {
    baseCanvasElementsArrayToMap,
    baseCanvasElementWithFault,
    baseChildElement,
    createCondition,
    duplicateCanvasElementWithChildElements,
    getDeletedCanvasElementChildren,
    updateChildReferences
} from './base/baseElement';
import {
    baseCanvasElementMetadataObject,
    baseChildElementMetadataObject,
    createConditionMetadataObject
} from './base/baseMetadata';
import {
    addRegularConnectorToAvailableConnections,
    getConnectionProperties
} from './commonFactoryUtils/connectionPropertiesUtils';
import { createConnectorObjects } from './connector';
import { LABELS } from './elementFactoryLabels';
import { createInputParameter, createInputParameterMetadataObject } from './inputParameter';
import { createOutputParameter, createOutputParameterMetadataObject } from './outputParameter';

const elementType = ELEMENT_TYPE.WAIT;
const MAX_CONNECTIONS_DEFAULT = 2;
export const DEFAULT_DURATION_VALUE = 1;
export const DEFAULT_DURATION_UNIT = WAIT_TIME_EVENT_OFFSET_UNIT.DAYS;

/**
 * Whether the event type is one of the wait time event types (AlarmEvent or DateRefAlarmEvent)
 *
 * @param {string} eventTypeName event type name
 * @returns {boolean} true if event type is a wait time event type, false otherwise
 */
export const isWaitTimeEventType = (eventTypeName) => {
    return Object.values(WAIT_TIME_EVENT_TYPE).includes(eventTypeName);
};

/**
 * Returns the event parameter type field name. 'inputParameters' or 'outputParameters'
 *
 * @param {boolean} isInputParameter whether input or output param, true for input.
 */
export const getParametersPropertyName = (isInputParameter) => {
    return isInputParameter ? WAIT_EVENT_FIELDS.INPUT_PARAMETERS : WAIT_EVENT_FIELDS.OUTPUT_PARAMETERS;
};

/**
 * Turns an object of parameters into an array of metadata output parameters
 *
 * @param {Object} parameters object of parameters
 * @returns {Object[]} list of metadata parameters
 */
const outputParameterMapToArray = (parameters) => {
    // filter parameter with empty values
    const filterEmptyValueParams = (paramName) => {
        const parameter = parameters[paramName];
        if (parameter) {
            const value = parameter.value;
            return !isUndefinedOrNull(value) && value !== '';
        }
        return false;
    };
    const mapToArray = (paramName) => {
        return createOutputParameterMetadataObject(parameters[paramName]);
    };
    return Object.keys(parameters).filter(filterEmptyValueParams).map(mapToArray);
};

/**
 * For a given eventType return the additional parameters which are not in the existing parameters.
 *
 * @param {string} eventType The event type
 * @param {Array} parameters The parameters array
 * @param {boolean} isInput whether the parameters are input or output. true for input, false otherwise.
 */
const getAdditionalParameters = (eventType, parameters, isInput = false) => {
    const existingParameterNames = parameters.reduce((acc, param) => {
        acc[param.name] = param.name;
        return acc;
    }, {});
    const paramType = getParametersPropertyName(isInput);

    // for wait time event type filter and return the additional params for both input and output params
    if (isWaitTimeEventType(eventType)) {
        return WAIT_TIME_EVENT_FIELDS[eventType][paramType]
            .filter((paramName) => !existingParameterNames[paramName])
            .map((paramName) => {
                return { name: paramName };
            });
        // for platform event additional params needed only for output parameters, since input parameters is a condition list
        // the eventType is the output parameter namefor platform event type
    } else if (paramType === WAIT_EVENT_FIELDS.OUTPUT_PARAMETERS && !existingParameterNames[eventType]) {
        return [{ name: eventType }];
    }
    return [];
};

/**
 * Creates all the input parameters for the event type. This includes the ones not in the metadata.
 * The additional ones are added with empty values.
 *
 * @param {string} eventType The event type.
 * @param {Array} inputParameters input parameters array
 */
export const createWaitEventInputParameters = (eventType, inputParameters = []) => {
    const additionalInputParameters = getAdditionalParameters(eventType, inputParameters, true);
    return [...inputParameters, ...additionalInputParameters].map((inputParameter) => {
        return createInputParameter(inputParameter);
    });
};

/**
 * Creates all the output parameters for the event type. This includes the ones not in the metadata.
 * The additional ones are added with empty values.
 *
 * @param {string} eventType The event type.
 * @param {Array} outputParameters output parameters array
 */
export const createWaitEventOutputParameters = (eventType, outputParameters = []) => {
    // if output parameters is empty object convert it to empty array
    // so that additional empty parameters can be added to it
    if (isObject(outputParameters) && Object.keys(outputParameters).length === 0) {
        outputParameters = [];
    }

    const arrayToMap = (acc, param) => {
        acc[param.name] = createOutputParameter(param);
        return acc;
    };

    if (Array.isArray(outputParameters)) {
        const additionalOutputParameters = getAdditionalParameters(eventType, outputParameters);
        return [...outputParameters, ...additionalOutputParameters].reduce(arrayToMap, {});
    }

    // store already has output parameters as object map, return a copy
    // TODO: convert output parameters to Map. W-5568291
    const outputParametersCopy = Object.values(outputParameters).reduce(arrayToMap, {});
    return outputParametersCopy;
};

/**
 * @typedef waitEvent
 * @property {module:flowMetadata.CONDITION_LOGIC} conditionLogic - Condition logic for the wait event
 * @property {module:flowMetadata.ELEMENT_TYPE.WAIT_EVENT} elementType - ELEMENT_TYPE.WAIT_EVENT
 * @property {module:baseList.ListRowItem[]} conditions - array of conditions
 */

/**
 * @typedef childReference
 * @property {string} childReference - guid of the wait event
 */

/**
 * @typedef waitInStore - A wait object in the shape stored by the store, containing childReferences
 * @property {childReference[]} childReferences - array of references
 */

/**
 * @typedef waitInPropertyEditor - A wait object in the shape used by the property editor, containing waitEvents
 * @property {waitEvent[]} waitEvent - array of waitEvents
 * @property {int} maxConnections = max number of connections,
 * @property {connection[]} availableConnections - connections available for the wait,
 * @property {module:flowMetadata.ELEMENT_TYPE.WAIT} elementType - WAIT
 */

/**
 * Called when opening a property editor or copying a wait element
 *
 * @param {waitInStore} wait
 * @returns {waitInPropertyEditor} Wait in the shape expected by a property editor
 */
export function createWaitWithWaitEvents(wait = {}) {
    const newWait = baseCanvasElementWithFault(wait);
    let { waitEvents } = wait;
    const { defaultConnectorLabel = LABELS.emptyDefaultWaitPathLabel, childReferences, timeZoneId } = wait;

    if (childReferences && childReferences.length > 0) {
        // Decouple waitEvent from store.
        waitEvents = childReferences.map((childReference) =>
            createWaitEvent(getElementByGuid(childReference.childReference))
        );
    } else {
        const newWaitEvent = createWaitEvent();
        waitEvents = [newWaitEvent];
    }

    const maxConnections = calculateMaxWaitConnections(wait);
    return Object.assign(newWait, {
        waitEvents,
        defaultConnectorLabel,
        maxConnections,
        elementType,
        timeZoneId
    });
}

/**
 * Function to create the duplicate Wait element
 *
 * @param {Object} wait - Wait element being copied
 * @param {string} newGuid - Guid for the new duplicated wait element
 * @param {string} newName - Name for the new duplicated wait element
 * @param {Object} childElementGuidMap - Map of child element guids to newly generated guids that will be used for
 * the duplicated child elements
 * @param {Object} childElementNameAndLabelMap - Map of child element names to newly generated unique names that will be used for
 * the duplicated child elements
 * @param {Object} cutOrCopiedChildElements - Local copy of the cut ot copied canvas elements. Undefined in the case of duplication on Free Form Canvas
 * @returns {Object} Returns an object containing the duplicated element and the duplicated childElements
 */
export function createDuplicateWait(
    wait,
    newGuid,
    newName,
    childElementGuidMap,
    childElementNameAndLabelMap,
    cutOrCopiedChildElements
) {
    const defaultAvailableConnections = [
        {
            type: CONNECTOR_TYPE.DEFAULT
        },
        {
            type: CONNECTOR_TYPE.FAULT
        }
    ];

    const { duplicatedElement, duplicatedChildElements, updatedChildReferences, availableConnections } =
        duplicateCanvasElementWithChildElements(
            wait,
            newGuid,
            newName,
            childElementGuidMap,
            childElementNameAndLabelMap,
            cutOrCopiedChildElements,
            createWaitEvent,
            defaultAvailableConnections
        );

    const updatedDuplicatedElement = Object.assign(duplicatedElement, {
        childReferences: updatedChildReferences,
        availableConnections,
        defaultConnectorLabel: wait.defaultConnectorLabel || LABELS.emptyDefaultWaitPathLabel
    });
    return {
        duplicatedElement: updatedDuplicatedElement,
        duplicatedChildElements
    };
}

/**
 * Creates a waitEvent with defaults if needed
 *
 * @param {waitEvent} waitEvent - waitEvent
 * @returns {waitEvent}
 */
export function createWaitEvent(waitEvent = {}) {
    const newWaitEvent = baseChildElement(waitEvent, ELEMENT_TYPE.WAIT_EVENT);
    const {
        eventType = WAIT_TIME_EVENT_TYPE.ABSOLUTE_TIME,
        eventTypeIndex = generateGuid(),
        duration,
        durationUnit,
        resumeDate,
        resumeTime
    } = waitEvent;
    let {
        conditions = [],
        conditionLogic = CONDITION_LOGIC.NO_CONDITIONS,
        inputParameters = [],
        outputParameters = {}
    } = waitEvent;

    const isoResumeTime = getIsoTime(resumeTime);

    if (conditions.length > 0 && conditionLogic !== CONDITION_LOGIC.NO_CONDITIONS) {
        conditions = conditions.map((condition) => createCondition(condition));
    } else {
        // wait events from metadata have NO CONDITIONS as condition logic even when they have no conditions
        conditionLogic = CONDITION_LOGIC.NO_CONDITIONS;
    }

    inputParameters = createWaitEventInputParameters(eventType, inputParameters);
    outputParameters = createWaitEventOutputParameters(eventType, outputParameters);

    addJourneyWaitEventsParams(waitEvent, newWaitEvent);
    return Object.assign(newWaitEvent, {
        conditions,
        conditionLogic,
        eventType,
        eventTypeIndex,
        inputParameters,
        outputParameters,
        duration,
        durationUnit,
        resumeDate,
        resumeTime: isoResumeTime
    });
}

/**
 * Create a wait in the shape needed by the flow metadata
 *
 * @param {waitInStore} wait - wait from the store
 * @param {Object} config - configuration for converting wait
 * @returns {Object} wait in the shape for the metadata
 */
export function createWaitMetadataObject(wait, config = {}) {
    if (!wait) {
        throw new Error('Wait is not defined');
    }
    const newWait = baseCanvasElementMetadataObject(wait, config);
    const { childReferences, defaultConnectorLabel = LABELS.emptyDefaultWaitPathLabel, timeZoneId } = wait;
    let waitEvents;
    if (childReferences && childReferences.length > 0) {
        waitEvents = childReferences.map(({ childReference }) => {
            const waitEvent = getElementByGuid(childReference);
            const metadataWaitEvent = baseChildElementMetadataObject(waitEvent, config);
            const { eventType } = waitEvent;
            let { inputParameters = [], outputParameters, conditions = [], conditionLogic } = waitEvent;

            if (conditions.length === 0 || conditionLogic === CONDITION_LOGIC.NO_CONDITIONS) {
                conditions = [];
                conditionLogic = CONDITION_LOGIC.AND;
            } else {
                conditions = conditions.map((condition) => createConditionMetadataObject(condition));
            }

            inputParameters = inputParameters.map((inputParameter) => {
                return createInputParameterMetadataObject(inputParameter);
            });

            if (isObject(outputParameters)) {
                outputParameters = outputParameterMapToArray(outputParameters);
            }

            addJourneyWaitEventsParams(waitEvent, metadataWaitEvent);

            return Object.assign({}, metadataWaitEvent, {
                conditions,
                conditionLogic,
                eventType,
                inputParameters,
                outputParameters
            });
        });
    }
    return Object.assign(newWait, {
        waitEvents,
        defaultConnectorLabel,
        timeZoneId
    });
}

/**
 * @param elementSource
 * @param elementTarget
 */
function addJourneyWaitEventsParams(elementSource, elementTarget) {
    const processType = getProcessType();
    const { duration, durationUnit, resumeDate, resumeTime } = elementSource;
    if (processType === FLOW_PROCESS_TYPE.JOURNEY) {
        Object.assign(elementTarget, {
            duration,
            durationUnit,
            resumeDate,
            resumeTime
        });
    }
}

/**
 * Given a wait element in a property editor, create a wait element in the shape expected by the store
 *
 * @param {wait} wait - wait in the shape of the property editor
 * @returns
 *   {
 *     wait: wait,
 *     deletedWaitEvents: waitEvent[] , waitEvents: Array, elementType: string}
 *   }
 */
// TODO: this code is almost identical to the code in decision.ts, need to refactor
export function createWaitWithWaitEventReferencesWhenUpdatingFromPropertyEditor(wait) {
    const newWait = baseCanvasElementWithFault(wait);
    const { defaultConnectorLabel = LABELS.emptyDefaultWaitPathLabel, waitEvents, timeZoneId } = wait;
    let childReferences = [];
    let newWaitEvents = [];

    for (let i = 0; i < waitEvents.length; i++) {
        const waitEvent = waitEvents[i];
        const newWaitEvent = createWaitEvent(waitEvent);
        childReferences = updateChildReferences(childReferences, newWaitEvent);
        newWaitEvents = [...newWaitEvents, newWaitEvent];
    }

    let maxConnections = MAX_CONNECTIONS_DEFAULT;

    const deletedCanvasElementChildren = getDeletedCanvasElementChildren(wait, newWaitEvents);
    const deletedWaitEventGuids = deletedCanvasElementChildren.map((waitEvent) => waitEvent.guid);

    let originalWait = getElementByGuid(wait.guid);

    if (!originalWait && wait.supportsBranching !== false) {
        maxConnections = calculateMaxWaitConnections(wait);
        originalWait = {
            availableConnections: [
                {
                    type: CONNECTOR_TYPE.DEFAULT
                },
                {
                    type: CONNECTOR_TYPE.FAULT
                }
            ],
            childReferences: []
        };
    }

    const connectionProperties = getConnectionProperties(originalWait, childReferences, deletedWaitEventGuids);
    let { connectorCount } = connectionProperties;
    const { availableConnections, addFaultConnectionForWaitElement } = connectionProperties;

    // If addFaultConnectionForWaitElement is false, it means that the Fault Connector has already been established and
    // the connector count needs to be incremented
    if (addFaultConnectionForWaitElement && wait.supportsBranching !== false) {
        availableConnections.push({ type: CONNECTOR_TYPE.FAULT });
    } else {
        connectorCount += 1;
    }

    Object.assign(newWait, {
        childReferences,
        elementType,
        defaultConnectorLabel,
        maxConnections,
        connectorCount,
        availableConnections,
        timeZoneId
    });

    return {
        canvasElement: newWait,
        deletedChildElementGuids: deletedWaitEventGuids,
        childElements: newWaitEvents,
        elementType: ELEMENT_TYPE.WAIT_WITH_MODIFIED_AND_DELETED_WAIT_EVENTS
    };
}

/**
 * Create a wait in the shape of the store (with waitEvent references).  This is used when taking a flow element and
 * converting it for use in the store
 *
 * @param {Object} wait - wait from metadata
 * @returns {waitInStore} wait in the shape used by the store
 */
export function createWaitWithWaitEventReferences(wait = {}) {
    const newWait = baseCanvasElementWithFault(wait);
    let newWaitEvents = [],
        childReferences = [],
        availableConnections = [];
    const { defaultConnectorLabel = LABELS.emptyDefaultWaitPathLabel, timeZoneId, waitEvents = [] } = wait;
    // create connectors for wait, which initially are the default and fault ones.
    let connectors = createConnectorObjects(wait, newWait.guid);
    for (let i = 0; i < waitEvents.length; i++) {
        const waitEvent = createWaitEvent(waitEvents[i]);
        const connectorsFromWaitEvent = createConnectorObjects(waitEvents[i], waitEvent.guid, newWait.guid);
        // add the wait event connector to the list of connectors
        connectors = [...connectors, ...connectorsFromWaitEvent];
        newWaitEvents = [...newWaitEvents, waitEvent];
        // updating childReferences
        childReferences = updateChildReferences(childReferences, waitEvent);
        // updating availableConnections
        availableConnections = addRegularConnectorToAvailableConnections(availableConnections, waitEvents[i]);
    }
    if (wait.supportsBranching !== false) {
        availableConnections = addDefaultConnectorToAvailableConnections(availableConnections, wait);
        availableConnections = addFaultConnectorToAvailableConnections(availableConnections, wait);
    }
    const connectorCount = connectors ? connectors.length : 0;
    const maxConnections = calculateMaxWaitConnections(wait);
    Object.assign(newWait, {
        childReferences,
        defaultConnectorLabel,
        elementType,
        connectorCount,
        maxConnections,
        availableConnections,
        timeZoneId
    });
    return baseCanvasElementsArrayToMap([newWait, ...newWaitEvents], connectors);
}

/**
 * Max connections for a wait is the number of wait events + 1 for the default, + 1 for fault
 *
 * @param wait
 */
function calculateMaxWaitConnections(wait) {
    if (!wait) {
        throw new Error('Max connection cannot be calculated because wait object is not defined');
    }

    // TODO: Change this to get the value from connectorUtils when the connector utils are refactored:
    // W-5478126 https://gus.lightning.force.com/lightning/r/ADM_Work__c/a07B0000005ajm1IAA/view
    // Regular connectors for each event + default + fault
    let length = MAX_CONNECTIONS_DEFAULT;
    if (wait.waitEvents && wait.supportsBranching !== false) {
        length = wait.waitEvents.length + MAX_CONNECTIONS_DEFAULT;
    }
    return length;
}

/**
 * @param availableConnections
 * @param wait
 */
function addDefaultConnectorToAvailableConnections(availableConnections = [], wait) {
    if (!availableConnections || !wait) {
        throw new Error('Either availableConnections or wait is not defined');
    }
    const { defaultConnector } = wait;
    if (!defaultConnector) {
        return [
            ...availableConnections,
            {
                type: CONNECTOR_TYPE.DEFAULT
            }
        ];
    }
    return availableConnections;
}

/**
 * @param availableConnections
 * @param wait
 */
function addFaultConnectorToAvailableConnections(availableConnections = [], wait) {
    if (!availableConnections || !wait) {
        throw new Error('Either availableConnections or wait is not defined');
    }
    const { faultConnector } = wait;
    if (!faultConnector) {
        return [
            ...availableConnections,
            {
                type: CONNECTOR_TYPE.FAULT
            }
        ];
    }
    return availableConnections;
}
