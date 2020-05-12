// @ts-nocheck
import { baseResource } from './baseElement';
import { baseResourceMetadataObject } from './baseMetadata';
import { createPicklistChoiceSetForStore } from '../picklistChoiceSet';
import { createRecordChoiceSetForStore } from '../recordChoiceSet';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import { SORT_ORDER } from 'builder_platform_interaction/recordEditorLib';

/**
 * Base dynamic choice element factory
 * @param {Object} element - base dynamic choice element
 * @returns {Object} dynamicChoiceSet
 */
export const createDynamicChoiceSet = (element = {}) => {
    const newDynamicChoiceSet = baseResource(element);
    const { displayField, valueField = null, dataType, sortOrder = SORT_ORDER.NOT_SORTED } = element;
    // We need to set the limit as undefined if it comes out to be zero. valid range for limit is >0 and <200
    let { limit } = element;
    if (limit === 0 || limit === undefined) {
        limit = '';
    } else if (typeof limit === 'number') {
        limit = limit.toString();
    }
    return Object.assign(newDynamicChoiceSet, {
        limit,
        displayField,
        valueField,
        dataType,
        sortOrder
    });
};

/**
 * Base dynamic choice meta data object factory
 * @param {Object} element - Base dynamic choice metadata object
 * @returns {Object} dynamicChoiceSetMetadataObject
 */
export const createDynamicChoiceSetMetadataObject = element => {
    if (!element) {
        throw new Error('element is required to create dynamic choice set metadata object');
    }
    const newDynamicChoiceSet = baseResourceMetadataObject(element);
    const { displayField, dataType } = element;
    let { sortOrder, limit, valueField } = element;
    if (limit === '') {
        limit = undefined;
    }
    if (sortOrder === SORT_ORDER.NOT_SORTED) {
        sortOrder = undefined;
    }
    if (valueField === '') {
        valueField = undefined;
    }
    Object.assign(newDynamicChoiceSet, {
        limit,
        displayField,
        valueField,
        dataType,
        sortOrder
    });
    return newDynamicChoiceSet;
};

/**
 * This function is called by flowToUiTranslator for convert dynamic choice set metadata into correct shape and element type.
 * It used data type property of dynamic choice set to identify element type
 * @param {Object} element dynamic choice set metadata object
 * @return {Object} new element in shape expected by store
 */
export function dynamicChoiceSetForStore(element) {
    const dataType = element.dataType;
    switch (dataType) {
        case FLOW_DATA_TYPE.PICKLIST.value:
        case FLOW_DATA_TYPE.MULTI_PICKLIST.value:
            return createPicklistChoiceSetForStore(element);
        default:
            return createRecordChoiceSetForStore(element);
    }
}
