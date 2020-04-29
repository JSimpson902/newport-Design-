import { generateGuid } from 'builder_platform_interaction/storeLib';
import { getElementByGuid } from 'builder_platform_interaction/storeUtils';
import { ELEMENT_TYPE, CONNECTOR_TYPE } from 'builder_platform_interaction/flowMetadata';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import { createFEROV } from '../ferov';
import { createListRowItem, RHS_DATA_TYPE_PROPERTY, RHS_PROPERTY } from './baseList';
import { Store } from 'builder_platform_interaction/storeLib';
import {
    FLOW_AUTOMATIC_OUTPUT_HANDLING,
    getProcessTypeAutomaticOutPutHandlingSupport
} from 'builder_platform_interaction/processTypeLib';
import { useFixedLayoutCanvas } from 'builder_platform_interaction/contextLib';
import { supportsChildren } from 'builder_platform_interaction/flcBuilderUtils';

export const DUPLICATE_ELEMENT_XY_OFFSET = 75;

// Used to mark an element as incomplete. An element is incomplete when it cannot fully be created because the factory needs information from an element that has
// not yet been created. translatorLib.translateFlowToUIModel uses this information to create the ui model in 2 passes
export const INCOMPLETE_ELEMENT = Symbol('incomplete');

export function baseResource(resource = {}) {
    const newResource = baseElement(resource);
    const { description = '' } = resource;
    return Object.assign(newResource, {
        description
    });
}

export function createAvailableConnection(availableConnection = {}) {
    const { type } = availableConnection;
    return { type };
}

function createCanvasElementConfig(config = { isSelected: false, isHighlighted: false, isSelectable: true }) {
    const { isSelected, isHighlighted, isSelectable } = config;
    return { isSelected, isHighlighted, isSelectable };
}

/**
 *  Adds FLC specific ui model properties
 */
function addBaseCanvasElementProperties(canvasElement, newCanvasElement) {
    const {
        next = null,
        prev = null,
        children = null,
        childIndex = null,
        parent = null,
        isTerminal = null
    } = canvasElement;
    if (supportsChildren(canvasElement)) {
        Object.assign(newCanvasElement, { children });
    }

    if (parent) {
        Object.assign(newCanvasElement, { parent, childIndex, isTerminal });
    }

    Object.assign(newCanvasElement, { next, prev });
}

export function baseCanvasElement(canvasElement = {}) {
    const newCanvasElement = baseResource(canvasElement);
    const { label = '', locationX = 0, locationY = 0, connectorCount = 0 } = canvasElement;
    let { config } = canvasElement;
    config = createCanvasElementConfig(config);

    if (useFixedLayoutCanvas()) {
        addBaseCanvasElementProperties(canvasElement, newCanvasElement);
    }

    return Object.assign(newCanvasElement, {
        label,
        locationX,
        locationY,
        isCanvasElement: true,
        connectorCount,
        config
    });
}

/**
 * Base function to create the Pasted Canvas Element
 * @param {Object} duplicatedElement - Element object in it's duplicated state
 * @param {Object} canvasElementGuidMap - Map containing element guids -> pasted element guids
 * @param {String} topCutOrCopiedGuid - Guid of the top most cut or copied element
 * @param {String} bottomCutOrCopiedGuid - Guid of the bottom most cut or copied element
 * @param {String} prev - Guid of the element below which the cut/copied block will be pasted. This can be null when pasting at the top of a branch
 * @param {String} next - Guid of the element above which the cut/copied block will be pasted. This can be null when pasting at the bottom of a branch
 * @param {String} parent - Guid of the parent element. This has a value only when pasting at the top of a branch
 * @param {Number} childIndex - Index of the branch. This has a value only when pasting at the top of a branch
 * @returns pastedCanvasElement
 */
export function createPastedCanvasElement(
    duplicatedElement,
    canvasElementGuidMap,
    topCutOrCopiedGuid,
    bottomCutOrCopiedGuid,
    prev,
    next,
    parent,
    childIndex
) {
    const pastedCanvasElement = Object.assign(duplicatedElement, {
        config: { isSelected: false, isHighlighted: false, isSelectable: true },
        prev: canvasElementGuidMap[duplicatedElement.prev],
        next: canvasElementGuidMap[duplicatedElement.next]
    });

    // If the parent hasn't been cut or copied, and the pasted element is same as topCutOrCopiedElement, then update the prev, parent and childIndex properties.
    if (pastedCanvasElement.guid === canvasElementGuidMap[topCutOrCopiedGuid]) {
        pastedCanvasElement.prev = prev;

        // If parent and childIndex are defined then update those properties or delete them
        if (parent) {
            pastedCanvasElement.parent = parent;
            pastedCanvasElement.childIndex = childIndex;
        } else {
            delete pastedCanvasElement.parent;
            delete pastedCanvasElement.childIndex;
        }
    } else if (canvasElementGuidMap[pastedCanvasElement.parent]) {
        // If the parent element has also been cut or copied, then update the parent guid
        pastedCanvasElement.parent = canvasElementGuidMap[pastedCanvasElement.parent];
    }

    // If the pasted canvas element is same as the bottomCutOrCopiedElement, then updating the next
    if (pastedCanvasElement.guid === canvasElementGuidMap[bottomCutOrCopiedGuid]) {
        pastedCanvasElement.next = next;
    }

    // Resetting the children array to include children guids that are being pasted or null for those that aren't
    if (pastedCanvasElement.children) {
        pastedCanvasElement.children = pastedCanvasElement.children.map(childGuid => {
            return canvasElementGuidMap[childGuid] || null;
        });
    }

    // Deleting the isTerminal property from the pastedCanvasElement. We reset it if needed in the reducer
    delete pastedCanvasElement.isTerminal;

    return pastedCanvasElement;
}

/**
 * Base function to duplicate canvas elements
 * @param {Object} canvasElement - canvas element to be duplicated
 * @param {string} newGuid - new guid for the duplicate element
 * @param {string} newName - new name for the duplicate element
 * @returns {Object} duplicated element with a new unique name and guid
 */
export function duplicateCanvasElement(canvasElement, newGuid, newName) {
    const { locationX, locationY, maxConnections, elementType } = canvasElement;
    const duplicatedElement = Object.assign({}, canvasElement, {
        guid: newGuid,
        name: newName,
        locationX: locationX + DUPLICATE_ELEMENT_XY_OFFSET,
        locationY: locationY + DUPLICATE_ELEMENT_XY_OFFSET,
        config: { isSelected: true, isHighlighted: false },
        connectorCount: 0,
        maxConnections,
        elementType
    });

    return { duplicatedElement };
}

/**
 * Helper function to create duplicated child elements
 *
 * @param {Object} childReference - Object containing the guid of the child element (eg: {outcomeReference: 'outcome1'})
 * @param {Object} childElementGuidMap - Map of child element guids to new guids for the duplicated child elements
 * @param {Object} childElementNameMap - Map of child element names to new names for the duplicated child elements
 * @param {Object} cutOrCopiedChildElements - Local copy of the cut ot copied canvas elements
 * @param {Function} createChildElement - Function to create the duplicate child element
 * @param {String} childReferenceKey - Key to access the guid for the child element (eg: outcomeReference)
 * @returns {Object} Returns the duplicated child element with the updated guid and name
 * @private
 */
function _createDuplicateChildElement(
    childReference,
    childElementGuidMap,
    childElementNameMap,
    cutOrCopiedChildElements,
    createChildElement,
    childReferencesKey,
    childReferenceKey
) {
    // Using the cutOrCopiedChildElements to get the original child element in case the element has been deleted
    // and not available in the store
    const originalChildElement = cutOrCopiedChildElements
        ? cutOrCopiedChildElements[childReference[childReferenceKey]]
        : getElementByGuid(childReference[childReferenceKey]);
    const duplicatedChildElements = createChildElement(originalChildElement, cutOrCopiedChildElements);

    // In case of screens, duplicatedChildElements is an array otherwise a single element object
    if (Array.isArray(duplicatedChildElements)) {
        let duplicatedChildElement;

        // Iterating over the duplicatedChildElements and updating the guid, name and any childReferences.
        // Also finding the parent duplicated element
        const duplicatedNestedChildElements = duplicatedChildElements.reduce((acc, el) => {
            // Updating the name and guid for the duplicatedChildElement
            el = Object.assign(el, {
                guid: childElementGuidMap[el.guid],
                name: childElementNameMap[el.name]
            });

            // Updating the childReferences array to have the guids of the duplicated nested child elements
            const updatedChildReferences =
                el[childReferencesKey] &&
                el[childReferencesKey].map(origChildReferenceObj => {
                    return {
                        [childReferenceKey]: childElementGuidMap[origChildReferenceObj[childReferenceKey]]
                    };
                });

            // Adding the childReferences property only if updatedChildReferences exists
            if (updatedChildReferences) {
                el = Object.assign(el, {
                    [childReferencesKey]: updatedChildReferences
                });
            }

            // Finding the duplicatedChildElement (duplicated originalChildElement)
            if (!duplicatedChildElement && el.guid === childElementGuidMap[originalChildElement.guid]) {
                duplicatedChildElement = el;
            } else {
                acc[el.guid] = el;
            }

            return acc;
        }, {});

        return {
            duplicatedChildElement,
            duplicatedNestedChildElements
        };
    }
    // Updating the duplicatedChildElement's guid and name
    return {
        duplicatedChildElement: Object.assign(duplicatedChildElements, {
            guid: childElementGuidMap[originalChildElement.guid],
            name: childElementNameMap[originalChildElement.name]
        }),
        duplicatedNestedChildElements: {}
    };
}

/**
 * Base function to create duplicate canvas elements that contain child elements (such as : Decision, Screen and Wait)
 *
 * @param {Object} canvasElement - Canvas element that needs to be duplicated
 * @param {String} newGuid - Guid for the duplicated canvas element
 * @param {String} newName - Name for the duplicated canvas element
 * @param {Object} childElementGuidMap - Map of child element guids to new guids for the duplicated child elements
 * @param {Object} childElementNameMap - Map of child element names to new names for the duplicated child elements
 * @param {Object} cutOrCopiedChildElements - Local copy of the cut ot copied canvas elements
 * @param {Function} createChildElement - Function to create the duplicate child element
 * @param {String} childReferencesKey - Key to access the object containing child references (eg: outcomeReferences)
 * @param {String} childReferenceKey - Key to access the guid for the child element (eg: outcomeReference)
 * @param {Object[]} defaultAvailableConnections - Default Available Connections associated with a canvas element
 * @returns {Object} Returns the object containing the duplicated canvas element, duplicated child elements, updated child
 * references and available connections
 */
export function duplicateCanvasElementWithChildElements(
    canvasElement,
    newGuid,
    newName,
    childElementGuidMap,
    childElementNameMap,
    cutOrCopiedChildElements,
    createChildElement,
    childReferencesKey,
    childReferenceKey,
    defaultAvailableConnections = []
) {
    const { duplicatedElement } = duplicateCanvasElement(canvasElement, newGuid, newName);
    const childReferences = canvasElement[childReferencesKey];

    const additionalAvailableConnections = [];
    let duplicatedChildElements = {};

    // Iterating over existing child references to create duplicate child elements and updating available connections.
    // Also using the duplicated guids to create the updated childReferences for the duplicated element
    const updatedChildReferences = childReferences.map(childReference => {
        const { duplicatedChildElement, duplicatedNestedChildElements } = _createDuplicateChildElement(
            childReference,
            childElementGuidMap,
            childElementNameMap,
            cutOrCopiedChildElements,
            createChildElement,
            childReferencesKey,
            childReferenceKey
        );

        duplicatedChildElements[duplicatedChildElement.guid] = duplicatedChildElement;
        duplicatedChildElements = { ...duplicatedChildElements, ...duplicatedNestedChildElements };

        additionalAvailableConnections.push({
            type: CONNECTOR_TYPE.REGULAR,
            childReference: duplicatedChildElement.guid
        });

        return {
            [childReferenceKey]: duplicatedChildElement.guid
        };
    });

    const availableConnections = [...defaultAvailableConnections, ...additionalAvailableConnections];
    return {
        duplicatedElement,
        duplicatedChildElements,
        updatedChildReferences,
        availableConnections
    };
}

/**
 * Create a new condition for property editor use
 * @param {Condition} condition - condition in store shape
 * @return {module:baseList.ListRowItem} the new condition
 */
export function createCondition(condition = {}) {
    let newCondition = {};
    if (condition.hasOwnProperty('leftValueReference')) {
        const ferov = createFEROV(condition.rightValue, RHS_PROPERTY, RHS_DATA_TYPE_PROPERTY);
        newCondition = Object.assign({}, ferov, {
            leftHandSide: condition.leftValueReference,
            operator: condition.operator
        });

        newCondition = createListRowItem(newCondition);
    } else {
        newCondition = createListRowItem(condition);
    }

    return newCondition;
}

/**
 * @typedef {Object} ChildElement
 * @property {String} label - element label
 * @property {String} name - element devName
 * @property {String} guid - element guid
 * @property {module:dataTypeLib.FLOW_DATA_TYPE.BOOLEAN} dataType - All child elements are dataType BOOLEAN
 * @property {module:flowMetadata.CONDITION_LOGIC} conditionLogic - element condition logic
 * @property {module:flowMetadata.ELEMENT_TYPE} elementType - Child elements must be ELEMENT_TYPE OUTCOME or WAIT_EVENT
 * @property {module:baseList.ListRowItem[]} conditions - array of conditions
 */

/**
 * Factory class for creating a new child element
 * @param childElement
 * @param {module:flowMetadata.ELEMENT_TYPE} elementType one of the values defined in ELEMENT_TYPE
 * @return {ChildElement}
 */
export function baseChildElement(childElement = {}, elementType) {
    if (elementType !== ELEMENT_TYPE.OUTCOME && elementType !== ELEMENT_TYPE.WAIT_EVENT) {
        throw new Error('baseChildElement should only be used for outcomes and wait events');
    } else if (childElement.dataType && childElement.dataType !== FLOW_DATA_TYPE.BOOLEAN.value) {
        throw new Error(`dataType ${childElement.dataType} is invalid for baseChildElement`);
    }
    const newChildElement = baseElement(childElement);
    const { label = '' } = childElement;
    return Object.assign(newChildElement, {
        label,
        elementType,
        dataType: FLOW_DATA_TYPE.BOOLEAN.value
    });
}

export function baseCanvasElementsArrayToMap(elementList = [], connectors = []) {
    const elements = baseElementsArrayToMap(elementList);
    return Object.assign(elements, {
        connectors
    });
}

export function baseElementsArrayToMap(elementList = []) {
    const elements = elementList.reduce((acc, element) => {
        return Object.assign(acc, { [element.guid]: element });
    }, {});
    return {
        elements
    };
}

export function baseElement(element = {}) {
    const { guid = generateGuid(), name = '' } = element;
    return {
        guid,
        name
    };
}

export const automaticOutputHandlingSupport = () => {
    const processType = Store.getStore().getCurrentState().properties.processType;
    const processTypeAutomaticOutPutHandlingSupport = getProcessTypeAutomaticOutPutHandlingSupport(processType);
    return processTypeAutomaticOutPutHandlingSupport !== FLOW_AUTOMATIC_OUTPUT_HANDLING.UNSUPPORTED;
};
