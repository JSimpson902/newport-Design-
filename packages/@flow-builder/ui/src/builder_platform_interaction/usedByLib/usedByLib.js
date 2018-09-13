import { TEMPLATE_FIELDS, REFERENCE_FIELDS, EXPRESSION_RE, ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { Store, isPlainObject } from 'builder_platform_interaction/storeLib';
import { getConfigForElementType } from 'builder_platform_interaction/elementConfig';
import { addItem, getValueFromHydratedItem, dehydrate } from 'builder_platform_interaction/dataMutationLib';
import { format } from 'builder_platform_interaction/commonUtils';
import { LABELS } from './usedByLibLabels';
import { invokeModal } from 'builder_platform_interaction/builderUtils';

/**
 * This function return list of elements which are referencing elements in the elementGuids array.
 * @param {String[]} elementGuids list of guids to be matched
 * @param {Object} elements list of elements in the store by default or a custom list of elements passed in to the function
 * @param {String[]} listOfGuidsToSkip while creating used by element list. Example Usage: In case of an outcome (or any secondary level element), it might need to pass the parent guid (decision) in this list.
 * @returns {Object[]} usedByElements list of elements which contains elementGuids
 */
export function usedBy(elementGuids = [], elements = Store.getStore().getCurrentState().elements, listOfGuidsToSkip = []) {
    const updatedElementGuids = insertChildReferences(elementGuids, elements) || [];
    const elementsKeys = Object.keys(elements);

    const usedByElements = elementsKeys && elementsKeys.filter(element => !listOfGuidsToSkip.includes(element)).reduce((acc, key) => {
        if (!updatedElementGuids.includes(key)) {
            const elementGuidsReferenced = findReference(updatedElementGuids, elements[key]);
            if (elementGuidsReferenced.size > 0) {
                const usedByElement = createUsedByElement({
                    element: elements[key],
                    elementGuidsReferenced: [...elementGuidsReferenced]
                });
                return [...acc, usedByElement];
            }
        }
        return acc;
    }, []);
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
    let bodyTextOne = LABELS.deleteAlertMultiDeleteBodyTextOne;
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
        headerTitle = format(LABELS.deleteAlertSingleDeleteHeaderTitle, elementType.toLowerCase());
        bodyTextOne = format(LABELS.deleteAlertSingleDeleteBodyTextOne, elementType.toLowerCase());
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
        if (element.elementType === ELEMENT_TYPE.DECISION) {
            const outcomeReferences = element.outcomeReferences.map(({outcomeReference}) => {
                return outcomeReference;
            });
            acc = [...acc, ...outcomeReferences];
        } else if (element.elementType === ELEMENT_TYPE.WAIT) {
            // TODO: update once wait element is added: W-5139646
        } else if (element.elementType === ELEMENT_TYPE.SCREEN) {
            // TODO: update once screen element is normalized in the store: W-5139658
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
            if (typeof (value) === 'string') {
                const newElementGuidsReferenced = matchElement(elementGuids, key, value);
                updateElementGuidsReferenced(elementGuidsReferenced, newElementGuidsReferenced);
            } else if (typeof (value) !== 'number') {
                findReference(elementGuids, value, elementGuidsReferenced);
            }
        }
    }
    return elementGuidsReferenced;
}

/**
 * This function checks if the elementGuid is present or not
 * @param {String[]} elementGuids list of elements to be matched
 * @param {String} key key of the object
 * @param {String} value value of the object
 * @returns {Boolean} true if elementGuids is matched
 */
function matchElement(elementGuids, key, value) {
    if (key && REFERENCE_FIELDS.has(key)) {
        const guid = value.split('.')[0];
        return elementGuids && elementGuids.filter((elementGuid) => guid === elementGuid);
    } else if (key && TEMPLATE_FIELDS.has(key)) {
        // For eg: value = 'Hello world, {!var_1.name}'
        // After match, occurrences = ['{!var_1.name}']
        // After slice and split, occurences = ['var_1']
        const occurences = value.match(EXPRESSION_RE);
        if (occurences) {
            return occurences.map((occurence) => occurence.slice(2, occurence.length - 1).split('.')[0])
                .filter((guid) => elementGuids.includes(guid));
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
function createUsedByElement({element, elementGuidsReferenced}) {
    const elementConfig = getConfigForElementType(element.elementType);
    const guid = element.guid;
    const label = element.label;
    const name = element.name;
    let iconName;
    if (elementConfig && elementConfig.nodeConfig && elementConfig.nodeConfig.iconName) {
        iconName = elementConfig.nodeConfig.iconName;
    }

    return {
        guid,
        label,
        name,
        elementGuidsReferenced,
        iconName
    };
}