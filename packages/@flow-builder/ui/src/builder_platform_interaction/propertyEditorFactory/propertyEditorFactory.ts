// @ts-nocheck
import { dehydrate, hydrateWithErrors } from 'builder_platform_interaction/dataMutationLib';
import { getConfigForElement } from 'builder_platform_interaction/elementConfig';
import { deepCopy, Store } from 'builder_platform_interaction/storeLib';
import { swapDevNamesToGuids, swapUidsForDevNames } from 'builder_platform_interaction/translatorLib';

/**
 * This function create element using factory, does UID to devname swapping for template fields and hydrate the element
 *
 * @param {Object} element existing element or just element type to call correct factory
 * @returns {Object} newElement in shape required by property editor
 */
export function getElementForPropertyEditor(element = {}) {
    const { elementType } = element;
    if (!elementType) {
        throw new Error('ElementType is not defined for creation of resource element');
    }
    const { factory } = getConfigForElement(element);
    const { propertyEditor } = factory;
    if (!propertyEditor) {
        throw new Error('property editor factory is not defined to create new element');
    }

    const newElement = propertyEditor(element);
    // Find a better way to do this and don't couple store with this library
    const elements = Store.getStore().getCurrentState().elements;
    swapUidsForDevNames(elements, newElement, {
        enableGuidToDevnameSwappingForReferenceFields: false
    });
    return getElementAfterHydratingWithError(newElement);
}

/**
 * This function dehydrate the element, create element using factory, does UID to devname swapping
 *
 * @param {Object} element existing element
 * @returns {Object} newElement in shape required by store
 */

/**
 * @param element
 */
export function getElementForStore(element) {
    if (!element) {
        throw new Error('Element is not defined');
    }
    const { elementType } = element;
    if (!elementType) {
        throw new Error('ElementType is not defined for creation of resource element');
    }
    // TODO: REMOVE THIS DEEP COPY ASAP W-5501173
    const elementAfterDehydrateAndUnwrap = dehydrate(deepCopy(element));
    const { factory } = getConfigForElement(element);
    const { initialization, propertyEditor, closePropertyEditor } = factory;
    let newElement;
    if (initialization && element.guid === undefined) {
        newElement = initialization(elementAfterDehydrateAndUnwrap);
    } else if (closePropertyEditor) {
        newElement = closePropertyEditor(elementAfterDehydrateAndUnwrap);
    } else if (propertyEditor) {
        newElement = propertyEditor(elementAfterDehydrateAndUnwrap);
    } else {
        throw new Error('property editor factory is not defined to create new element');
    }
    const elements = Store.getStore().getCurrentState().elements;
    swapDevNamesToGuids(elements, newElement);
    return newElement;
}

/**
 * Helper function to get non hydratable properties and hydrate an element with errors
 *
 * @param {Object} element existing element
 * @returns {Object} new Element with errors
 */
function getElementAfterHydratingWithError(element) {
    if (!element) {
        throw new Error('element is not defined to be hydrated');
    }
    const { nonHydratableProperties } = getConfigForElement(element);
    return hydrateWithErrors(element, nonHydratableProperties || []);
}
