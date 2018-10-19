import { isNonElementResourceId, getNonElementResource } from "builder_platform_interaction/systemLib";
import { sanitizeGuid } from "builder_platform_interaction/dataMutationLib";
import {
    mutateFieldToComboboxShape,
    mutateFlowResourceToComboboxShape,
} from './menuDataGenerator';
import * as sobjectLib from "builder_platform_interaction/sobjectLib";
import { getElementByGuid } from "builder_platform_interaction/storeUtils";
import { elementToParam } from "builder_platform_interaction/ruleLib";
import { FEROV_DATA_TYPE } from "builder_platform_interaction/dataTypeLib";
import { isObject } from 'builder_platform_interaction/commonUtils';

export const EXPRESSION_PROPERTY_TYPE = {
    LEFT_HAND_SIDE: 'leftHandSide',
    OPERATOR: 'operator',
    RIGHT_HAND_SIDE: 'rightHandSide',
    RIGHT_HAND_SIDE_DATA_TYPE: 'rightHandSideDataType',
};

export const OPERATOR_DISPLAY_OPTION = {
    COMBOBOX: 'combobox',
    RIGHT_ARROW: 'utility:forward',
    LEFT_ARROW: 'utility:back',
    NONE: 'none',
};

/**
 * The LHS of an expression builder is either a merge field that is not a field,
 * a field on a variable like {!sobjectVar.fieldName}, or a standalone field, "AccountNumber"
 * @type {{NOT_FIELD: string, FIELD_ON_VARIABLE: string, SOBJECT_FIELD: string}}
 */
export const LHS_DISPLAY_OPTION = {
    NOT_FIELD: 'notField',
    FIELD_ON_VARIABLE: 'fieldOnVariable',
    SOBJECT_FIELD: 'sobjectField',
};

/**
 * Extract out value from the event or item if payload is from combobox
 * Ex: If a select happened it will have an item as payload
 * Ex: if a literal is typed then the event will not have an item, just a display text
 * @param {Object} event Event for the data type
 * @return {Object|String} value of the event payload
 */
export const getItemOrDisplayText = (event) => {
    // if it is a combobox value changed event we have two cases: literals or item select
    return event.detail.item || event.detail.displayText;
};

/**
 * Retrieves element or global constant
 *
 * @param {String} identifier    unique identifier that can be used to retrieve the flow resource
 * @return {Object|undefined}    element or resource if the identifier is valid, otherwise undefined
 */
export const getResourceByUniqueIdentifier = (identifier) => {
    return getElementByGuid(identifier) || getNonElementResource(identifier);
};

/**
 * Gets the data type to determine how this value should be stored in a FEROV
 *
 * @param {String} identifier    unique identifier that can be used to retrieve the flow resource
 * @returns {FEROV_DATA_TYPE}    the dataType category this value belongs to
 */
export const getResourceFerovDataType = (identifier) => {
    return isNonElementResourceId(identifier) ? getNonElementResource(identifier).dataType : FEROV_DATA_TYPE.REFERENCE;
};

/**
 * Retrieves the information needed for components to update a ferov from a combobox state changed payload
 * @param {module:MenuDataGenerator.MenuItem} item combobox menu item
 * @param {String} displayText display text from a combobox state changed event
 * @param {String} literalDataType the data type we want to assign a literal
 * @returns {Object} object with value and dataType of the ferov
 */
export const getFerovInfoFromComboboxItem = (item, displayText, literalDataType) => {
    const itemOrDisplayText = item || displayText;
    let value = null;
    let dataType = null;
    if (isObject(itemOrDisplayText)) {
        value = itemOrDisplayText.displayText;
        dataType = getResourceFerovDataType(itemOrDisplayText.value);
    } else {
        value = itemOrDisplayText;
        dataType = literalDataType;
    }
    return {
        value,
        dataType,
    };
};

/**
 * Returns the combobox display value based on the unique identifier passed
 * to the RHS.
 * @param {String} rhsIdentifier    used to identify RHS, could be GUID or literal
 * @returns {Promise}               Promise that resolves with combobox display value
 */
export const normalizeRHS = (rhsIdentifier) => {
    const rhs = {};
    const complexGuid = sanitizeGuid(rhsIdentifier);
    const flowElement = getResourceByUniqueIdentifier(complexGuid.guidOrLiteral);
    if (flowElement && complexGuid.fieldName) {
        return new Promise((resolve) => {
            // TODO: W-4960448: the field will appear empty briefly when fetching the first time
            sobjectLib.getFieldsForEntity(flowElement.objectType, (fields) => {
                rhs.itemOrDisplayText = mutateFieldToComboboxShape(fields[complexGuid.fieldName], mutateFlowResourceToComboboxShape(flowElement), true, true);
                rhs.fields = fields;
                resolve(rhs);
            });
        });
    } else if (flowElement) {
        rhs.itemOrDisplayText = mutateFlowResourceToComboboxShape(flowElement);
    } else {
        rhs.itemOrDisplayText = rhsIdentifier;
    }
    return Promise.resolve(rhs);
};

/**
 * Builds the parameter representation of a field.
 *
 * @param {String} sobject           the sobject type this field belongs to
 * @param {String} fieldName         API name of the field to be described
 * @param {function} callback        to be executed after the field is retrieved
 * @returns {Object}                 the parameter representation of this field, to be used with the rules service
 */
export const getFieldParamRepresentation = (sobject, fieldName, callback) => {
    let fieldParam;
    sobjectLib.getFieldsForEntity(sobject, (fields) => {
        const field = fields[fieldName];
        field.isCollection = false;
        fieldParam = elementToParam(field);
        if (callback) {
            callback(field);
        }
    });
    return fieldParam;
};

/**
 * The shape an expression builder needs to operator on any LHS.
 * @typedef {Object} normalizedLHS
 * @param {MenuItem} item     what the combobox needs to display this lhs
 * @param {rules/param} param       the param representation of this lhs object/element
 */

/**
 * @typedef lhsDescribe                    the needed values to represent a field value for the LHS of an expression
 * @param {Object} value                   the combobox item to represent the LHS
 * @param {String[]} activePicklistValues  if the LHS is a picklist field, these are the possible values
 * @param {rules/param} param              the parameterized version of the LHS, to be used with the rules
 * @param {Object[]} fields                fields that should be shown in the menuData
 * @param {String} displayOption           from LHS_DISPLAY_OPTION
 */

/**
 * @typedef rhsDescribe      the needed values to represent a value on the RHS of an expression
 * @param {Object} value     the combobox item to represent the RHS
 * @param {String} guid      the GUID of the RHS
 * @param {String} error     the validation error to show the user
 * @param {Boolean} isField  true if this value is a field
 * @param {Object[]} fields  if the menudata shown should be fields, this is the list of fields
 */

/**
 * Populates the state values on an expression builder wrapper to represent the LHS, when the LHS is a field.
 *
 * @param {String} fields             the fields for the lhs menudata
 * @param {String|undefined} fieldName    the api name of the currently selected field, if a field is already selected
 * @param {Object|undefined} fieldParent  the object representing the parent of the currectly selected field, if a field is already selected
 * @param {Boolean} isFieldOnSobjectVar   true if this field should be displayed in a mergefield relative to an sobject variable, false if it should be displayed alone
 * @returns {lhsDescribe}                      describes the attributes needed for the expression builder
 */
export const populateLhsStateForField =  (fields, fieldName, fieldParent, isFieldOnSobjectVar) => {
    const lhsState = {
        fields,
    };
    const field = fields[fieldName];
    if (field) {
        lhsState.value = mutateFieldToComboboxShape(field, fieldParent, isFieldOnSobjectVar, isFieldOnSobjectVar);
        lhsState.activePicklistValues = field.activePicklistValues || false;
        lhsState.param = elementToParam(field);
    }
    return lhsState;
};

/**
 * Populates the state values on an expression builder wrapper that represent the RHS of the expression.
 *
 * @param {Object} expression   rightHandSide - the display value of the rhs
 *                              rightHandSideDataType - the data type of the rhs
 * @param {rhsDescribe} callback   function to be called with the initialized state values
 */
export const populateRhsState = ({ rightHandSide, rightHandSideDataType }, callback) => {
    const rhsState = {
        isField: false,
        fields: null,
        error: rightHandSide.error,
        value: rightHandSide.value,
    };

    if (!rightHandSide.error && rightHandSideDataType) {
        const complexGuid = sanitizeGuid(rightHandSide.value);
        const fer = getResourceByUniqueIdentifier(complexGuid.guidOrLiteral);

        if (fer) {
            const rhsItem = mutateFlowResourceToComboboxShape(fer);
            rhsState.value = rhsItem;
            if (complexGuid.fieldName) {
                const isFieldOnSobjectVar = true;
                sobjectLib.getFieldsForEntity(fer.objectType, (fields) => {
                    rhsState.isField = true;
                    rhsState.value = mutateFieldToComboboxShape(fields[complexGuid.fieldName], rhsItem, isFieldOnSobjectVar, isFieldOnSobjectVar);
                    rhsState.fields = fields;
                    callback(rhsState);
                });
                return;
            }
        }
    }
    callback(rhsState);
};
