import {
    filterAndMutateMenuData,
    filterFieldsForChosenElement,
    getStoreElements,
    getChildrenItems
} from './menuDataRetrieval';

const getFieldMenuData = (
    elementConfig,
    populateParamTypesFn,
    parentItem,
    entityFields
) => {
    const showAsFieldReference = true;
    const showSubText = true;

    const allowedParamTypes = populateParamTypesFn();
    if (entityFields) {
        return Promise.resolve(
            filterFieldsForChosenElement(parentItem, entityFields, {
                allowedParamTypes,
                showAsFieldReference,
                showSubText
            })
        );
    }
    return getChildrenItems(elementConfig, parentItem).then(fields =>
        filterFieldsForChosenElement(parentItem, fields, {
            allowedParamTypes,
            showAsFieldReference,
            showSubText
        })
    );
};

const getFerovMenuData = (
    elementConfig,
    propertyEditorElementType,
    populateParamTypesFn,
    allowSobjectForFields,
    enableFieldDrilldown,
    storeInstance,
    includeNewResource,
    showSystemVariables,
    showGlobalVariables
) => {
    const menuDataElements = getStoreElements(
        storeInstance.getCurrentState(),
        elementConfig || { elementType: propertyEditorElementType }
    );

    return filterAndMutateMenuData(
        menuDataElements,
        populateParamTypesFn(),
        includeNewResource,
        allowSobjectForFields,
        !enableFieldDrilldown,
        null,
        showSystemVariables,
        showGlobalVariables
    );
};

/**
 * Populate menu data
 *
 * @param {Object} elementConfig    element config
 * @param {String} propertyEditorElementType    property editor element type
 * @param {String} populateParamTypesFn    the resource picker's function to populate paramTypes
 * @param {boolean} allowSobjectForFields    whether to show sobjects in menudata to allow users to select fields
 * @param {boolean} enableFieldDrilldown    whether to set hasNext to false for all menu items
 * @param {Object} storeInstance    instance of the store
 * @param {Object} includeNewResource    whether to show the "New Resource" option
 * @param {Object|undefined} parentItem    parent item
 * @param {Array} fields fields to be populated if parentItem is defined
 * @returns {Item[]} Array of resources
 */
export const getMenuData = (
    elementConfig,
    propertyEditorElementType,
    populateParamTypesFn,
    allowSobjectForFields,
    enableFieldDrilldown,
    storeInstance,
    includeNewResource,
    parentItem,
    fields,
    showSystemVariables = true,
    showGlobalVariables = false
) => {
    if (parentItem) {
        return getFieldMenuData(
            elementConfig,
            populateParamTypesFn,
            parentItem,
            fields
        );
    }
    return Promise.resolve(
        getFerovMenuData(
            elementConfig,
            propertyEditorElementType,
            populateParamTypesFn,
            allowSobjectForFields,
            enableFieldDrilldown,
            storeInstance,
            includeNewResource,
            showSystemVariables,
            showGlobalVariables
        )
    );
};
