import {
    ELEMENT_TYPE,
    CONNECTOR_TYPE
} from "builder_platform_interaction/flowMetadata";
import {
    baseCanvasElement,
    duplicateCanvasElement,
    baseCanvasElementsArrayToMap
} from "./base/baseElement";
import { baseCanvasElementMetadataObject } from "./base/baseMetadata";
import { createConnectorObjects } from './connector';
import { removeFromAvailableConnections } from "builder_platform_interaction/connectorUtils";

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

export function createLoop(loop = {}) {
    const newLoop = baseCanvasElement(loop);
    const {
        assignNextValueToReference = null,
        collectionReference = null,
        iterationOrder = ITERATION_ORDER_ASCENDING,
        availableConnections = getDefaultAvailableConnections()
    } = loop;

    return Object.assign(newLoop, {
        assignNextValueToReference,
        collectionReference,
        iterationOrder,
        maxConnections,
        availableConnections,
        elementType
    });
}

export function createDuplicateLoop(loop, newGuid) {
    const newLoop = createLoop(loop);
    const duplicateLoop = duplicateCanvasElement(newLoop, newGuid);

    return duplicateLoop;
}

export function createLoopWithConnectors(loop) {
    const newLoop = createLoop(loop);
    const connectors = createConnectorObjects(loop, newLoop.guid);
    const connectorCount = connectors ? connectors.length : 0;
    const defaultAvailableConnections = getDefaultAvailableConnections();
    const availableConnections = removeFromAvailableConnections(
        defaultAvailableConnections,
        connectors
    );

    const loopObject = Object.assign(newLoop, {
        connectorCount,
        availableConnections
    });

    return baseCanvasElementsArrayToMap([loopObject], connectors);
}

export function createLoopMetadataObject(loop, config = {}) {
    if (!loop) {
        throw new Error('loop is not defined');
    }

    const newLoop = baseCanvasElementMetadataObject(loop, config);
    const {
        assignNextValueToReference,
        collectionReference,
        iterationOrder
    } = loop;

    return Object.assign(newLoop, {
        assignNextValueToReference,
        collectionReference,
        iterationOrder
    });
}
