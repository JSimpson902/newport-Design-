import { Element, api, track } from 'engine';
import { RowContentsChangedEvent } from 'builder_platform_interaction-events';
import { updateProperties, getValueFromHydratedItem } from 'builder_platform_interaction-data-mutation-lib';
import { EXPRESSION_PROPERTY_TYPE, getElementsForMenuData, filterMatches, normalizeLHS, isElementAllowed, normalizeRHS, filterFieldsForChosenElement, sanitizeGuid } from 'builder_platform_interaction-expression-utils';
import { getRulesForContext, getLHSTypes, getOperators, getRHSTypes, transformOperatorsForCombobox, elementToParam } from 'builder_platform_interaction-rule-lib';
import { FEROV_DATA_TYPE } from 'builder_platform_interaction-data-type-lib';
import { getElementByGuid } from 'builder_platform_interaction-store-utils';
import { getFieldsForEntity } from 'builder_platform_interaction-sobject-lib';
import { ELEMENT_TYPE } from 'builder_platform_interaction-flow-metadata';
import { isUndefinedOrNull } from 'builder_platform_interaction-common-utils';
import genericErrorMessage from '@label/FlowBuilderCombobox.genericErrorMessage';

const LHS = EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE;

const OPERATOR = EXPRESSION_PROPERTY_TYPE.OPERATOR;

const RHS = EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE;

const RHSDT = EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE_DATA_TYPE;

const RHSG = EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE_GUID;

// the element type where this expression lives
let elementType;
let rules;
let contextConfig;

/**
 * Expression Builder for Flow Builder
 *
 * @ScrumTeam Process UI
 * @author Jesenia Garcia-Rovetta
 * @since 214
 */
export default class ExpressionBuilder extends Element {
    @track
    state = {
        expression: undefined, // the expression to be displayed
        normalizedLHS: {}, // contains display, for the combobox to display, and parameter, to use with the rules service
        normalizedRHS: {}, // for the rhs combobox to display, as the rhs could be passed as a guid
        lhsMenuData: [], // the menu data being passed to lhs combobox
        operatorMenuData: undefined,
        rhsMenuData: [], // the menu data being passed to rhs combobox
        rhsTypes: null,
    };

    @track
    operatorAndRHSDisabled;

    @api
    showOperator;

    @api
    get expression() {
        return {};
    }

    /**
     * This holds all the information that describes the contents of these three comboBoxes.
     * It's expected to hold an lhs, operator, and rhs, each of which has a comboBox Value,
     * the comboBoxes menu data, and any error that should be associated with that comboBox.
     *
     * @param {Object} expression   The expression to be represented.
     */
    @api
    set expression(expression) {
        // TODO error handling? W-4755917
        // TODO handle literals, "hi my name is {!firstName}" W-4817362
        // TODO handle multi-level merge fields W-4723095
        const lhsVal = getValueFromHydratedItem(expression[LHS]);
        if (expression[LHS] && !isUndefinedOrNull(lhsVal)) {
            this.state.normalizedLHS = normalizeLHS(lhsVal, elementType, (lhsIdentifier) => {
                if (!this._fetchedLHSInfo) {
                    this._fetchedLHSInfo = true;
                    const newExpression = updateProperties(this.state.expression, {[LHS] : {value : lhsIdentifier, error: expression[LHS].error}});
                    this.firePropertyChangedEvent(newExpression);
                }
            });
        }

        if (this.state.normalizedLHS.item) {
            this.operatorAndRHSDisabled = false;
            this.state.operatorMenuData = transformOperatorsForCombobox(getOperators(elementType, this.state.normalizedLHS.parameter, rules));
        } else {
            this.operatorAndRHSDisabled = true;
        }

        // In the case that the existing LHS is a field on the second level, get the appropriate menu data
        if (this.state.normalizedLHS.item && this.state.normalizedLHS.item.parent) {
            getFieldsForEntity(this.state.normalizedLHS.item.parent.subText, (fields) => {
                this._fullLHSMenuData = this.state.lhsMenuData = filterFieldsForChosenElement(this.state.normalizedLHS.item.parent, getLHSTypes(elementType, rules), fields, true, true);
            });
        }

        if (expression[OPERATOR]) {
            this.setOperatorErrorMessage(expression[OPERATOR].error);
        }

        // TODO default operator case W-4912900
        const rhsVal = getValueFromHydratedItem(expression[RHSG] ? expression[RHSG] : expression[RHS]);
        if (expression[RHS] && !isUndefinedOrNull(rhsVal)) {
            this.state.normalizedRHS = normalizeRHS(rhsVal, (rhsIdentifier) => {
                if (!this._fetchedRHSInfo) {
                    this._fetchedRHSInfo = true;
                    const newExpression = updateProperties(this.state.expression, {[RHS] : {value : rhsIdentifier, error: expression[RHS].error}});
                    this.firePropertyChangedEvent(newExpression);
                }
            });
        }

        if (lhsVal && expression[OPERATOR]) {
            this.state.rhsTypes = getRHSTypes(elementType, this.state.normalizedLHS.parameter, expression[OPERATOR].value, rules);
            // In the case that the existing RHS is a field on the second level, get the appropriate menu data
            if (this.state.normalizedRHS.itemOrDisplayText && this.state.normalizedRHS.itemOrDisplayText.parent) {
                getFieldsForEntity(this.state.normalizedRHS.itemOrDisplayText.parent.subText, (fields) => {
                    this._fullRHSMenuData = this.state.rhsMenuData = filterFieldsForChosenElement(this.state.normalizedRHS.itemOrDisplayText.parent, this.state.rhsTypes, fields, true, true);
                });
            } else {
                this._fullRHSMenuData = this.state.rhsMenuData = getElementsForMenuData({elementType}, this.state.rhsTypes, true, true);
            }
        }

        this.state.expression = expression;
    }

    /**
     * These are for the column labels, such as "Variable" or "Resource"
     */
    @api
    lhsLabel;

    @api
    operatorLabel;

    @api
    rhsLabel;

    /**
     * @typedef expressionConfig
     * @param {String} elementType    the parent element of this expression
     * @param {String} objectType     the sObject which this expression is based on, i.e. for the LHS fields
     * @param {String[]} lhsFields    fields to be used for the LHS of this expression
     */

    @api
    set configuration(config) {
        contextConfig = config;
        elementType = contextConfig.elementType;
        rules = getRulesForContext(contextConfig);
        this.getLHSMenuData(contextConfig);
    }

    @api
    get configuration() {
        return contextConfig;
    }

    get lhsMenuData() {
        return this.state.lhsMenuData;
    }

    get rhsMenuData() {
        return this.state.rhsMenuData;
    }

    /**
     * These are the text strings that should be displayed by the comboBoxes
     */
    get operatorComboBoxValue() {
        return this.state.expression[OPERATOR] ? this.state.expression[OPERATOR].value : null;
    }

    /* ***************** */
    /* Private Variables */
    /* ***************** */

    _fullLHSMenuData = [];

    _fullRHSMenuData = [];

    _clearedProperty = { value: '', error: null };

    _fetchedLHSInfo = false;

    _fetchedRHSInfo = false;

    firePropertyChangedEvent(newExpression) {
        const propertyChangedEvent = new RowContentsChangedEvent(newExpression);
        this.dispatchEvent(propertyChangedEvent);
    }

    handleLHSItemSelected(event) {
        this.operatorAndRHSDisabled = false;

        if (!this.state.operatorMenuData) {
            const normalizedNewLHS = normalizeLHS(event.detail.item.value);
            this.state.operatorMenuData = transformOperatorsForCombobox(getOperators(elementType, normalizedNewLHS.parameter, rules));
        }
    }

    handleLHSValueChanged(event) {
        event.stopPropagation();
        this.state.operatorMenuData = undefined;
        const newLHSItem = event.detail.item;
        const newValue = newLHSItem ? newLHSItem.value : event.detail.displayText;
        const expressionUpdates = {[LHS] : {value : newValue, error: event.detail.error}};

        const complexGuid = sanitizeGuid(newValue);
        const flowElement = getElementByGuid(complexGuid.guid);
        let elementOrField;
        // if lhs's value is a entity field (it could be flowElement.fieldApiName or objectType.fieldApiName)
        if (complexGuid.fieldName) {
            // get the object type (entity name)
            const objectType = (flowElement) ? flowElement.objectType : contextConfig.objectType;
            getFieldsForEntity(objectType, (fields) => {
                elementOrField = fields[complexGuid.fieldName];
            });
        } else {
            elementOrField = flowElement;
        }
        if (elementOrField) {
            const newLHSParam = elementToParam(elementOrField);
            if (!getOperators(elementType, newLHSParam, rules).includes(this.state.expression.operator.value)) {
                expressionUpdates[OPERATOR] = this._clearedProperty;
                expressionUpdates[RHS] = this._clearedProperty;
                expressionUpdates[RHSDT] = this._clearedProperty;
                expressionUpdates[RHSG] = this._clearedProperty;
            } else {
                let rhsValid = false;
                if (this.state.expression.rightHandSideGuid.value) {
                    rhsValid = isElementAllowed(this.state.rhsTypes, elementToParam(getElementByGuid(this.state.expression.rightHandSideGuid.value)));
                }
                if (!rhsValid) {
                    expressionUpdates[RHS] = this._clearedProperty;
                    expressionUpdates[RHSDT] = this._clearedProperty;
                    expressionUpdates[RHSG] = this._clearedProperty;
                }
            }
        } else {
            expressionUpdates[OPERATOR] = this._clearedProperty;
            expressionUpdates[RHS] = this._clearedProperty;
            expressionUpdates[RHSDT] = this._clearedProperty;
            expressionUpdates[RHSG] = this._clearedProperty;
        }
        const newExpression = updateProperties(this.state.expression, expressionUpdates);
        this.firePropertyChangedEvent(newExpression);
    }

    handleOperatorChanged(event) {
        event.stopPropagation();
        const newOperator = event.detail.value;
        const expressionUpdates = {[OPERATOR]: {value: newOperator, error: null}};
        if (this.state.expression.rightHandSideGuid.value) {
            let rhsValid = false;
            if (this.state.expression.rightHandSideGuid.value) {
                rhsValid = isElementAllowed(this.state.rhsTypes, elementToParam(getElementByGuid(this.state.expression.rightHandSideGuid.value)));
            }
            if (!rhsValid) {
                expressionUpdates[RHS] = this._clearedProperty;
                expressionUpdates[RHSDT] = this._clearedProperty;
                expressionUpdates[RHSG] = this._clearedProperty;
            }
        }
        const newExpression = updateProperties(this.state.expression, expressionUpdates);
        const propertyChangedEvent = new RowContentsChangedEvent(newExpression);
        this.dispatchEvent(propertyChangedEvent);
    }

    handleRHSValueChanged(event) {
        event.stopPropagation();
        const newRHSItem = event.detail.item;
        let errorMessage = event.detail.error;

        let rhsAndRHSDT;
        if (newRHSItem) {
            if (!errorMessage && !newRHSItem.parent && !isElementAllowed(this.state.rhsTypes, elementToParam(getElementByGuid(newRHSItem.value)))) {
                errorMessage = genericErrorMessage;
            }
            rhsAndRHSDT = {
                [RHS]: {value: newRHSItem.displayText, error: errorMessage},
                [RHSDT]: {value: FEROV_DATA_TYPE.REFERENCE, error: null},
                [RHSG]: {value: newRHSItem.value, error: null}
            };
        } else {
            rhsAndRHSDT = {
                [RHS]: {value: event.detail.displayText, error: errorMessage},
                // Set the dataType to LHS dataType
                [RHSDT]: {value: this.lhsType, error: null},
            };
        }
        const newExpression = updateProperties(this.state.expression, rhsAndRHSDT);
        const propertyChangedEvent = new RowContentsChangedEvent(newExpression, errorMessage);
        this.dispatchEvent(propertyChangedEvent);
    }

    get lhsType() {
        if (this.state.normalizedLHS.parameter) {
            const allowedDataTypes = [];
            if (this.state.rhsTypes) {
                // This can contain Flow dataTypes and element types
                const typeKeys = Object.keys(this.state.rhsTypes);
                for (let i = 0; i < typeKeys.length; i++) {
                    const typeKey = typeKeys[i];
                    if (this.state.rhsTypes[typeKey][0].dataType) {
                        allowedDataTypes.push(this.state.rhsTypes[typeKey][0].dataType);
                    }
                }
            }

            // If more than one allowedDataType, default to LHS dataType
            if (allowedDataTypes.length === 1) {
                return allowedDataTypes[0];
            } else if (allowedDataTypes.length > 1 && this.state.normalizedLHS.parameter.dataType) {
                return this.state.normalizedLHS.parameter.dataType;
            }
        }
        return '';
    }

    handleFilterLHSMatches(event) {
        this.operatorAndRHSDisabled = !this.template.querySelector('.lhs').value;

        this.state.lhsMenuData = filterMatches(event.detail.value, this._fullLHSMenuData, event.detail.isMergeField);
    }

    handleFilterRHSMatches(event) {
        this.state.rhsMenuData = filterMatches(event.detail.value, this._fullRHSMenuData, event.detail.isMergeField);
    }

    handleFetchLHSMenuData(event) {
        const selectedItem = event.detail.item;
        if (selectedItem) {
            getFieldsForEntity((selectedItem.subText instanceof Array) ? selectedItem.subTextNoHighlight : selectedItem.subText, (fields) => {
                this._fullLHSMenuData = this.state.lhsMenuData = filterFieldsForChosenElement(selectedItem, getLHSTypes(elementType, rules), fields, true, true);
            });
        } else {
            this._fullLHSMenuData = this.state.lhsMenuData = getElementsForMenuData({elementType, shouldBeWritable: true}, getLHSTypes(elementType, rules), true);
        }
    }

    handleFetchRHSMenuData(event) {
        const selectedItem = event.detail.item;
        if (selectedItem) {
            getFieldsForEntity((selectedItem.subText instanceof Array) ? selectedItem.subTextNoHighlight : selectedItem.subText, (fields) => {
                this._fullRHSMenuData = this.state.rhsMenuData = filterFieldsForChosenElement(selectedItem, this.state.rhsTypes, fields, true, true);
            });
        } else {
            this._fullRHSMenuData = this.state.rhsMenuData = getElementsForMenuData({elementType}, this.state.rhsTypes, true);
        }
    }

    getLHSMenuData(config) {
        let menuData;
        switch (elementType) {
            // TODO: this switch statement will be used when the expression-builder needs more than just
            // elementType to determine the correct menuData. For example, for Record Lookup, the
            // config could contain the selected SObject type so the correct set of fields will be provided
            case ELEMENT_TYPE.RECORD_LOOKUP:
                menuData = filterFieldsForChosenElement({value: config.objectType}, getLHSTypes(elementType, rules), config.lhsFields, false, false);
                break;
            default:
                menuData = getElementsForMenuData({elementType, shouldBeWritable: true}, getLHSTypes(elementType, rules), true);
        }
        this._fullLHSMenuData = this.state.lhsMenuData = menuData;
    }

    setOperatorErrorMessage(errorMessage) {
        const lightningCombobox = this.template.querySelector('.operator');
        if (lightningCombobox) {
            lightningCombobox.setCustomValidity(errorMessage);
            lightningCombobox.showHelpMessageIfInvalid();
        }
    }
}
