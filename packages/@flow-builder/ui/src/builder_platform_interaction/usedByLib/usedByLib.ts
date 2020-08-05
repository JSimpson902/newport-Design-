// @ts-nocheck
import { EXPRESSION_RE, ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { Store, isPlainObject } from 'builder_platform_interaction/storeLib';
import { getConfigForElementType } from 'builder_platform_interaction/elementConfig';
import {
    addItem,
    getValueFromHydratedItem,
    dehydrate,
    unionOfArrays
} from 'builder_platform_interaction/dataMutationLib';
import { format, splitStringBySeparator } from 'builder_platform_interaction/commonUtils';
import { LABELS } from './usedByLibLabels';
import { invokeModal } from 'builder_platform_interaction/builderUtils';
import { isTemplateField, isReferenceField, shouldCallSwapFunction } from 'builder_platform_interaction/translatorLib';

let mapOfChildElements = {};

/**
 * This function return list of elements which are referencing elements in the elementGuids array.
 * @param {String[]} elementGuids list of guids to be matched
 * @param {Object} elements list of elements in the store by default or a custom list of elements passed in to the function
 * @param {String[]} listOfGuidsToSkip while creating used by element list. Example Usage: In case of an outcome (or any secondary level element), it might need to pass the parent guid (decision) in this list.
 * @param {Object} flowProps object in the store containing all the current flow properties
 * @returns {Object[]} usedByElements list of elements which contains elementGuids
 */
export function usedBy(
    elementGuids = [],
    elements = Store.getStore().getCurrentState().elements,
    listOfGuidsToSkip = [],
    flowProps = Store.getStore().getCurrentState().properties
) {
    const updatedElementGuids = insertChildReferences(elementGuids, elements) || [];
    const elementsKeys = Object.keys(elements);

    let usedByElements =
        elementsKeys &&
        elementsKeys
            .filter((element) => !listOfGuidsToSkip.includes(element))
            .reduce((acc, key) => {
                if (!updatedElementGuids.includes(key)) {
                    const element = elements[key];
                    // This can be moved into a helper function later to check the elements with special rules
                    // that only find the references based on certain keys (e.g cfv for screen section)
                    if (element && element.fieldType !== 'RegionContainer' && element.fieldType !== 'Region') {
                        const elementGuidsReferenced = findReference(updatedElementGuids, element);
                        if (elementGuidsReferenced && elementGuidsReferenced.size > 0) {
                            const usedByElement = createUsedByElement({
                                element,
                                elementGuidsReferenced: [...elementGuidsReferenced]
                            });
                            return [...acc, usedByElement];
                        }
                    }
                }
                return acc;
            }, []);
    if (flowProps) {
        const elementGuidsReferencedByFlowProps = findReference(updatedElementGuids, flowProps);
        if (elementGuidsReferencedByFlowProps && elementGuidsReferencedByFlowProps.size > 0) {
            const label = LABELS.interviewLabelLabel;
            const elementType = ELEMENT_TYPE.FLOW_PROPERTIES;
            const flowPropsElement = {
                elementType,
                guid: elementType,
                label,
                name: label
            };
            const usedByElement = createUsedByElement({
                element: flowPropsElement,
                elementGuidsReferenced: [...elementGuidsReferencedByFlowProps]
            });
            usedByElements = [...usedByElements, usedByElement];
        }
    }
    return usedByElements;
}

/**
 * Helper method to invoke the alert modal
 *
 * @param {String[]} usedByElements - List of elements which are referencing elements in the elementGuidsToBeDeleted array.
 * @param {String[]} elementGuidsToBeDeleted - Contains GUIDs of all the elements to be deleted
 * @param {String} elementType - Type of the element being deleted
 * @param {Object} storeElements - Current state of elements in the store
 */
export function invokeUsedByAlertModal(usedByElements, elementGuidsToBeDeleted, elementType, storeElements = {}) {
    const elementGuidsToBeDeletedLength = elementGuidsToBeDeleted && elementGuidsToBeDeleted.length;
    let headerTitle = LABELS.deleteAlertMultiDeleteHeaderTitle;
    let bodyTextOne = LABELS.deleteAlertMultiDeleteBodyTextLabel;
    const listSectionHeader = LABELS.deleteAlertListSectionHeader;
    const listSectionItems = dehydrate(usedByElements);
    const buttonVariant = 'Brand';
    const buttonLabel = LABELS.deleteAlertOkayButtonLabel;

    if (elementGuidsToBeDeletedLength === 1) {
        // When only a single element is being deleted and either the element or it's children are being referenced in the flow
        if (!elementType) {
            const elementToBeDeleted = storeElements[elementGuidsToBeDeleted[0]];
            elementType = elementToBeDeleted && elementToBeDeleted.elementType;
        }
        const elementConfig = getConfigForElementType(elementType);
        if (elementConfig && elementConfig.labels && elementConfig.labels.singular) {
            const label = elementConfig.labels.singular.toLowerCase();
            headerTitle = format(LABELS.deleteAlertSingleDeleteHeaderTitle, label);
            bodyTextOne = format(LABELS.deleteAlertsingleDeleteBodyTextLabel, label);
        }
    }

    // Invoking the alert modal
    invokeModal({
        headerData: {
            headerTitle
        },
        bodyData: {
            bodyTextOne,
            listSectionHeader,
            listSectionItems
        },
        footerData: {
            buttonOne: {
                buttonVariant,
                buttonLabel
            }
        }
    });
}

/**
 * For a given element, find all elements which reference it, whether in the store or in a parent element's internal
 * state (i.e., outcomes in a decision, wait events in a wait). Note that the parent element will not be included in the
 * result
 *
 * @param {string} guid - guid of the element being checked for usage
 * @param {string} parentGuid - guid of the parent element.  It will not be included in the returned array
 * @param {Object[]}internalElements - array of child elements which will be checked for usage
 * @return {Object[]} Array of elements which use the specified guid.  This array will never include the parent element
 */
export function usedByStoreAndElementState(guid, parentGuid, internalElements) {
    let listOfGuidsToSkipWhenCheckingUsedByGlobally = [parentGuid];
    mapOfChildElements = internalElements.reduce((acc, element) => {
        listOfGuidsToSkipWhenCheckingUsedByGlobally = addItem(
            listOfGuidsToSkipWhenCheckingUsedByGlobally,
            element.guid
        );
        acc[element.guid] = element;
        return acc;
    }, []);

    const locallyUsedElements = usedBy(
        [guid, ...getChildElementGuids(mapOfChildElements[guid])],
        mapOfChildElements,
        undefined,
        null
    );
    const globallyUsedElements = usedBy(
        [guid, ...getChildElementGuids(mapOfChildElements[guid])],
        undefined,
        listOfGuidsToSkipWhenCheckingUsedByGlobally
    );
    return unionOfArrays(locallyUsedElements, globallyUsedElements);
}

/**
 * This function gets all the nested children element guids
 * (e.g if a section/column is deleted, will also get its children's guids)
 * @param {Object} element list of elements
 * @returns {Array} list of children element guids
 */
function getChildElementGuids(element) {
    let childElementGuids = [];
    if (element && element.fields) {
        element.fields.forEach((field) => {
            if (field && field.guid) {
                childElementGuids.push(field.guid);
            }
            childElementGuids = [...childElementGuids, ...getChildElementGuids(field)];
        });
    }
    return childElementGuids;
}

/**
 * This function add any child references(e.g outcomes, wait event, screen fields etc) in the elementGuids array
 * @param {String[]} elementGuids list of guids to be matched
 * @param {Object} elements list of elements in the store
 * @returns {Array} elementGuids updated elementGuids array
 */
function insertChildReferences(elementGuids, elements) {
    return elementGuids.reduce((acc, elementGuid) => {
        const element = elements[elementGuid];
        if (!element) {
            return acc;
        }
        const elementType = element.elementType;
        if (
            elementType === ELEMENT_TYPE.DECISION ||
            elementType === ELEMENT_TYPE.WAIT ||
            elementType === ELEMENT_TYPE.SCREEN
        ) {
            const childReferences = element.childReferences.map(({ childReference }) => {
                return childReference;
            });
            acc = [...acc, ...childReferences];
        }
        return addItem(acc, elementGuid);
    }, []);
}

/**
 * This function is called recursively to find if a list of elements are referenced in the object.
 * @param {String[]} elementGuids list of elementGuids to be matched
 * @param {Object} object object to be searched
 * @param {String[]} elementGuidsReferenced set of element guids which are being referenced in an element
 * @returns {Boolean} true if elementGuids is used in the object
 */
function findReference(elementGuids, object, elementGuidsReferenced = new Set()) {
    if (Array.isArray(object)) {
        const objectLength = object && object.length;
        for (let index = 0; index < objectLength; index += 1) {
            findReference(elementGuids, object[index], elementGuidsReferenced);
        }
    } else if (isPlainObject(object)) {
        const keys = Object.keys(object);
        const keysLength = keys && keys.length;
        for (let index = 0; index < keysLength; index += 1) {
            const key = keys[index];
            const value = getValueFromHydratedItem(object[key]);
            if (shouldCallSwapFunction(object, key, value)) {
                const newElementGuidsReferenced = matchElement(elementGuids, object, key, value);
                updateElementGuidsReferenced(elementGuidsReferenced, newElementGuidsReferenced);
            } else if (typeof value !== 'number') {
                findReference(elementGuids, value, elementGuidsReferenced);
            }
        }
    }
    return elementGuidsReferenced;
}

/**
 * This function returns the devName of the given element
 * @param {object} element Element object
 * @returns {string} Returns the devName of the element
 */
function getElementDevName(element = {}) {
    let devName = '';
    if (element && element.name) {
        devName = element.name.value || element.name;
    }
    return devName;
}

/**
 * This function returns the guid associated with any passed devName. Merge Fields, for example, contain devNames instead of the guid.
 * This is useful in finding any referenced sibling elements in an ongoing property editor session.
 * @param {String} guidOrDevName - Guid or Devname of the referenced element
 * @returns {String} returns the guid or converts the devname to it's matching guid and returns that
 */
function updateDevNameToGuid(guidOrDevName = '') {
    let childElementGuid = guidOrDevName;
    if (mapOfChildElements && Object.values(mapOfChildElements).length > 0) {
        const childElements = Object.values(mapOfChildElements);
        const childElementsLength = childElements.length;
        for (let index = 0; index < childElementsLength; index++) {
            if (getElementDevName(childElements[index]) === childElementGuid) {
                childElementGuid = childElements[index].guid;
            }
        }
    }

    return childElementGuid;
}

/**
 * This function checks if the elementGuid is present or not
 * @param {String[]} elementGuids list of elements to be matched
 * @param {String} key key of the object
 * @param {String} value value of the object
 * @returns {Boolean} true if elementGuids is matched
 */
function matchElement(elementGuids, object, key, value) {
    if (key) {
        if (isTemplateField(object, key)) {
            // For eg: value = 'Hello world, {!var_1.name}'
            // After match, occurrences = ['{!var_1.name}']
            // After slice and split, occurences = ['var_1']
            const occurences = value.match(EXPRESSION_RE);
            if (occurences) {
                return occurences
                    .map((occurence) =>
                        updateDevNameToGuid(splitStringBySeparator(occurence.slice(2, occurence.length - 1))[0])
                    )
                    .filter((guid) => elementGuids.includes(guid));
            }
        } else if (isReferenceField(object, key)) {
            const guid = splitStringBySeparator(value)[0];
            return elementGuids && elementGuids.filter((elementGuid) => guid === elementGuid);
        }
    }
    return [];
}

/**
 * This function updates elementGuidsReferenced set which is a list of unique elementGuids.
 * @param {Set} elementGuidsReferenced set of unique elementGuids
 * @param {String[]} newElementGuidsReferenced list of new elementGuids which are referenced
 * @return {Set} elementGuidsReferenced updated set of unique elementGuids
 */
function updateElementGuidsReferenced(elementGuidsReferenced, newElementGuidsReferenced) {
    const newElementGuidsReferenceLength = newElementGuidsReferenced && newElementGuidsReferenced.length;
    for (let index = 0; index < newElementGuidsReferenceLength; index++) {
        elementGuidsReferenced.add(newElementGuidsReferenced[index]);
    }
    return elementGuidsReferenced;
}

/**
 * Factory function to generate used by element.
 * @param {Object} element from the store
 * @param {Array} referencing list of element which element is referencing
 * @returns {Object} usedByElement return new object with selected properties
 */
export function createUsedByElement({ element, elementGuidsReferenced }) {
    const elementConfig = getConfigForElementType(element.elementType);
    const guid = element.guid;
    const label = element.label;
    const name = element.name;
    const isCanvasElement = (elementConfig && elementConfig.canvasElement) || false;
    let iconName;
    if (elementConfig && elementConfig.nodeConfig && elementConfig.nodeConfig.iconName) {
        iconName = elementConfig.nodeConfig.iconName;
    }

    return {
        guid,
        label,
        name,
        elementGuidsReferenced,
        iconName,
        isCanvasElement
    };
}
