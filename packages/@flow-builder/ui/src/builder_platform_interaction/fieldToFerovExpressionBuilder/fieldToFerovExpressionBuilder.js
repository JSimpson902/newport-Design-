import { LightningElement, api, track } from 'lwc';
import { sanitizeGuid, updateProperties } from "builder_platform_interaction/dataMutationLib";
import {
    EXPRESSION_PROPERTY_TYPE,
    LHS_DISPLAY_OPTION,
    populateLhsStateForField,
    populateRhsState,
} from "builder_platform_interaction/expressionUtils";

const LHS = EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE;

const OPERATOR = EXPRESSION_PROPERTY_TYPE.OPERATOR;

const RHS = EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE;

const RHSG = EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE_GUID;

export default class FieldToFerovExpressionBuilder extends LightningElement {
    @track
    state = {
        objectType: undefined,
        expression: undefined,
        lhsDescribe: undefined,
        lhsDisplayOption: LHS_DISPLAY_OPTION.SOBJECT_FIELD,
        operatorValue: undefined,
        operatorError: undefined,
        rhsDescribe: undefined,
    };

    @api
    lhsLabel;

    @api
    lhsPlaceholder;

    @api
    operatorLabel;

    @api
    operatorPlaceholder;

    /**
     * @param {Boolean} show  True if operator combobox should be displayed
     */
    @track
    hideOperator = false;

    get operatorValue() {
        return this.state.operatorValue;
    }

    get operatorError() {
        return this.state.operatorError;
    }

    @api
    rhsLabel;

    @api
    rhsPlaceholder;

    @api
    get objectType() {
        return this.state.objectType;
    }

    /**
     * Object type of the fields that should be on the LHS
     * @param {Object} object   the api name of the sobject type
     */
    set objectType(object) {
        this.state.objectType = object;
        this.populateLhsState();
    }

    @api
    get expression() {
        return this.state.expression;
    }

    /**
     * The expression to be displayed. If there is no operator in the expression,
     * the operator combobox is not shown. If the operator combobox should be shown,
     * but a value has not been selected yet, pass empty string for the value & error.
     *
     * @param {Object} expression   Has LHS, OPERATOR, RHS each as a hydrated value.
     */
    set expression(expression) {
        this.state.expression = expression;
        this.populateLhsState();
        if (expression[OPERATOR]) {
            this.state.operatorValue = expression[OPERATOR].value;
            this.state.operatorError = expression[OPERATOR].error;
        } else {
            this.hideOperator = true;
        }
        populateRhsState(expression[RHS], expression[RHSG] ? expression[RHSG].value : null,
            (values) => {
                this.state.rhsDescribe = values;
            }
        );
    }

    @api
    containerElement;

    @api
    rules;

    @api
    get lhsFields() {
        return this._lhsFields;
    }

    set lhsFields(fields) {
        if (fields && Object.keys(fields).length) {
            this._lhsFields = fields;
            this.populateLhsState();
        }
    }

    _lhsFields;

    /**
     * Populates the state values for the LHS of the expression such as the display value
     * and what fields should show up in the menudata.
     */
    populateLhsState() {
        if (!this.state.expression || !this.state.objectType || !this.lhsFields) {
            return;
        }
        const lhs = this.state.expression[LHS];

        this.state.lhsDescribe = {
            value: lhs.value,
            error: lhs.error,
            param: null,
            activePicklistValues: null,
            fields: null,
        };

        if (lhs.value && !lhs.error) {
            const complexGuid = sanitizeGuid(lhs.value);
            const fieldParent = {value: this.state.objectType};
            const isFieldOnSobjectVar = false;
            this.state.lhsDescribe = updateProperties(this.state.lhsDescribe,
                populateLhsStateForField(this.lhsFields, complexGuid.fieldName, fieldParent, isFieldOnSobjectVar));
        }
    }
}