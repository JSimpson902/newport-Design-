import { Element, api, track } from 'engine';
import { RowContentsChangedEvent } from 'builder_platform_interaction-events';
import { Store } from 'builder_platform_interaction-store-lib';
import { EXPRESSION_PROPERTY_TYPE, getElementsForMenuData, filterMatches, normalizeLHS, retrieveRHSVal } from 'builder_platform_interaction-expression-utils';
import { getRulesForElementType, getLHSTypes, getOperators, getRHSTypes, transformOperatorsForCombobox } from 'builder_platform_interaction-rule-lib';

const LHS = EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE;

const OPERATOR = EXPRESSION_PROPERTY_TYPE.OPERATOR;

const RHS = EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE;

let storeInstance;
let element;
let rules;

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
        lhsValue: undefined, // display value for combobox
        lhsParameter: undefined, // the parameterized lhs value - only has the values the rules care about
        lhsMenuData: undefined,
        operatorValue: undefined,
        rhsValue: undefined,
    };

    constructor() {
        super();
        storeInstance = Store.getStore();
    }

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
        if (expression[LHS] && expression[LHS].value) {
            const lhsElement = normalizeLHS(storeInstance.getCurrentState(), expression[LHS].value);
            this.state.lhsValue = lhsElement.lhsValue;
            this.state.lhsParameter = lhsElement.lhsParameter;
        }
        if (expression[OPERATOR] && expression[OPERATOR].value) {
            this.state.operatorValue = expression[OPERATOR].value;
        } else {
            // TODO default case W-4817341
        }
        if (expression[RHS] && expression[RHS].value) {
            this.state.rhsValue = retrieveRHSVal(storeInstance.getCurrentState(), expression[RHS].value);
        }
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

    @api
    set elementType(type) {
        element = type;
        rules = getRulesForElementType(element);
        this._fullLHSMenuData = this.state.lhsMenuData = getElementsForMenuData(storeInstance.getCurrentState(), {element, shouldBeWritable: true}, getLHSTypes(rules), true);
    }

    @api
    get elementType() {
        return element;
    }

    get lhsMenuData() {
        return this.state.lhsMenuData;
    }

    get operatorMenuData() {
        return transformOperatorsForCombobox(getOperators(this.state.lhsParameter, rules));
    }

    get rhsMenuData() {
        const rhsTypes = getRHSTypes(this.state.lhsParameter, this.state.operatorValue, rules);
        this._fullRHSMenuData = getElementsForMenuData(storeInstance.getCurrentState(), {element}, rhsTypes, true);
        return this._fullRHSMenuData;
    }

    /**
     * These are the text strings that should be displayed by the comboBoxes
     */
    get lhsComboBoxValue() {
        return this.state.lhsValue;
    }

    get operatorComboBoxValue() {
        return this.state.operatorValue;
    }

    get rhsComboBoxValue() {
        return this.state.rhsValue;
    }

    /**
     * These are the errors associated with each comboBox, if any
     */
    get lhsError() {
        return this.expression[LHS] ? this.expression[LHS].error : null;
    }

    get operatorError() {
        return this.expression[OPERATOR] ? this.expression[OPERATOR].error : null;
    }

    get rhsError() {
        return this.expression[RHS] ? this.expression[RHS].error : null;
    }

    /**
     * If there is nothing in the LHS, operator and RHS should be disabled
     */
    get operatorDisabled() {
        return false;
        // TODO: determine this logic W-4712116
    }

    get rhsDisabled() {
        return false;
        // TODO: determine this logic W-4712116
    }

    /* ***************** */
    /* Private Variables */
    /* ***************** */

    _fullLHSMenuData = [];

    _fullRHSMenuData = [];

    handleLHSValueChanged(event) {
        event.stopPropagation();

        const propertyChangedEvent = new RowContentsChangedEvent(LHS, event.detail.value, event.detail.error);
        this.dispatchEvent(propertyChangedEvent);
    }

    handleOperatorChanged(event) {
        event.stopPropagation();

        const propertyChangedEvent = new RowContentsChangedEvent(OPERATOR, event.detail.value);
        this.dispatchEvent(propertyChangedEvent);
    }

    handleRHSValueChanged(event) {
        event.stopPropagation();

        const propertyChangedEvent = new RowContentsChangedEvent(RHS, event.detail.value, event.detail.error);
        this.dispatchEvent(propertyChangedEvent);
    }

    handleFilterLHSMatches(event) {
        this.state.lhsMenuData = filterMatches(event.detail.value, this._fullLHSMenuData);
    }

    handleFilterRHSMatches(event) {
        this.state.rhsMenuData = filterMatches(event.detail.value, this._fullRHSMenuData);
    }

    handleFetchLHSMenuData() {
        // TODO  W-4723095
    }

    handleFetchOperatorMenuData() {
        // TODO  W-4723095
    }

    handleFetchRHSMenuData() {
        // TODO  W-4723095
    }
    // TODO: validation
}
