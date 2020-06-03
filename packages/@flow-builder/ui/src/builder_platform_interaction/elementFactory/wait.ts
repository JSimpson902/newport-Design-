// @ts-nocheck
import {
    ELEMENT_TYPE,
    CONDITION_LOGIC,
    CONNECTOR_TYPE,
    WAIT_TIME_EVENT_TYPE,
    WAIT_TIME_EVENT_FIELDS,
    WAIT_EVENT_FIELDS
} from 'builder_platform_interaction/flowMetadata';
import {
    baseCanvasElement,
    createPastedCanvasElement,
    duplicateCanvasElementWithChildElements,
    baseCanvasElementsArrayToMap,
    baseChildElement,
    createCondition
} from './base/baseElement';
import { getConnectionProperties } from './commonFactoryUtils/decisionAndWaitConnectionPropertiesUtil';
import { createInputParameter, createInputParameterMetadataObject } from './inputParameter';
import { createOutputParameter, createOutputParameterMetadataObject } from './outputParameter';
import { createConnectorObjects } from './connector';
import { getElementByGuid } from 'builder_platform_interaction/storeUtils';
import {
    baseCanvasElementMetadataObject,
    baseChildElementMetadataObject,
    createConditionMetadataObject
} from './base/baseMetadata';
import { isObject, isUndefinedOrNull } from 'builder_platform_interaction/commonUtils';
import { LABELS } from './elementFactoryLabels';
import { generateGuid } from 'builder_platform_interaction/storeLib';
import { useFixedLayoutCanvas } from 'builder_platform_interaction/contextLib';

const elementType = ELEMENT_TYPE.WAIT;
const MAX_CONNECTIONS_DEFAULT = 2;

const childReferenceKeys = {
    childReferencesKey: 'waitEventReferences',
    childReferenceKey: 'waitEventReference'
};

/**
 * Whether the event type is one of the wait time event types (AlarmEvent or DateRefAlarmEvent)
 * @param {String} eventTypeName event type name
 * @returns {Boolean} true if event type is a wait time event type, false otherwise
 */
export const isWaitTimeEventType = eventTypeName => {
    return Object.values(WAIT_TIME_EVENT_TYPE).includes(eventTypeName);
};

/**
 * Returns the event parameter type field name. 'inputParameters' or 'outputParameters'
 * @param {Boolean} isInputParameter whether input or output param, true for input.
 */
export const getParametersPropertyName = isInputParameter => {
    return isInputParameter ? WAIT_EVENT_FIELDS.INPUT_PARAMETERS : WAIT_EVENT_FIELDS.OUTPUT_PARAMETERS;
};

/**
 * Turns an object of parameters into an array of metadata output parameters
 * @param {Object} parameters object of parameters
 * @returns {Object[]} list of metadata parameters
 */
const outputParameterMapToArray = parameters => {
    // filter parameter with empty values
    const filterEmptyValueParams = paramName => {
        const parameter = parameters[paramName];
        if (parameter) {
            const value = parameter.value;
            return !isUndefinedOrNull(value) && value !== '';
        }
        return false;
    };
    const mapToArray = paramName => {
        return createOutputParameterMetadataObject(parameters[paramName]);
    };
    return Object.keys(parameters)
        .filter(filterEmptyValueParams)
        .map(mapToArray);
};

/**
 * For a given eventType return the additional parameters which are not in the existing parameters.
 * @param {String} eventType The event type
 * @param {Array} parameters The parameters array
 * @param {Boolean} isInput whether the parameters are input or output. true for input, false otherwise.
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
            .filter(paramName => !existingParameterNames[paramName])
            .map(paramName => {
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
 * @param {String} eventType The event type.
 * @param {Array} inputParameters input parameters array
 */
export const createWaitEventInputParameters = (eventType, inputParameters = []) => {
    const additionalInputParameters = getAdditionalParameters(eventType, inputParameters, true);
    return [...inputParameters, ...additionalInputParameters].map(inputParameter => {
        return createInputParameter(inputParameter);
    });
};

/**
 * Creates all the output parameters for the event type. This includes the ones not in the metadata.
 * The additional ones are added with empty values.
 * @param {String} eventType The event type.
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
 * @typedef waitEventReference
 * @property {String} waitEventReference - guid of the wait event
 */

/**
 * @typedef waitInStore - A wait object in the shape stored by the store, containing waitEventReferences
 * @property {waitEventReference[]} waitEventReferences - array of references
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
 * @param {waitInStore} wait
 * @return {waitInPropertyEditor} Wait in the shape expected by a property editor
 */
export function createWaitWithWaitEvents(wait = {}) {
    const newWait = baseCanvasElement(wait);
    let { waitEvents } = wait;
    const { defaultConnectorLabel = LABELS.emptyDefaultWaitPathLabel, waitEventReferences } = wait;

    if (waitEventReferences && waitEventReferences.length > 0) {
        // Decouple waitEvent from store.
        waitEvents = waitEventReferences.map(waitEventReference =>
            createWaitEvent(getElementByGuid(waitEventReference.waitEventReference))
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
        elementType
    });
}

/**
 * Function to create the pasted Wait element
 *
 * @param {Object} dataForPasting - Data required to create the pasted element
 */
export function createPastedWait({
    canvasElementToPaste,
    newGuid,
    newName,
    canvasElementGuidMap,
    childElementGuidMap,
    childElementNameMap,
    cutOrCopiedChildElements,
    topCutOrCopiedGuid,
    bottomCutOrCopiedGuid,
    prev,
    next,
    parent,
    childIndex
}) {
    const { duplicatedElement, duplicatedChildElements } = createDuplicateWait(
        canvasElementToPaste,
        newGuid,
        newName,
        childElementGuidMap,
        childElementNameMap,
        cutOrCopiedChildElements
    );

    const pastedCanvasElement = createPastedCanvasElement(
        duplicatedElement,
        canvasElementGuidMap,
        topCutOrCopiedGuid,
        bottomCutOrCopiedGuid,
        prev,
        next,
        parent,
        childIndex
    );

    return {
        pastedCanvasElement,
        pastedChildElements: duplicatedChildElements
    };
}

/**
 * Function to create the duplicate Wait element
 *
 * @param {Object} wait - Wait element being copied
 * @param {String} newGuid - Guid for the new duplicated wait element
 * @param {String} newName - Name for the new duplicated wait element
 * @param {Object} childElementGuidMap - Map of child element guids to newly generated guids that will be used for
 * the duplicated child elements
 * @param {Object} childElementNameMap - Map of child element names to newly generated unique names that will be used for
 * the duplicated child elements
 * @param {Object} cutOrCopiedChildElements - Local copy of the cut ot copied canvas elements. Undefined in the case of duplication on Free Form Canvas
 * @return {Object} Returns an object containing the duplicated element and the duplicated childElements
 */
export function createDuplicateWait(
    wait,
    newGuid,
    newName,
    childElementGuidMap,
    childElementNameMap,
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

    const {
        duplicatedElement,
        duplicatedChildElements,
        updatedChildReferences,
        availableConnections
    } = duplicateCanvasElementWithChildElements(
        wait,
        newGuid,
        newName,
        childElementGuidMap,
        childElementNameMap,
        cutOrCopiedChildElements,
        createWaitEvent,
        childReferenceKeys.childReferencesKey,
        childReferenceKeys.childReferenceKey,
        defaultAvailableConnections
    );

    const updatedDuplicatedElement = Object.assign(duplicatedElement, {
        [childReferenceKeys.childReferencesKey]: updatedChildReferences,
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
 * @param {waitEvent} waitEvent - waitEvent
 * @return {waitEvent}
 */
export function createWaitEvent(waitEvent = {}) {
    const newWaitEvent = baseChildElement(waitEvent, ELEMENT_TYPE.WAIT_EVENT);
    const { eventType = WAIT_TIME_EVENT_TYPE.ABSOLUTE_TIME, eventTypeIndex = generateGuid() } = waitEvent;
    let {
        conditions = [],
        conditionLogic = CONDITION_LOGIC.NO_CONDITIONS,
        inputParameters = [],
        outputParameters = {}
    } = waitEvent;

    if (conditions.length > 0 && conditionLogic !== CONDITION_LOGIC.NO_CONDITIONS) {
        conditions = conditions.map(condition => createCondition(condition));
    } else {
        // wait events from metadata have NO CONDITIONS as condition logic even when they have no conditions
        conditionLogic = CONDITION_LOGIC.NO_CONDITIONS;
    }

    inputParameters = createWaitEventInputParameters(eventType, inputParameters);
    outputParameters = createWaitEventOutputParameters(eventType, outputParameters);

    return Object.assign(newWaitEvent, {
        conditions,
        conditionLogic,
        eventType,
        eventTypeIndex,
        inputParameters,
        outputParameters
    });
}

/**
 * Create a wait in the shape needed by the flow metadata
 * @param {waitInStore} wait - wait from the store
 * @param {Object} config - configuration for converting wait
 * @return {Object} wait in the shape for the metadata
 */
export function createWaitMetadataObject(wait, config = {}) {
    if (!wait) {
        throw new Error('Wait is not defined');
    }
    const newWait = baseCanvasElementMetadataObject(wait, config);
    const { waitEventReferences, defaultConnectorLabel = LABELS.emptyDefaultWaitPathLabel } = wait;
    let waitEvents;
    if (waitEventReferences && waitEventReferences.length > 0) {
        waitEvents = waitEventReferences.map(({ waitEventReference }) => {
            const waitEvent = getElementByGuid(waitEventReference);
            const metadataWaitEvent = baseChildElementMetadataObject(waitEvent, config);
            const { eventType } = waitEvent;
            let { inputParameters = [], outputParameters, conditions = [], conditionLogic } = waitEvent;

            if (conditions.length === 0 || conditionLogic === CONDITION_LOGIC.NO_CONDITIONS) {
                conditions = [];
                conditionLogic = CONDITION_LOGIC.AND;
            } else {
                conditions = conditions.map(condition => createConditionMetadataObject(condition));
            }

            inputParameters = inputParameters.map(inputParameter => {
                return createInputParameterMetadataObject(inputParameter);
            });

            if (isObject(outputParameters)) {
                outputParameters = outputParameterMapToArray(outputParameters);
            }

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
        defaultConnectorLabel
    });
}

/**
 * Given a wait element in a property editor, create a wait element in the shape expected by the store
 * @param {wait} wait - wait in the shape of the property editor
 * @return
 *   {
 *     wait: wait,
 *     deletedWaitEvents: waitEvent[] , waitEvents: Array, elementType: string}
 *   }
 */
export function createWaitWithWaitEventReferencesWhenUpdatingFromPropertyEditor(wait) {
    const newWait = baseCanvasElement(wait);
    const { defaultConnectorLabel = LABELS.emptyDefaultWaitPathLabel, waitEvents } = wait;
    let waitEventReferences = [];
    let newWaitEvents = [];
    for (let i = 0; i < waitEvents.length; i++) {
        const waitEvent = waitEvents[i];
        const newWaitEvent = createWaitEvent(waitEvent);
        waitEventReferences = updateWaitEventReferences(waitEventReferences, newWaitEvent);
        newWaitEvents = [...newWaitEvents, newWaitEvent];
    }

    const maxConnections = newWaitEvents.length + 2;
    const { newChildren, deletedWaitEvents, deletedBranchHeadGuids } = getUpdatedChildrenDeletedWaitEventsUsingStore(
        wait,
        newWaitEvents
    );
    const deletedWaitEventGuids = deletedWaitEvents.map(waitEvent => waitEvent.guid);

    let originalWait = getElementByGuid(wait.guid);

    if (!originalWait) {
        originalWait = {
            availableConnections: [
                {
                    type: CONNECTOR_TYPE.DEFAULT
                },
                {
                    type: CONNECTOR_TYPE.FAULT
                }
            ],
            waitEventReferences: []
        };
    }

    const connectionProperties = getConnectionProperties(
        originalWait,
        waitEventReferences,
        deletedWaitEventGuids,
        childReferenceKeys.childReferencesKey,
        childReferenceKeys.childReferenceKey
    );
    let { connectorCount } = connectionProperties;
    const { availableConnections, addFaultConnectionForWaitElement } = connectionProperties;

    // If addFaultConnectionForWaitElement is false, it means that the Fault Connector has already been established and
    // the connector count needs to be incremented
    if (addFaultConnectionForWaitElement) {
        availableConnections.push({ type: CONNECTOR_TYPE.FAULT });
    } else {
        connectorCount += 1;
    }

    if (useFixedLayoutCanvas()) {
        Object.assign(newWait, {
            children: newChildren
        });
    }

    Object.assign(newWait, {
        waitEventReferences,
        elementType,
        defaultConnectorLabel,
        maxConnections,
        connectorCount,
        availableConnections
    });

    return {
        canvasElement: newWait,
        deletedChildElementGuids: deletedWaitEventGuids,
        childElements: newWaitEvents,
        deletedBranchHeadGuids,
        elementType: ELEMENT_TYPE.WAIT_WITH_MODIFIED_AND_DELETED_WAIT_EVENTS
    };
}

/**
 * Create a wait in the shape of the store (with waitEvent references).  This is used when taking a flow element and
 * converting it for use in the store
 * @param {Object} wait - wait from metadata
 * @return {waitInStore} wait in the shape used by the store
 */
export function createWaitWithWaitEventReferences(wait = {}) {
    const newWait = baseCanvasElement(wait);
    let newWaitEvents = [],
        waitEventReferences = [],
        availableConnections = [];
    const { defaultConnectorLabel = LABELS.emptyDefaultWaitPathLabel, waitEvents = [] } = wait;
    // create connectors for wait, which initially are the default and fault ones.
    let connectors = createConnectorObjects(wait, newWait.guid);
    for (let i = 0; i < waitEvents.length; i++) {
        const waitEvent = createWaitEvent(waitEvents[i]);
        const connectorsFromWaitEvent = createConnectorObjects(waitEvents[i], waitEvent.guid, newWait.guid);
        // add the wait event connector to the list of connectors
        connectors = [...connectors, ...connectorsFromWaitEvent];
        newWaitEvents = [...newWaitEvents, waitEvent];
        // updating waitEventReferences
        waitEventReferences = updateWaitEventReferences(waitEventReferences, waitEvent);
        // updating availableConnections
        availableConnections = addRegularConnectorToAvailableConnections(availableConnections, waitEvents[i]);
    }
    availableConnections = addDefaultConnectorToAvailableConnections(availableConnections, wait);
    availableConnections = addFaultConnectorToAvailableConnections(availableConnections, wait);
    const connectorCount = connectors ? connectors.length : 0;
    const maxConnections = calculateMaxWaitConnections(wait);
    Object.assign(newWait, {
        waitEventReferences,
        defaultConnectorLabel,
        elementType,
        connectorCount,
        maxConnections,
        availableConnections
    });
    return baseCanvasElementsArrayToMap([newWait, ...newWaitEvents], connectors);
}

function calculateMaxWaitConnections(wait) {
    if (!wait) {
        throw new Error('Max connection cannot be calculated because wait object is not defined');
    }

    // TODO: Change this to get the value from connectorUtils when the connector utils are refactored:
    // W-5478126 https://gus.lightning.force.com/lightning/r/ADM_Work__c/a07B0000005ajm1IAA/view
    // Regular connectors for each event + default + fault
    let length = MAX_CONNECTIONS_DEFAULT;
    if (wait.waitEvents) {
        length = wait.waitEvents.length + MAX_CONNECTIONS_DEFAULT;
    }
    return length;
}

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

function addRegularConnectorToAvailableConnections(availableConnections = [], waitEvent) {
    if (!availableConnections || !waitEvent || !waitEvent.name) {
        throw new Error('Either availableConnections or wait event is not defined');
    }
    const { name, connector } = waitEvent;

    if (!connector) {
        const childReference = name;
        return [
            ...availableConnections,
            {
                type: CONNECTOR_TYPE.REGULAR,
                childReference
            }
        ];
    }
    return availableConnections;
}

function updateWaitEventReferences(waitEventReferences = [], waitEvent) {
    if (!waitEvent || !waitEvent.guid) {
        throw new Error('Either waitEvent or waitEvent.guid is not defined');
    }
    return [
        ...waitEventReferences,
        {
            waitEventReference: waitEvent.guid
        }
    ];
}

// TODO: Refactor Decision and Wait functions here to use common code path
function getUpdatedChildrenDeletedWaitEventsUsingStore(originalWait, newWaitEvents = []) {
    if (!originalWait) {
        throw new Error('wait is not defined');
    }
    const { guid, children } = originalWait;
    const waitFromStore = getElementByGuid(guid);
    let waitEventReferencesFromStore;
    if (waitFromStore) {
        waitEventReferencesFromStore = waitFromStore.waitEventReferences.map(
            waitEventReference => waitEventReference.waitEventReference
        );
    }

    const newWaitEventGuids = newWaitEvents.map(newWaitEvent => newWaitEvent.guid);

    // Initializing the new children array
    const newChildren = new Array(newWaitEventGuids.length + 1).fill(null);
    let deletedWaitEvents = [];
    const deletedBranchHeadGuids = [];

    if (waitEventReferencesFromStore) {
        deletedWaitEvents = waitEventReferencesFromStore
            .filter(waitEventReferenceGuid => {
                return !newWaitEventGuids.includes(waitEventReferenceGuid);
            })
            .map(waitEventReference => getElementByGuid(waitEventReference));

        if (useFixedLayoutCanvas()) {
            // For wait events that previously existed, finding the associated children
            // and putting them at the right indexes in newChildren
            for (let i = 0; i < newWaitEventGuids.length; i++) {
                const foundAtIndex = waitEventReferencesFromStore.indexOf(newWaitEventGuids[i]);
                if (foundAtIndex !== -1) {
                    newChildren[i] = children[foundAtIndex];
                }
            }

            // Adding the default branch's associated child to the last index of newChildren
            newChildren[newChildren.length - 1] = children[children.length - 1];

            // Getting the child associated with the deleted wait event
            for (let i = 0; i < waitEventReferencesFromStore.length; i++) {
                if (!newWaitEventGuids.includes(waitEventReferencesFromStore[i]) && children[i]) {
                    deletedBranchHeadGuids.push(children[i]);
                }
            }
        }
    }
    return { newChildren, deletedWaitEvents, deletedBranchHeadGuids };
}
