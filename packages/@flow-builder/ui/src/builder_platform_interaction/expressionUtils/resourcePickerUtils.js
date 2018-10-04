import {
    filterAndMutateMenuData,
    filterFieldsForChosenElement,
    getStoreElements,
} from './menuDataRetrieval';
import { getFieldsForEntity } from 'builder_platform_interaction/sobjectLib';

const getFieldMenuData = (elementConfig, populateParamTypesFn, parentItem, entityFields) => {
    const showAsFieldReference = true;
    const showSubText = true;
    let menuData;

    const allowedParamTypes = populateParamTypesFn();
    if (entityFields) {
        menuData = filterFieldsForChosenElement(parentItem, allowedParamTypes, entityFields, showAsFieldReference, showSubText);
    } else {
        // when handling fetch menu data (user selects new sobject) we will not have the fields yet
        const entityName = parentItem.objectType;
        getFieldsForEntity(entityName, (fields) => {
            menuData = filterFieldsForChosenElement(parentItem, allowedParamTypes, fields, showAsFieldReference, showSubText);
        });
    }
    return menuData;
};

const getFerovMenuData = (elementConfig, propertyEditorElementType, populateParamTypesFn, allowSobjectForFields,
    disableFieldDrilldown, storeInstance, includeNewResource) => {
    const menuDataElements = getStoreElements(storeInstance.getCurrentState(),
        elementConfig || { elementType: propertyEditorElementType });

    return filterAndMutateMenuData(menuDataElements, populateParamTypesFn(), includeNewResource,
        allowSobjectForFields, disableFieldDrilldown);
};

/**
 * Populate menu data
 *
 * @param {Object} elementConfig    element config
 * @param {String} propertyEditorElementType    property editor element type
 * @param {String} populateParamTypesFn    the resource picker's function to populate paramTypes
 * @param {boolean} allowSobjectForFields    whether to show sobjects in menudata to allow users to select fields
 * @param {boolean} disableFieldDrilldown    whether to set hasNext to false for all menu items
 * @param {Object} storeInstance    instance of the store
 * @param {Object} includeNewResource    whether to show the "New Resource" option
 * @param {Object|undefined} parentItem    parent item
 * @param {Array} fields fields to be populated if parentItem is defined
 * @returns {Array} array of resources
 */
export const getMenuData = (elementConfig, propertyEditorElementType, populateParamTypesFn, allowSobjectForFields,
    disableFieldDrilldown, storeInstance, includeNewResource, parentItem, fields) => {
    let menuData;
    if (parentItem) {
        menuData = getFieldMenuData(elementConfig, populateParamTypesFn, parentItem, fields);
    } else {
        menuData = getFerovMenuData(elementConfig, propertyEditorElementType, populateParamTypesFn, allowSobjectForFields,
            disableFieldDrilldown, storeInstance, includeNewResource);
    }
    return menuData;
};
