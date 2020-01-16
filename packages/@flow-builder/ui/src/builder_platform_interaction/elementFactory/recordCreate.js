import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import {
    baseCanvasElement,
    baseCanvasElementsArrayToMap,
    duplicateCanvasElement,
    createAvailableConnection,
    automaticOutputHandlingSupport
} from './base/baseElement';
import { baseCanvasElementMetadataObject } from './base/baseMetadata';
import { createConnectorObjects } from './connector';
import { removeFromAvailableConnections } from 'builder_platform_interaction/connectorUtils';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';

import { getGlobalConstantOrSystemVariable } from 'builder_platform_interaction/systemLib';
import { getElementByGuid } from 'builder_platform_interaction/storeUtils';
import {
    createFlowInputFieldAssignmentMetadataObject,
    createFlowInputFieldAssignment,
    getDefaultAvailableConnections,
    createEmptyAssignmentMetadata
} from './base/baseRecordElement';
import { generateGuid } from 'builder_platform_interaction/storeLib';
import * as apexTypeLib from 'builder_platform_interaction/apexTypeLib';
import { sanitizeGuid } from 'builder_platform_interaction/dataMutationLib';

const elementType = ELEMENT_TYPE.RECORD_CREATE;
const maxConnections = 2;

export function createRecordCreate(recordCreate = {}) {
    const newRecordCreate = baseCanvasElement(recordCreate);
    const {
        inputReference = '',
        inputReferenceIndex = generateGuid(),
        object = '',
        objectIndex = generateGuid(),
        assignRecordIdToReference = '',
        assignRecordIdToReferenceIndex = generateGuid(),
        storeOutputAutomatically
    } = recordCreate;
    let {
        inputAssignments = [],
        availableConnections = getDefaultAvailableConnections()
    } = recordCreate;
    availableConnections = availableConnections.map(availableConnection =>
        createAvailableConnection(availableConnection)
    );

    let getFirstRecordOnly = true;
    const dataType = storeOutputAutomatically
        ? FLOW_DATA_TYPE.STRING.value
        : FLOW_DATA_TYPE.BOOLEAN.value;

    let recordCreateObject;
    if (object) {
        inputAssignments = inputAssignments.map(item =>
            createFlowInputFieldAssignment(item, object)
        );

        recordCreateObject = Object.assign(newRecordCreate, {
            object,
            objectIndex,
            inputAssignments,
            getFirstRecordOnly,
            inputReference,
            inputReferenceIndex,
            availableConnections,
            maxConnections,
            elementType,
            assignRecordIdToReference,
            assignRecordIdToReferenceIndex,
            dataType,
            storeOutputAutomatically
        });
    } else {
        if (inputReference) {
            // When the builder is loaded the store does not yet contain the variables
            // getFirstRecordOnly can only be calculated at the opening on the element
            const complexGuid = sanitizeGuid(inputReference);
            const variable =
                getElementByGuid(complexGuid.guidOrLiteral) ||
                getGlobalConstantOrSystemVariable(complexGuid.guidOrLiteral);
            if (variable) {
                if (variable.dataType !== FLOW_DATA_TYPE.APEX.value) {
                    getFirstRecordOnly =
                        variable.dataType !== FLOW_DATA_TYPE.SOBJECT.value ||
                        !variable.isCollection;
                } else if (
                    variable.dataType === FLOW_DATA_TYPE.APEX.value &&
                    complexGuid.fieldNames.length === 1
                ) {
                    const apexClazz = apexTypeLib.getPropertiesForClass(
                        variable.subtype
                    );
                    const property = apexClazz[complexGuid.fieldNames[0]];
                    if (property) {
                        getFirstRecordOnly = !property.isCollection;
                    }
                }
            }
        }

        recordCreateObject = Object.assign(newRecordCreate, {
            object,
            objectIndex,
            getFirstRecordOnly,
            inputReference,
            inputReferenceIndex,
            availableConnections,
            maxConnections,
            elementType,
            assignRecordIdToReferenceIndex,
            dataType
        });
    }

    return recordCreateObject;
}

export function createDuplicateRecordCreate(recordCreate, newGuid, newName) {
    const newRecordCreate = createRecordCreate(recordCreate);
    Object.assign(newRecordCreate, {
        availableConnections: getDefaultAvailableConnections()
    });
    const duplicateRecordCreate = duplicateCanvasElement(
        newRecordCreate,
        newGuid,
        newName
    );

    return duplicateRecordCreate;
}

export function createRecordCreateWithConnectors(recordCreate) {
    const newRecordCreate = createRecordCreate(recordCreate);

    const connectors = createConnectorObjects(
        recordCreate,
        newRecordCreate.guid
    );
    const defaultAvailableConnections = getDefaultAvailableConnections();
    const availableConnections = removeFromAvailableConnections(
        defaultAvailableConnections,
        connectors
    );
    const connectorCount = connectors ? connectors.length : 0;

    const recordCreateObject = Object.assign(newRecordCreate, {
        availableConnections,
        connectorCount
    });

    return baseCanvasElementsArrayToMap([recordCreateObject], connectors);
}

export function createRecordCreateMetadataObject(recordCreate, config) {
    if (!recordCreate) {
        throw new Error('recordCreate is not defined');
    }

    const recordCreateMetadata = baseCanvasElementMetadataObject(
        recordCreate,
        config
    );
    let { storeOutputAutomatically } = recordCreate;
    const { inputReference, object, getFirstRecordOnly } = recordCreate;

    if (getFirstRecordOnly && recordCreate.object !== '') {
        const { assignRecordIdToReference } = recordCreate;
        let { inputAssignments = [] } = recordCreate;
        inputAssignments = inputAssignments.map(input =>
            createFlowInputFieldAssignmentMetadataObject(input)
        );

        inputAssignments = createEmptyAssignmentMetadata(inputAssignments);

        if (!automaticOutputHandlingSupport()) {
            // automaticOutputHandlingSupport To be able to save the flow if the user change the process type on the save as.
            storeOutputAutomatically = undefined;
        }

        const newRecordCreateMetadata = Object.assign(
            recordCreateMetadata,
            {
                object,
                inputAssignments
            },
            storeOutputAutomatically !== undefined
                ? { storeOutputAutomatically }
                : {}
        );
        if (assignRecordIdToReference !== '') {
            newRecordCreateMetadata.assignRecordIdToReference = assignRecordIdToReference;
        }
        return newRecordCreateMetadata;
    }
    return Object.assign(recordCreateMetadata, {
        inputReference
    });
}
