import {
    FLOW_DATA_TYPE,
    getDataTypeLabel,
    getDataTypeIcons,
} from "builder_platform_interaction/dataTypeLib";
import { isNonElementResourceId, SYSTEM_VARIABLE_PREFIX, getGlobalVariableTypes } from "builder_platform_interaction/systemLib";
import { getElementCategory } from "builder_platform_interaction/elementConfig";
import { addCurlyBraces } from 'builder_platform_interaction/commonUtils';
import systemGlobalVariableCategoryLabel from '@salesforce/label/FlowBuilderSystemGlobalVariables.systemGlobalVariableCategory';

const SOBJECT_TYPE = FLOW_DATA_TYPE.SOBJECT.value;
const ICON_TYPE = 'utility';
const RIGHT_ICON_NAME = 'utility:chevronright';
const ICON_SIZE = 'xx-small';

export const COMBOBOX_ITEM_DISPLAY_TYPE = {
    OPTION_CARD: 'option-card',
    OPTION_INLINE: 'option-inline'
};


/**
 * The subtext of a row varies a bit. This function captures those rules.
 * This will also probably use a label service eventually.
 *
 * @param {String} dataType  datatype of an element
 * @param {String} objectType  object type of an element, if exists
 * @param {String} label  the label of an element, if exists
 * @returns {String} the subtext to display in a combobox row
 */
function getSubText(dataType, objectType, label) {
    let subText = '';
    if (dataType === SOBJECT_TYPE) {
        subText = objectType;
    } else if (label) {
        subText = label;
    } else if (dataType) {
        subText = getDataTypeLabel(dataType);
    }
    return subText;
}

/**
 * An object that represents one option in the combobox menu dropdown
 * @typedef {Object} MenuItem
 * @property {String} type  the type of menu data display type ex: option-inline
 * @property {String} text  the text that will be displayed by the combobox (can be highlighted)
 * @property {String} subText the subtext that will displayed below the text
 * @property {String} displayText   the value displayed in the input field when this menu item is selected
 * @property {String} iconName  the icon that will be displayed next to the menu item in a dropdown list
 * @property {String} value the id or api name of the value stored by the flow combobox. This is what we want to put in store/events
 * @property {Object} parent in the case that this is a second level item, this is the parent flow element in combobox shape
 * @property {String} dataType the data type for the menu item. eg: Date, Currency, SObject
 * @property {String} objectType the object type when data type is SObject otherwise null. eg: Account
 */

/**
 * An object that contains a list of menu items with an optional header
 * @typedef {Object} GroupedMenuItems
 * @property {String} label    an optional header/category for the list of items that will be displayed
 * @property {MenuItem[]} items    list of menu items in order that they will be displayed
 */

/**
 * The menu data that will be displayed in a flow combobox, it contains a list of GroupedMenuItems
 * @typedef {GroupedMenuItems[]} MenuData
 */

/**
 * Create one menu item
 * @param {String} type the type of the menu item
 * @param {String} text the text of the menu item
 * @param {String} subText  the subtext of the menu item
 * @param {String} displayText the display text of the menu item
 * @param {String} iconName the icon of the menu item
 * @param {String} value the value of the menu item
 * @param {Object} parent the parent flow element of the second level item in combobox shape
 * @param {String} dataType the data type for the menu item. eg: Date, Currency, SObject
 * @param {String} objectType the object type when data type is SObject otherwise null. eg: Account
 * @returns {MenuItem}  the generated menu item
 */
export const createMenuItem = (type, text, subText, displayText, iconName, value, parent, dataType, objectType) => {
    return {
        type,
        text,
        subText,
        displayText,
        iconName,
        iconSize: ICON_SIZE,
        value,
        parent,
        dataType,
        objectType
    };
};

/**
 * Makes copy of server data fields of parent objects(SObjects, Globa/System Variables) with fields as needed by combobox
 *
 * @param {Object} field Field to be copied
 * @param {Object} [parent] Parent object if field is a second level item
 * @param {boolean} showAsFieldReference true to show the display text as field reference on record variable, otherwise show the field's apiName
 * @param {boolean} showSubText true to show the sub text
 * @returns {MenuItem} Representation of flow element in shape combobox needs
 */
export function mutateFieldToComboboxShape(field, parent, showAsFieldReference, showSubText) {
    const formattedField = {
        iconSize: ICON_SIZE
    };
    if (parent && showAsFieldReference) {
        formattedField.parent = parent;
    }

    // support for parameter items being converted to field shape
    const apiName = field.apiName || field.qualifiedApiName;

    const label = field.label || apiName;
    formattedField.text = apiName;
    formattedField.subText = (showSubText) ? label : '';
    formattedField.value = (parent) ? (parent.value + '.' + apiName) : apiName;
    formattedField.displayText = (showAsFieldReference && parent) ?
        (parent.displayText.substring(0, parent.displayText.length - 1) + '.' + apiName + '}') : apiName;
    formattedField.type = COMBOBOX_ITEM_DISPLAY_TYPE.OPTION_CARD;
    formattedField.iconName = getDataTypeIcons(field.dataType, ICON_TYPE);

    return formattedField;
}

/**
 * Makes copy of a Flow Element with fields as needed by combobox
 *
 * @param {Object} resource   element from flow
 * @returns {Object}         representation of flow element in shape combobox needs
 */
export function mutateFlowResourceToComboboxShape(resource) {
    const newElement = {
        iconSize: ICON_SIZE
    };
    const isNonElement = isNonElementResourceId(resource.guid);
    const resourceLabel = resource.type ? resource.type.label : resource.label;
    const resourceIcon = resource.type ? resource.type.icon : resource.iconName;
    // some screen fields do not have data type and we need to get them from the type object
    const resourceDataType = resource.dataType || (resource.type && resource.type.type);

    newElement.text = resource.name;
    newElement.subText = isNonElement ? resource.description : getSubText(resourceDataType, resource.objectType, resourceLabel);
    newElement.value = resource.guid;
    newElement.displayText = '{!' + resource.name + '}';
    newElement.hasNext = resourceDataType === SOBJECT_TYPE && !resource.isCollection;
    newElement.category = resource.category || getElementCategory(resource.elementType, resourceDataType, resource.isCollection).toUpperCase();
    newElement.iconName = resourceIcon || getDataTypeIcons(resourceDataType, ICON_TYPE);
    newElement.type = COMBOBOX_ITEM_DISPLAY_TYPE.OPTION_CARD;
    newElement.dataType = resourceDataType;
    newElement.objectType = resource.objectType || null;
    if (newElement.hasNext) {
        newElement.rightIconName = RIGHT_ICON_NAME;
        newElement.rightIconSize = ICON_SIZE;
    }
    return newElement;
}

/**
 * Creates a new array of combobx menu data from an existing array of entities taken from the service
 * @param {Array} entities the array of entities that you want to mutate into comboobx shape
 * @returns {MenuData} combobox menu data for the given entities
 */
export const mutateEntitiesToComboboxShape = (entities) => {
    return entities.map(entity => {
        return createMenuItem(
            COMBOBOX_ITEM_DISPLAY_TYPE.OPTION_CARD,
            entity.entityLabel || entity.apiName,
            entity.apiName,
            entity.entityLabel || entity.apiName,
            undefined,
            entity.apiName,
            undefined,
            SOBJECT_TYPE,
            entity.apiName,
        );
    });
};

/**
 * Mutates one picklist value into a combobox menu item
 * @param {Object} picklistValue object that is a picklist value
 * @returns {MenuItem} menu item representing the picklist value
 */
export const mutatePicklistValue = (picklistValue) => {
    return createMenuItem(
        COMBOBOX_ITEM_DISPLAY_TYPE.OPTION_CARD,
        picklistValue.label,
        FLOW_DATA_TYPE.STRING.label,
        picklistValue.label,
        getDataTypeIcons(FLOW_DATA_TYPE.STRING.value, ICON_TYPE),
        picklistValue.value,
    );
};

/**
 * Creates a new array of combobx menu data from an existing array of event types taken from the service
 * @param {Array} eventTypes the array of event types that you want to mutate into comboobx shape
 * @returns {MenuData} combobox menu data for the given event types
 */
export const mutateEventTypesToComboboxShape = (eventTypes) => {
    return eventTypes.map(eventType => {
        return createMenuItem(
            COMBOBOX_ITEM_DISPLAY_TYPE.OPTION_CARD,
            eventType.label || eventType.qualifiedApiName,
            eventType.qualifiedApiName,
            eventType.label || eventType.qualifiedApiName,
            undefined,
            eventType.qualifiedApiName,
            undefined,
            SOBJECT_TYPE,
            eventType.qualifiedApiName,
        );
    });
};

const mutateSystemAndGlobalVariablesToComboboxShape = (value) => {
    return {
        value,
        objectType: value,
        text: value,
        displayText: addCurlyBraces(value),
        type: COMBOBOX_ITEM_DISPLAY_TYPE.OPTION_CARD,
        hasNext: true,
        iconName: ICON_TYPE + ':system_and_global_variable',
        iconSize: ICON_SIZE,
        rightIconName: RIGHT_ICON_NAME,
        rightIconSize: ICON_SIZE,
    };
};

const getGlobalVariableTypeComboboxItems = () => {
    const globalVariableTypes = getGlobalVariableTypes();
    const typeMenuData = [];

    Object.keys(globalVariableTypes).forEach((type) => {
        const globalVariable = globalVariableTypes[type];
        typeMenuData.push(mutateSystemAndGlobalVariablesToComboboxShape(globalVariable.name));
    });

    return typeMenuData;
};

export const getFlowSystemVariableComboboxItem = () => {
    return mutateSystemAndGlobalVariablesToComboboxShape(SYSTEM_VARIABLE_PREFIX);
};

export const getSystemAndGlobalVariableMenuData = (showSystemVariables, showGlobalVariables) => {
    const categories = [];
    if (showSystemVariables) {
        categories.push(getFlowSystemVariableComboboxItem());
    }
    if (showGlobalVariables) {
        categories.push(...getGlobalVariableTypeComboboxItems());
    }
    categories.sort((a, b) => {
        return a.displayText - b.displayText;
    });
    const globalVariableCategory = {
        label: systemGlobalVariableCategoryLabel,
        items: categories,
    };

    return globalVariableCategory;
};
