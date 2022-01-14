// @ts-nocheck
import { removeFromAvailableConnections } from 'builder_platform_interaction/connectorUtils';
import { CONNECTOR_TYPE, ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { getVariableOrField } from 'builder_platform_interaction/referenceToVariableUtil';
import { generateGuid, Store } from 'builder_platform_interaction/storeLib';
import {
    baseCanvasElement,
    baseCanvasElementsArrayToMap,
    duplicateCanvasElement,
    INCOMPLETE_ELEMENT
} from './base/baseElement';
import { baseCanvasElementMetadataObject } from './base/baseMetadata';
import { createConnectorObjects } from './connector';

const elementType = ELEMENT_TYPE.LOOP;
const maxConnections = 2;
const getDefaultAvailableConnections = () => [
    {
        type: CONNECTOR_TYPE.LOOP_NEXT
    },
    {
        type: CONNECTOR_TYPE.LOOP_END
    }
];
const ITERATION_ORDER_ASCENDING = 'Asc';

/**
 * @param loop
 * @param root0
 * @param root0.elements
 */
export function createLoop(loop = {}, { elements } = Store.getStore().getCurrentState()) {
    const newLoop = baseCanvasElement(loop);
    const {
        assignNextValueToReference = null,
        assignNextValueToReferenceIndex = generateGuid(),
        collectionReference = null,
        collectionReferenceIndex = generateGuid(),
        iterationOrder = ITERATION_ORDER_ASCENDING,
        availableConnections = getDefaultAvailableConnections()
    } = loop;

    let dataType, subtype;
    let complete = true;
    const storeOutputAutomatically = assignNextValueToReference === null;

    if (storeOutputAutomatically && collectionReference) {
        // When the flow is loaded, this factory is called twice. In the first phase, elements is empty. In the second phase, elements is set and
        // we can calculate dataType and subtype
        const loopedCollection = getVariableOrField(collectionReference, elements);
        // W-10384755: wait until the loopedCollection has dataType. For example, loop on filter node, need to wait until the filter's output is complete to find the datatType and subtype
        if (loopedCollection?.dataType) {
            ({ dataType, subtype } = loopedCollection);
        } else {
            complete = false;
        }
    }
    return Object.assign(
        newLoop,
        {
            assignNextValueToReference,
            assignNextValueToReferenceIndex,
            collectionReference,
            collectionReferenceIndex,
            iterationOrder,
            maxConnections,
            availableConnections,
            elementType,
            storeOutputAutomatically,
            dataType,
            subtype
        },
        complete ? {} : { [INCOMPLETE_ELEMENT]: true }
    );
}

/**
 * @param loop
 * @param newGuid
 * @param newName
 */
export function createDuplicateLoop(loop, newGuid, newName) {
    const newLoop = createLoop(loop);
    Object.assign(newLoop, {
        availableConnections: getDefaultAvailableConnections()
    });
    const duplicateLoop = duplicateCanvasElement(newLoop, newGuid, newName);

    return duplicateLoop;
}

/**
 * @param loop
 * @param root0
 * @param root0.elements
 */
export function createLoopWithConnectors(loop, { elements } = Store.getStore().getCurrentState()) {
    const newLoop = createLoop(loop, { elements });
    const connectors = createConnectorObjects(loop, newLoop.guid);
    const connectorCount = connectors ? connectors.length : 0;
    const defaultAvailableConnections = getDefaultAvailableConnections();
    const availableConnections = removeFromAvailableConnections(defaultAvailableConnections, connectors);

    const loopObject = Object.assign(newLoop, {
        connectorCount,
        availableConnections
    });

    return baseCanvasElementsArrayToMap([loopObject], connectors);
}

/**
 * @param loop
 * @param config
 */
export function createLoopMetadataObject(loop, config = {}) {
    if (!loop) {
        throw new Error('loop is not defined');
    }

    const newLoop = baseCanvasElementMetadataObject(loop, config);
    const { assignNextValueToReference, collectionReference, iterationOrder } = loop;

    return Object.assign(newLoop, {
        assignNextValueToReference,
        collectionReference,
        iterationOrder
    });
}
