import { LightningElement, api, track } from 'lwc';
import { RowContentsChangedEvent } from 'builder_platform_interaction/events';
import { sanitizeGuid } from 'builder_platform_interaction/dataMutationLib';
import { logInteraction } from 'builder_platform_interaction/loggingUtils';
import {
    EXPRESSION_PROPERTY_TYPE,
    getStoreElements,
    filterAndMutateMenuData,
    filterFieldsForChosenElement,
    getResourceByUniqueIdentifier,
    getFerovDataTypeForValidId,
    isElementAllowed,
    filterMatches,
    LHS_DISPLAY_OPTION,
    getChildrenItemsPromise
} from 'builder_platform_interaction/expressionUtils';
import {
    getLHSTypes,
    getOperators,
    getRHSTypes,
    transformOperatorsForCombobox,
    elementToParam,
    isCollectionRequired,
    PARAM_PROPERTY,
    RULE_OPERATOR
} from 'builder_platform_interaction/ruleLib';
import {
    FEROV_DATA_TYPE,
    FLOW_DATA_TYPE
} from 'builder_platform_interaction/dataTypeLib';
import {
    isObject,
    isUndefined
} from 'builder_platform_interaction/commonUtils';
import { saveExpression } from 'builder_platform_interaction/expressionValidator';
import { Store } from 'builder_platform_interaction/storeLib';
import genericErrorMessage from '@salesforce/label/FlowBuilderCombobox.genericErrorMessage';
import {
    removeLastCreatedInlineResource,
    updateInlineResourceProperties
} from 'builder_platform_interaction/actions';
import { getInlineResource } from 'builder_platform_interaction/inlineResourceUtils';
import { isLookupTraversalSupported } from 'builder_platform_interaction/mergeFieldLib';
import { getTriggerType } from 'builder_platform_interaction/storeUtils';

const LHS = EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE;
const OPERATOR = EXPRESSION_PROPERTY_TYPE.OPERATOR;
const RHS = EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE;
const RHSDT = EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE_DATA_TYPE;

const DATA_TYPE = PARAM_PROPERTY.DATA_TYPE;

const CLEAR_VALUE = '';
const CLEAR_ERROR = null;
const CLEARED_PROPERTY = { value: CLEAR_VALUE, error: CLEAR_ERROR };

const SHOW_SUBTEXT = true;
const DISABLE_HAS_NEXT = false;

const LHS_FIELDS = 'lhsFields';
const RHS_FIELDS = 'rhsFields';
const LHS_FULL_MENU_DATA = 'lhsFullMenuData';
const LHS_FILTERED_MENU_DATA = 'lhsFilteredMenuData';
const RHS_FULL_MENU_DATA = 'rhsFullMenuData';
const RHS_FILTERED_MENU_DATA = 'rhsFilteredMenuData';

const VARIANT_NARROW = 'narrow';
const LEFT = 'left';
const RIGHT = 'right';

let storeInstance;

export default class BaseExpressionBuilder extends LightningElement {
    @track
    _lhsInlineResource = null;

    @track
    _rhsInlineResource = null;

    @track
    state = {
        operatorAndRhsDisabled: true,
        lhsParam: undefined,
        [LHS_FIELDS]: undefined,
        lhsParamTypes: undefined,
        lhsActivePicklistValues: undefined,
        lhsEmptyOperatorsError: undefined,
        [RHS_FIELDS]: undefined,
        [LHS_FULL_MENU_DATA]: undefined,
        [LHS_FILTERED_MENU_DATA]: undefined,
        [RHS_FULL_MENU_DATA]: undefined,
        [RHS_FILTERED_MENU_DATA]: undefined,
        rhsRenderIncrementally: false
    };

    /**
     * @param {Object[]} rules  Rules to use when fetching menudata
     */
    set rules(rules) {
        this._rules = rules;
        this.setLhsMenuData();
    }

    @api
    get rules() {
        return this._rules;
    }

    /**
     * @param {String} elementType  the ELEMENT_TYPE of the property editor
     */
    set containerElement(elementType) {
        this._containerElement = elementType;
        this.setLhsMenuData();
    }

    @api
    get containerElement() {
        return this._containerElement;
    }

    /**
     * @param {String} object  the api name of the fields displayed on the LHS, if any
     */
    set objectType(object) {
        this._objectType = object;
        this.setLhsMenuData();
    }

    @api
    get objectType() {
        return this._objectType;
    }

    @api
    lhsLabelHelpText;

    @api
    rhsLabelHelpText;

    @api
    lhsPlaceholder;

    @api
    lhsLabel;

    @api
    lhsValue;

    @api
    lhsError;

    /**
     * A left hand side error message:, which is either an externally set error message or
     * the generic error message, if the operator list is empty (W-6371025).
     */
    get _lhsEffectiveError() {
        if (this.lhsError) {
            return this.lhsError;
        } else if (this.state.lhsEmptyOperatorsError) {
            return genericErrorMessage;
        }
        return null;
    }

    @api
    operatorIconName = '';

    /**
     * The rowIndex(guid) associated with this specific expression
     */
    set rowIndex(index) {
        this._rowIndex = index;
        // need rowIndex before this
        saveExpression(this);
    }

    @api
    get rowIndex() {
        return this._rowIndex;
    }

    /**
     * @param {String[]} fields  fields that will populate the LHS menu data
     */
    set lhsFields(fields) {
        this.state[LHS_FIELDS] = fields;
        this.setLhsMenuData();
    }

    @api
    get lhsFields() {
        return this.state[LHS_FIELDS];
    }

    /**
     * @param {rules/param} param  the param representing the LHS, used for the rules
     */
    set lhsParam(param) {
        this.state.lhsParam = param;
        this._operatorMenuData = undefined;
        this.setLhsMenuData();
        if (param) {
            this.state.operatorAndRhsDisabled = false;

            this._rhsParamTypes = undefined;
            this.setRhsMenuData();
            this._rhsDataType = this.getRhsDataType();
        } else {
            this.state.operatorAndRhsDisabled = true;

            this.state[RHS_FULL_MENU_DATA] = this.state[
                RHS_FILTERED_MENU_DATA
            ] = undefined;
        }
    }

    @api
    get lhsParam() {
        return this.state.lhsParam;
    }

    /**
     * @param {Object[]} values  the picklist values associated with the LHS value, if the LHS value is a field
     */
    set lhsActivePicklistValues(values) {
        this.state.lhsActivePicklistValues = values;
        this.setRhsMenuData();
    }

    @api
    get lhsActivePicklistValues() {
        return this.state.lhsActivePicklistValues;
    }

    /**
     * @param {String} display  LHS_DISPLAY_OPTION determines how LHS should be displayed
     */
    set lhsDisplayOption(display) {
        if (
            !Object.values(LHS_DISPLAY_OPTION).find(
                option => option === display
            )
        ) {
            throw new Error(
                `Display option must be one of the predefined options but instead was ${display}`
            );
        }
        this._lhsDisplayOption = display;
        this.setLhsMenuData();
    }

    @api
    get lhsDisplayOption() {
        return this._lhsDisplayOption;
    }

    /**
     * @param {Boolean} writable   should LHS menu data always be writable elements?
     */
    set lhsMustBeWritable(writable) {
        this._lhsMustBeWritable = writable;
        this.setLhsMenuData();
    }

    @api
    get lhsMustBeWritable() {
        return this._lhsMustBeWritable;
    }

    @api
    operatorLabel;

    /**
     * The default operator to display when the expression is empty or when
     * reset to the default state
     * @type {String}
     * @default ''
     * @memberof BaseExpressionBuilder
     */
    _defaultOperator = '';

    @api
    get defaultOperator() {
        return this._defaultOperator;
    }

    set defaultOperator(value) {
        this._defaultOperator = value;
        this.setOperatorMenuData();
    }

    /**
     * @param {String} value  operator value for the expression
     */
    set operatorValue(value) {
        this._operatorValue = value;
        this._rhsParamTypes = undefined;
        this.state[RHS_FULL_MENU_DATA] = this.state[
            RHS_FILTERED_MENU_DATA
        ] = undefined;
        this.setRhsMenuData();
        this._rhsDataType = this.getRhsDataType();
        this.setOperatorMenuData();
    }

    @api
    get operatorValue() {
        return this._operatorValue;
    }

    @api
    operatorError;

    @api
    hideOperator = false;

    @api
    operatorPlaceholder;

    @api
    rhsLabel;

    @api
    rhsValue;

    @api
    rhsError;

    @api
    blockRhsValidation = false;

    /**
     * @param {Boolean} isFer   true if RHS is a FER, false if RHS is a FEROV
     */
    set rhsIsFer(isFer) {
        this._rhsIsFer = isFer;
        this.setRhsMenuData();
    }

    @api
    get rhsIsFer() {
        return this._rhsIsFer;
    }

    /**
     * @param {Boolean} isField  true if the RHS is a field on an sobject var
     */
    set rhsIsField(isField) {
        this._rhsIsField = isField;
        this.setRhsMenuData();
    }

    @api
    get rhsIsField() {
        return this._rhsIsField;
    }

    /**
     * @param {Object[]} fields  fields to populate RHS menu data, if drilling into an sobject var
     */
    set rhsFields(fields) {
        this.state[RHS_FIELDS] = fields;
        this.setRhsMenuData();
    }

    @api
    get rhsFields() {
        return this.state[RHS_FIELDS];
    }

    @api
    rhsPlaceholder;

    /**
     * @param {Boolean} allowed  true if RHS is a FEROV
     */
    set rhsLiteralsAllowed(allowed) {
        this._rhsLiteralsAllowedForContext = allowed;
        this._rhsDataType = this.getRhsDataType();
    }

    @api
    get rhsLiteralsAllowed() {
        return (
            !this.rhsIsFer &&
            this._rhsLiteralsAllowedForContext &&
            !isCollectionRequired(this.getRhsParamTypes(), this._rhsDataType)
        );
    }

    get rhsDataType() {
        return this._rhsDataType || FEROV_DATA_TYPE.STRING;
    }

    /**
     * @returns {rules/param[]|undefined} the params from the rules, based on LHS and operator value, that should be used to
     * filter menu data for the RHS
     * OR if RHS is a FER we do not want to pass down the allowedParamTypes because we want to force the combobox to validate against the menu data
     */
    get rhsParamTypes() {
        return this.rhsIsFer ? undefined : this.getRhsParamTypes();
    }

    @api
    get hideFerovMenuData() {
        return this._hideFerovMenuData;
    }

    /**
     * @type {boolean} hide hides FEROV-specific menu data (like global constants) when set to true.
     */
    set hideFerovMenuData(hide) {
        this._hideFerovMenuData = !!hide;
        this.setRhsMenuData();
    }

    @api
    get hideSystemVariables() {
        return this._hideSystemVariables;
    }

    /**
     * @type {boolean} hide hides system variables menu options.
     */
    set hideSystemVariables(hide) {
        this._hideSystemVariables = !!hide;
        this.setRhsMenuData();
    }

    /**
     * Set it to true to hide 'New Resource' option in combobox menu data.
     * @type {Boolean}
     */
    @api
    hideNewResource = false;

    /**
     * Set it to true to hide display the expression builder vertically instead of horizontally inline
     * @type {Boolean}
     */
    @api
    variant;

    _containerElement;
    _objectType;
    _rules;
    _lhsDisplayOption;
    _lhsMustBeWritable;
    _operatorValue;
    _operatorMenuData;
    _rhsDataType;
    _rhsIsField;
    _rhsIsFer;
    _rhsParamTypes;
    _rhsLiteralsAllowedForContext = false;
    _unsubscribeStore;
    _hideFerovMenuData = false;
    _hideSystemVariables = false;

    get containerClasses() {
        return this.variant === VARIANT_NARROW
            ? ''
            : 'slds-grid slds-gutters slds-grid_vertical-align-start slds-gutters_xx-small';
    }
    get lhsClasses() {
        return this.variant === VARIANT_NARROW
            ? 'lhs'
            : 'lhs slds-col slds-grow';
    }

    get operatorClasses() {
        return this.variant === VARIANT_NARROW
            ? 'operator'
            : 'operator slds-col slds-grow slds-size_x-small';
    }

    get rhsClasses() {
        return this.variant === VARIANT_NARROW
            ? 'rhs'
            : 'rhs slds-col slds-grow';
    }

    get showOperatorIcon() {
        return this.hideOperator && this.operatorIconName;
    }

    /**
     * Sets LHS menu data if all the necessary attributes have been initialized
     */
    setLhsMenuData() {
        this.setOperatorMenuData();

        if (!this.areAllDefined([this.containerElement, this.rules])) {
            return;
        }
        this.lhsParamTypes = getLHSTypes(this.containerElement, this.rules);

        if (
            !this.areAllDefined([
                this.lhsFields,
                this.lhsDisplayOption,
                this.lhsMustBeWritable
            ])
        ) {
            return;
        }

        const isFieldMenuData =
            this.lhsFields &&
            this.lhsDisplayOption !== LHS_DISPLAY_OPTION.NOT_FIELD;
        const parentMenuItem = isFieldMenuData ? this.getLhsParent() : null;
        this.populateLhsMenuData(isFieldMenuData, parentMenuItem);
    }

    /**
     * The operator of the expression. Uses the operatorValue if one exists,
     * otherwise it uses the defaultOperator
     * @readonly
     * @memberof BaseExpressionBuilder
     */
    get operator() {
        return this.operatorValue || this.defaultOperator;
    }

    /**
     * Sets operator menu data if all the necessary attributes have been initialized
     */
    get operatorMenuData() {
        return this._operatorMenuData;
    }

    setOperatorMenuData() {
        if (
            this.areAllDefined([this.containerElement]) &&
            !this._operatorMenuData
        ) {
            let operators = [];
            if (this.lhsParam) {
                operators = getOperators(
                    this.containerElement,
                    this.lhsParam,
                    this.rules
                );
            } else if (this.operator) {
                // we want to display the current operator
                operators = [this.operator];
            }
            this.updateOperatorMenuData(operators);
        }
    }

    updateOperatorMenuData(operators) {
        this._operatorMenuData = transformOperatorsForCombobox(operators);
        this.state.lhsEmptyOperatorsError =
            !!this.lhsValue &&
            (!this._operatorMenuData || this._operatorMenuData.length === 0);
    }

    /**
     * Sets RHS menu data if all the necessary attributes have been initialized
     */
    setRhsMenuData() {
        if (
            !this.areAllDefined([
                this.containerElement,
                this.lhsActivePicklistValues,
                this.rhsIsField,
                this.rhsFields,
                this.rhsIsFer
            ]) ||
            !this.lhsParam ||
            !this.operatorForRules()
        ) {
            return;
        }

        const isFieldMenuData =
            this.rhsIsField && this.rhsFields && this.rhsValue;
        const parentMenuItem = isFieldMenuData ? this.rhsValue.parent : null;
        this.populateRhsMenuData(isFieldMenuData, parentMenuItem);
    }

    /**
     * Determines dataType allowed on RHS based on the rules and the current LHS and operator value
     */
    getRhsDataType(
        lhsParam = this.lhsParam,
        rhsTypes = this.getRhsParamTypes()
    ) {
        let dataType = null;
        if (this._rhsLiteralsAllowedForContext && rhsTypes) {
            const allowedDataTypes = this.getPossibleRHSDataTypes(rhsTypes);

            // Currency & Number are treated the same by the combobox, so we shouldn't consider them as multiple different types
            if (
                allowedDataTypes.length > 1 &&
                allowedDataTypes.includes(FLOW_DATA_TYPE.CURRENCY.value) &&
                allowedDataTypes.includes(FLOW_DATA_TYPE.NUMBER.value)
            ) {
                allowedDataTypes.splice(
                    allowedDataTypes.indexOf(FLOW_DATA_TYPE.CURRENCY.value),
                    1
                );
            }

            if (allowedDataTypes.length === 1) {
                dataType = allowedDataTypes[0];
            } else if (allowedDataTypes.length > 1 && lhsParam[DATA_TYPE]) {
                dataType = lhsParam[DATA_TYPE];
            }
        }
        return dataType;
    }

    /**
     * Initializes rhsParamTypes if they are undefined
     *
     * @returns {rules/param[]} The param types that should be used to build rhs menu data & validate rhs when it's a ferov
     */
    getRhsParamTypes() {
        if (!this._rhsParamTypes) {
            this._rhsParamTypes = getRHSTypes(
                this.containerElement,
                this.lhsParam,
                this.operatorForRules(),
                this._rules
            );
        }
        return this._rhsParamTypes;
    }

    /**
     * @returns {String[]}  dataTypes allowed on RHS based on the rules and the current LHS and operator value
     */
    getPossibleRHSDataTypes(rhsTypes) {
        return Object.keys(rhsTypes)
            .filter(key => rhsTypes[key][0] && rhsTypes[key][0][DATA_TYPE])
            .map(key => rhsTypes[key][0][DATA_TYPE]);
    }

    /**
     * After rendering we are setting the operator error (if it exists)
     * via setCustomValidity
     */
    renderedCallback() {
        this.setOperatorErrorMessage(this.operatorError);
    }

    /**
     * Sets validity & shows error on the operator combobox
     *
     * @param {String} errorMessage   errorMessage to be set on the operator combobox
     */
    setOperatorErrorMessage(errorMessage) {
        if (!this.hideOperator) {
            const lightningCombobox = this.template.querySelector('.operator');
            lightningCombobox.setCustomValidity(errorMessage);
            lightningCombobox.showHelpMessageIfInvalid();
        }
    }

    constructor() {
        super();
        storeInstance = Store.getStore();
        this._unsubscribeStore = storeInstance.subscribe(
            this.handleStoreChange
        );
    }
    /**
     * Unsubscribe from the store.
     */
    disconnectedCallback() {
        if (typeof this._unsubscribeStore === 'function') {
            this._unsubscribeStore();
        }
    }
    /**
     * Callback from the store for changes in store.
     */
    handleStoreChange = () => {
        const position = storeInstance.getCurrentState().properties
            .lastInlineResourcePosition;
        if (!position) {
            this.setLhsMenuData();
            this.setRhsMenuData();
        } else if (position === RIGHT) {
            this.setRhsMenuData();
        } else if (position === LEFT) {
            this.setLhsMenuData();
        }
    };

    /**
     * Toggles whether operator & RHS are disabled
     *
     * @param {Object} event    itemSelected event
     */
    handleLhsItemSelected(event) {
        this.state.operatorAndRhsDisabled = false;
        if (!this._operatorMenuData || !this._operatorMenuData.length) {
            const selectedLhs = this.getElementOrField(
                event.detail.item.value,
                this.lhsFields
            );
            this.updateOperatorMenuData(
                getOperators(this.containerElement, selectedLhs, this.rules)
            );
        }
    }

    /**
     * Toggles whether operator & RHS are disabled, and filters LHS menu data based on user entry
     *
     * @param {Object} event   filterMatches event
     */
    handleFilterLhsMatches(event) {
        event.stopPropagation();
        // TODO: W-5340967 add the full combobox value to filter matches so it can be used here
        this.state.operatorAndRhsDisabled = !this.template.querySelector('.lhs')
            .value;
        if (this.state[LHS_FULL_MENU_DATA]) {
            this.state[LHS_FILTERED_MENU_DATA] = filterMatches(
                event.detail.value,
                this.state[LHS_FULL_MENU_DATA],
                event.detail.isMergeField
            );
        }
    }

    /**
     * Filters RHS menu data based on user entry
     *
     * @param {Object} event   filterMatches event
     */
    handleFilterRhsMatches(event) {
        event.stopPropagation();
        if (this.state[RHS_FULL_MENU_DATA]) {
            this.state[RHS_FILTERED_MENU_DATA] = filterMatches(
                event.detail.value,
                this.state[RHS_FULL_MENU_DATA],
                event.detail.isMergeField
            );
        }
    }

    /**
     * Fetches new level of menu data for LHS
     *
     * @param {Object} event   fetchMenuData event
     */
    handleFetchLhsMenuData(event) {
        if (event.detail.item) {
            this.state.operatorAndRhsDisabled = false;
        }
        this.populateLhsMenuData(!!event.detail.item, event.detail.item);
    }

    /**
     * Fetches new level of menu data for RHS
     *
     * @param {Object} event   fetchMenuData event
     */
    handleFetchRhsMenuData(event) {
        this.populateRhsMenuData(!!event.detail.item, event.detail.item);
    }

    /**
     * Helper method to pass values to populateMenuData which never change for LHS
     *
     * @param {Boolean} getFields       true if the menu data should be fields
     * @param {Object} parentMenuItem   object representing the parent object of the fields, if getFields is true
     */
    populateLhsMenuData(getFields, parentMenuItem) {
        const isDisplayedAsFieldReference =
            this.lhsDisplayOption !== LHS_DISPLAY_OPTION.SOBJECT_FIELD;
        const allowFieldsTraversal =
            this.isLookupTraversalSupported() &&
            this.objectType == null &&
            !this.lhsMustBeWritable;
        this.populateMenuData(
            getFields,
            parentMenuItem,
            LHS_FULL_MENU_DATA,
            LHS_FILTERED_MENU_DATA,
            LHS_FIELDS,
            this.lhsParamTypes,
            {
                isDisplayedAsFieldReference,
                shouldBeWritable: this.lhsMustBeWritable,
                allowSObjectFieldsTraversal: allowFieldsTraversal,
                allowApexTypeFieldsTraversal: true,
                objectType: this.objectType
            }
        );
    }

    /**
     * Helper method to pass values to populateMenuData which never change for RHS
     *
     * @param {Boolean} getFields       true if the menu data should be fields
     * @param {Object} parentMenuItem   object representing the parent object of the fields, if getFields is true
     */
    populateRhsMenuData(getFields, parentMenuItem) {
        const isDisplayedAsFieldReference = true;

        // if only FERs are allowed, RHS must be writable
        const shouldBeWritable = this.rhsIsFer;

        // the picklist values of the field are shown as helpers when RHS can be FEROV - if RHS must be a FER they aren't applicable
        const picklistValues = this.rhsIsFer
            ? null
            : this.lhsActivePicklistValues;
        // Display picklist values incrementally in the combobox. See W-5731108.
        this.state.rhsRenderIncrementally =
            !!picklistValues && picklistValues.length > 0;

        this.populateMenuData(
            getFields,
            parentMenuItem,
            RHS_FULL_MENU_DATA,
            RHS_FILTERED_MENU_DATA,
            RHS_FIELDS,
            this.getRhsParamTypes(),
            {
                isDisplayedAsFieldReference,
                isFerov: !this.rhsIsFer,
                picklistValues,
                shouldBeWritable
            }
        );
    }

    /**
     * Helper function to set the newly created inline resource in LHS or RHS
     *
     * @param {String} position position of the resource (LHS or RHS)
     * @param {Object} resource the newly created inline resource
     */
    setInlineResource = (position, resource) => {
        if (position) {
            const menu =
                position === LEFT ? LHS_FULL_MENU_DATA : RHS_FULL_MENU_DATA;
            const inlineItem = getInlineResource(resource, this.state[menu]);
            if (position === LEFT) {
                this._lhsInlineResource = inlineItem;
            } else if (position === RIGHT) {
                this._rhsInlineResource = inlineItem;
            }
        }
    };

    handleAddNewResource(event) {
        if (event && event.detail) {
            const payload = {
                lastInlineResourcePosition: event.detail.position,
                lastInlineResourceRowIndex: this.rowIndex
            };
            storeInstance.dispatch(updateInlineResourceProperties(payload));
            logInteraction(
                'base expression builder inline resource',
                'combobox',
                null,
                'click'
            );
        }
    }

    get enableLookupTraversal() {
        return this.isLookupTraversalSupported();
    }

    isLookupTraversalSupported() {
        return isLookupTraversalSupported(
            storeInstance.getCurrentState().properties.processType,
            getTriggerType()
        );
    }

    /**
     * Generic helper function to handle populating fields for LHS or RHS
     *
     * @param {Boolean} getFields -  true if the menu data should be fields
     * @param {Object} parentMenuItem - object representing the parent object of the fields, if getFields is true
     * @param {String} fullMenuData - the name of the property on the state where the full menu data should be stored
     * @param {String} filteredMenuData - the name of the property on the state where the filtered menu data should be stored
     * @param {Object[]} preFetchedFields - the name of the property on the state which holds the fields for the menu data
     * @param {rule/param[]} paramTypes - the param types that should be used to filter the menu data
     * @param {Object} options - options
     * @param {Boolean} options.shouldBeWritable - true if the items in the menu data must be writable
     * @param {Boolean} options.isDisplayedAsFieldReference - true if the items should be displayed as fields on sobject variables when chosen
     * @param {Boolean} options.isFerov - true if this combobox holds FEROVs
     * @param {String[]} options.picklistValues - list of picklist values that should be included in menu data
     * @param {Boolean} options.allowSObjectFieldsTraversal - true to allow SObject fields traversal
     * @param {Boolean} options.allowApexTypeFieldsTraversal - true to allow Apex Type fields traversal
     * @param {String} options.objectType - objectType for preFetchedFields. If set, fields in preFetchedFields won't be updated
     */
    populateMenuData(
        getFields,
        parentMenuItem,
        fullMenuData,
        filteredMenuData,
        preFetchedFields,
        paramTypes,
        {
            isDisplayedAsFieldReference = true,
            isFerov = false,
            picklistValues = [],
            shouldBeWritable = false,
            allowSObjectFieldsTraversal = this.isLookupTraversalSupported(),
            allowApexTypeFieldsTraversal = this.isLookupTraversalSupported(),
            objectType = undefined
        } = {}
    ) {
        const config = {
            elementType: this.containerElement,
            shouldBeWritable
        };
        const updateState = stateUpdatesPromise => {
            // we use this Promise to make sure we update the state in the same order populateMenuData is called
            if (!this.updateStatePromise) {
                this.updateStatePromise = Promise.resolve();
            }
            stateUpdatesPromise = Promise.resolve(stateUpdatesPromise);
            this.updateStatePromise = this.updateStatePromise
                .then(() => stateUpdatesPromise)
                .then(stateUpdates => Object.assign(this.state, stateUpdates));
            return this.updateStatePromise;
        };
        if (getFields) {
            const filterFields = fields =>
                filterFieldsForChosenElement(parentMenuItem, fields, {
                    allowedParamTypes: paramTypes,
                    showAsFieldReference: isDisplayedAsFieldReference,
                    showSubText: SHOW_SUBTEXT,
                    shouldBeWritable,
                    allowSObjectFieldsTraversal:
                        !shouldBeWritable && allowSObjectFieldsTraversal,
                    allowApexTypeFieldsTraversal
                });
            let preFetchedFieldsSubtype;
            // get the sobject type from the first field
            for (const prop in this.state[preFetchedFields]) {
                if (this.state[preFetchedFields].hasOwnProperty(prop)) {
                    preFetchedFieldsSubtype = this.state[preFetchedFields][prop]
                        .sobjectName;
                    break;
                }
            }
            // get fields if preFetchedFields is empty or of the wrong sobject
            if (
                !objectType &&
                parentMenuItem &&
                (!this.state[preFetchedFields] ||
                    preFetchedFieldsSubtype !== parentMenuItem.subtype)
            ) {
                updateState(
                    getChildrenItemsPromise(parentMenuItem).then(items => {
                        const menuData = filterFields(items);
                        return {
                            [preFetchedFields]: items,
                            [fullMenuData]: menuData,
                            [filteredMenuData]: menuData
                        };
                    })
                );
            } else {
                const fields = this.state[preFetchedFields];
                const menuData = filterFields(fields);
                updateState({
                    [preFetchedFields]: fields,
                    [fullMenuData]: menuData,
                    [filteredMenuData]: menuData
                });
            }
        } else {
            const menuDataElements = getStoreElements(
                storeInstance.getCurrentState(),
                config
            );
            const menuData = filterAndMutateMenuData(
                menuDataElements,
                paramTypes,
                !this.hideNewResource,
                isFerov && !this.hideFerovMenuData,
                DISABLE_HAS_NEXT,
                picklistValues,
                !this.hideSystemVariables
            );
            updateState({
                [fullMenuData]: menuData,
                [filteredMenuData]: menuData
            });
        }

        const {
            lastInlineResourceGuid: newResourceGuid,
            lastInlineResourceRowIndex: newResourceRowIndex,
            lastInlineResourcePosition: newResourcePosition
        } = storeInstance.getCurrentState().properties;

        if (newResourceGuid && this.rowIndex === newResourceRowIndex) {
            updateState({
                operatorAndRhsDisabled: false
            }).then(() => {
                this.setInlineResource(newResourcePosition, newResourceGuid);
                storeInstance.dispatch(removeLastCreatedInlineResource);
            });
        }
    }

    areAllDefined(attributes) {
        const undefinedIndex = attributes.findIndex(attribute => {
            return isUndefined(attribute);
        });
        return undefinedIndex < 0;
    }

    /**
     * @param {String} value       a guid
     * @param {Object[]} fields    fields populating the relevant menu data, if there are any
     * @returns {Object}           Object representing the field or the FER represented by the guid
     */
    getElementOrField(value, fields) {
        const fieldNames = sanitizeGuid(value).fieldNames;
        if (fieldNames) {
            const fieldName = fieldNames[fieldNames.length - 1];
            return fields[fieldName];
        }
        return getResourceByUniqueIdentifier(value);
    }

    /**
     * Clears RHS if it has become invalid
     *
     * @param {Object} expressionUpdates    represents any changes that are already being made to the expression
     * @param {rules/param} lhsParam        representation of the lhs value that can be used with the rules
     * @param {String} operator             operator value
     */
    clearRhsIfNecessary(expressionUpdates, lhsParam, operator, rhsTypes) {
        if (this.rhsValue && this.rhsValue.value) {
            const rhsElementOrField = this.getElementOrField(
                this.rhsValue.value,
                this.rhsFields
            );
            const rhsValid = isElementAllowed(
                rhsTypes,
                elementToParam(rhsElementOrField)
            );
            if (!rhsValid) {
                expressionUpdates[RHS] = CLEARED_PROPERTY;
            }
        }
    }

    resetRhsProperties(expressionUpdates, lhsParam, operator) {
        const rhsTypes = getRHSTypes(
            this.containerElement,
            lhsParam,
            operator,
            this._rules
        );
        this.clearRhsIfNecessary(
            expressionUpdates,
            lhsParam,
            operator,
            rhsTypes
        );

        const rhsDataType = operator
            ? this.getRhsDataType(lhsParam, rhsTypes)
            : CLEAR_VALUE;
        if (!this.rhsIsFer && rhsDataType !== this._rhsDataType) {
            expressionUpdates[RHSDT] = {
                value: rhsDataType,
                error: CLEAR_ERROR
            };
        }
    }

    /**
     * Creates new object representing the updates for the operator, and checks updated operator and RHS validity
     *
     * @param {Object} event  ComboboxStateChangedEvent that was fired from the LHS combobox
     */
    handleLhsValueChanged(event) {
        event.stopPropagation();
        const expressionUpdates = {};
        let newLhsParam;
        let newValue = event.detail.displayText || CLEAR_VALUE;
        let newError = event.detail.error || CLEAR_ERROR;

        // update LHS value & error
        const lhsElementOrField = event.detail.item
            ? this.getElementOrField(event.detail.item.value, this.lhsFields)
            : null;
        if (lhsElementOrField && !newError) {
            newValue = event.detail.item.value;
            newLhsParam = elementToParam(lhsElementOrField);
        } else if (newValue && !newError) {
            newError = genericErrorMessage;
        }
        expressionUpdates[LHS] = { value: newValue, error: newError };

        const operators = getOperators(
            this.containerElement,
            newLhsParam,
            this._rules
        );
        const isOperatorValid =
            newLhsParam && operators.includes(this.operatorValue);
        const isDefaultOperatorValid = newLhsParam
            ? operators.includes(this.defaultOperator)
            : true;

        // reset to the default operator if a valid one exists, otherwise clear the operator
        const backupOperatorValue = isDefaultOperatorValid
            ? this.defaultOperator
            : CLEAR_VALUE;
        // use the current operator if valid, otherwise reset to the default/cleared value
        const newOperatorValue = isOperatorValid
            ? this.operatorValue
            : backupOperatorValue;

        expressionUpdates[OPERATOR] = {
            value: newOperatorValue,
            error: CLEAR_ERROR
        };

        // clear or update rhs & rhs data type if necessary
        this.resetRhsProperties(
            expressionUpdates,
            newLhsParam,
            this.operatorForRules()
        );

        this.fireRowContentsChangedEvent(expressionUpdates);
    }

    /**
     * Creates new object representing the updates for the operator, and checks updated RHS validity
     *
     * @param {Object} event  ComboboxStateChangedEvent that was fired from the operator combobox
     */
    handleOperatorChanged(event) {
        event.stopPropagation();
        const newOperator = event.detail.value;
        const expressionUpdates = {
            [OPERATOR]: { value: newOperator, error: CLEAR_ERROR }
        };

        this.resetRhsProperties(expressionUpdates, this.lhsParam, newOperator);

        this.fireRowContentsChangedEvent(expressionUpdates);
    }

    /**
     * Uses the new value of the RHS to also determine new values for the guid and datatype of the ferov
     *
     * @param {Object} event  ComboboxStateChangedEvent that was fired from the RHS combobox
     */
    handleRhsValueChanged(event) {
        event.stopPropagation();
        const rhsItem = event.detail.item;
        let error = event.detail.error || CLEAR_ERROR;
        let rhs = event.detail.displayText;
        let rhsdt = rhs ? this._rhsDataType : CLEAR_VALUE;

        // if rhsItem in the event payload is an object then we know the user selected an item from the menu data
        if (isObject(rhsItem) && !error) {
            // an item's unique id is stored in value
            rhs = rhsItem.value;
            // this data type covers the error case, or if the item represents a picklist value
            rhsdt = FEROV_DATA_TYPE.STRING;
            if (
                getResourceByUniqueIdentifier(rhsItem.value) ||
                rhsItem.parent
            ) {
                // if it's a store element it's FEROV dataType is 'REFERENCE', or it may be a faked element e.g. global constant false
                rhsdt = getFerovDataTypeForValidId(rhsItem.value);
            } else if (this.isPicklistItem(rhsItem)) {
                // if picklist, the value should be the displayText that the user sees
                rhs = rhsItem.displayText;
            } else {
                rhs = event.detail.displayText;
                error = genericErrorMessage;
            }
        } else if (event.detail.isMergeField) {
            rhsdt = FEROV_DATA_TYPE.REFERENCE;
        }

        const expressionUpdates = {
            [RHS]: { value: rhs, error }
        };
        // if the rhs is a fer, we can store it as a single value without needing to preserve datatype or guid separately
        if (!this.rhsIsFer) {
            expressionUpdates[RHSDT] = { value: rhsdt, error: CLEAR_ERROR };
        }
        this.fireRowContentsChangedEvent(expressionUpdates);
    }

    isPicklistItem(rhsItem) {
        const matchPicklistItem = picklistItem => {
            if (picklistItem.label) {
                return (
                    picklistItem.value + '-' + picklistItem.label ===
                    rhsItem.value
                );
            }
            return picklistItem.value === rhsItem.value;
        };
        return (
            this.lhsActivePicklistValues &&
            this.lhsActivePicklistValues.find(matchPicklistItem)
        );
    }

    fireRowContentsChangedEvent(newExpression) {
        this._rhsParamTypes = undefined;
        const rowContentsChangedEvent = new RowContentsChangedEvent(
            newExpression
        );
        this.dispatchEvent(rowContentsChangedEvent);
    }

    /**
     * To build menu data for a set of fields, information is needed about the parent object of those fields
     * @returns {Object} the parent of the fields, or a mock object with the necessary information
     */
    getLhsParent() {
        return this.objectType &&
            this._lhsDisplayOption === LHS_DISPLAY_OPTION.SOBJECT_FIELD
            ? // This shape is needed for checking preFetchedFields & mutating to combobox field shape
              {
                  objectType: this.objectType,
                  value: this.objectType,
                  subtype: this.objectType,
                  dataType: FLOW_DATA_TYPE.SOBJECT.value
              }
            : this.lhsValue.parent;
    }

    operatorForRules() {
        return this.hideOperator ? RULE_OPERATOR.ASSIGN : this.operatorValue;
    }
}
