// @ts-nocheck
import { api, LightningElement } from 'lwc';

export default class BaseExpressionBuilder extends LightningElement {
    @api
    containerElement;

    @api
    lhsPlaceholder;

    @api
    lhsLabel;

    @api
    lhsValue;

    @api
    lhsError;

    @api
    lhsFields;

    @api
    lhsParam;

    @api
    lhsActivePicklistValues;

    @api
    lhsIsField;

    @api
    showLhsAsFieldReference;

    @api
    lhsMustBeWritable;

    @api
    operatorLabel;

    @api
    operatorValue;

    @api
    operatorError;

    @api
    operatorPlaceholder;

    @api
    rhsLabel;

    @api
    rhsValue;

    @api
    rhsError;

    @api
    rhsGuid;

    @api
    rhsIsField;

    @api
    rhsFields;

    @api
    rhsLiteralsAllowed;

    @api
    hideNewResource;

    @api
    rules;

    @api
    objectType;

    @api
    lhsDisabled;

    @api
    required;
}
