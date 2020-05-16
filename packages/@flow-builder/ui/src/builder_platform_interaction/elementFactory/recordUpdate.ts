// @ts-nocheck
import { CONDITION_LOGIC, ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import {
    baseCanvasElement,
    baseCanvasElementsArrayToMap,
    duplicateCanvasElement,
    createAvailableConnection
} from './base/baseElement';
import { baseCanvasElementMetadataObject } from './base/baseMetadata';
import { createConnectorObjects } from './connector';
import { removeFromAvailableConnections } from 'builder_platform_interaction/connectorUtils';
import {
    createRecordFilters,
    createFilterMetadataObject,
    createFlowInputFieldAssignmentMetadataObject,
    createFlowInputFieldAssignment,
    getDefaultAvailableConnections
} from './base/baseRecordElement';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import { generateGuid } from 'builder_platform_interaction/storeLib';

const elementType = ELEMENT_TYPE.RECORD_UPDATE;
const maxConnections = 2;

export function createRecordUpdate(recordUpdate = {}) {
    const newRecordUpdate = baseCanvasElement(recordUpdate);
    const {
        inputReference = '',
        inputReferenceIndex = generateGuid(),
        object = '',
        objectIndex = generateGuid(),
        filterLogic = CONDITION_LOGIC.AND
    } = recordUpdate;
    let { filters, inputAssignments = [], availableConnections = getDefaultAvailableConnections() } = recordUpdate;

    availableConnections = availableConnections.map(availableConnection =>
        createAvailableConnection(availableConnection)
    );

    inputAssignments = inputAssignments.map(item => createFlowInputFieldAssignment(item, object));

    const useSobject = inputReference !== '' || object === '';

    filters = createRecordFilters(filters, object);

    return Object.assign(newRecordUpdate, {
        inputReference,
        inputReferenceIndex,
        maxConnections,
        availableConnections,
        elementType,
        inputAssignments,
        useSobject,
        filters,
        filterLogic,
        object,
        objectIndex,
        dataType: FLOW_DATA_TYPE.BOOLEAN.value
    });
}

export function createDuplicateRecordUpdate(recordUpdate, newGuid, newName) {
    const newRecordUpdate = createRecordUpdate(recordUpdate);
    Object.assign(newRecordUpdate, {
        availableConnections: getDefaultAvailableConnections()
    });
    const duplicateRecordUpdate = duplicateCanvasElement(newRecordUpdate, newGuid, newName);

    return duplicateRecordUpdate;
}

export function createRecordUpdateWithConnectors(recordUpdate = {}) {
    const newRecordUpdate = createRecordUpdate(recordUpdate);

    const connectors = createConnectorObjects(recordUpdate, newRecordUpdate.guid);
    const availableConnections = removeFromAvailableConnections(getDefaultAvailableConnections(), connectors);
    const connectorCount = connectors ? connectors.length : 0;

    const recordUpdateObject = Object.assign(newRecordUpdate, {
        availableConnections,
        connectorCount
    });

    return baseCanvasElementsArrayToMap([recordUpdateObject], connectors);
}

export function createRecordUpdateMetadataObject(recordUpdate, config) {
    if (!recordUpdate) {
        throw new Error('recordUpdate is not defined');
    }

    const recordUpdateMetadata = baseCanvasElementMetadataObject(recordUpdate, config);
    const { inputReference, object, useSobject } = recordUpdate;

    if (!useSobject) {
        let { filters = [], inputAssignments = [] } = recordUpdate;
        const { filterLogic } = recordUpdate;

        if (filterLogic === CONDITION_LOGIC.NO_CONDITIONS) {
            filters = [];
        } else {
            filters = filters.map(filter => createFilterMetadataObject(filter));
        }

        inputAssignments = inputAssignments.map(input => createFlowInputFieldAssignmentMetadataObject(input));

        return Object.assign(recordUpdateMetadata, {
            filters,
            filterLogic,
            object,
            inputAssignments
        });
    }

    return Object.assign(recordUpdateMetadata, {
        inputReference
    });
}
