import { Element, api } from 'engine';

export default class ExpressionBuilder extends Element {
    @api
    elementType;

    @api
    showOperator;

    @api
    expression;

    @api
    lhsLabel;

    @api
    operatorLabel;

    @api
    rhsLabel;

    @api
    lhsPlaceholder;

    @api
    operatorPlaceholder;

    @api
    rhsPlaceholder;

    @api
    lhsMenuData;

    @api
    operatorMenuData;

    @api
    rhsMenuData;

    @api configuration;
}

