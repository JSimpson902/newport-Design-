import { getElementFromParentElementCache } from 'builder_platform_interaction/comboboxCache';
import {
    addCurlyBraces,
    isObject,
    isReference,
    isUndefinedOrNull,
    isValidNumber,
    sanitizeBoolean,
    splitStringBySeparator
} from 'builder_platform_interaction/commonUtils';
import { $LABEL, FLOW_DATA_TYPE, isComplexType } from 'builder_platform_interaction/dataTypeLib';
import {
    createMetadataDateTime,
    formatDateTime,
    getFormat,
    isValidFormattedDateTime,
    isValidMetadataDateTime,
    normalizeDateTime
} from 'builder_platform_interaction/dateTimeUtils';
import {
    ComboboxStateChangedEvent,
    EditMergeFieldPillEvent,
    FetchMenuDataEvent,
    FilterMatchesEvent,
    ItemSelectedEvent,
    NewResourceEvent,
    RemoveMergeFieldPillEvent
} from 'builder_platform_interaction/events';
import { COMBOBOX_NEW_RESOURCE_VALUE } from 'builder_platform_interaction/expressionUtils';
import {
    isTextWithMergeFields,
    validateMergeField,
    validateTextWithMergeFields
} from 'builder_platform_interaction/mergeFieldLib';
import { getPillLabel, getPillTooltip } from 'builder_platform_interaction/pillLib';
import { LIGHTNING_INPUT_VARIANTS } from 'builder_platform_interaction/screenEditorUtils';
import { commonUtils } from 'builder_platform_interaction/sharedUtils';
import {
    isNonRecordGlobalResourceId,
    isRecordPriorSystemVariableIdentifier,
    isRecordSystemVariableIdentifier
} from 'builder_platform_interaction/systemLib';
import {
    SYSTEM_VARIABLE_RECORD_PREFIX,
    SYSTEM_VARIABLE_RECORD_PRIOR_PREFIX
} from 'builder_platform_interaction/systemVariableConstantsLib';
import { api, LightningElement, track, unwrap } from 'lwc';
import { LABELS } from './comboboxLabels';
import { getMenuLength, setSelectableMenuItem, sliceMenu } from './utils';

const { format } = commonUtils;

const SELECTORS = {
    GROUPED_COMBOBOX: 'lightning-grouped-combobox',
    BASE_COMBOBOX: 'lightning-base-combobox',
    INPUT: 'input',
    PILL: 'lightning-pill'
};

/**
 * Error message map for validation of literal value.
 */
const ERROR_MESSAGE = {
    [FLOW_DATA_TYPE.CURRENCY.value]: LABELS.currencyErrorMessage,
    [FLOW_DATA_TYPE.NUMBER.value]: LABELS.numberErrorMessage,
    [FLOW_DATA_TYPE.DATE.value]: format(LABELS.dateErrorMessage, getFormat()),
    [FLOW_DATA_TYPE.DATE_TIME.value]: format(LABELS.datetimeErrorMessage, getFormat(true)),
    [FLOW_DATA_TYPE.BOOLEAN.value]: LABELS.genericErrorMessage,
    GENERIC: LABELS.genericErrorMessage,
    REQUIRED: LABELS.requiredErrorMessage
};

/**
 * This regex looks for potential merge fields. Not everything this regex catches is necessarily a valid dev name
 */
const MERGE_FIELD_REGEX = new RegExp('^[a-zA-Z][a-zA-Z0-9_]*:?[a-zA-Z0-9_]*$');

const isMatchWithTrailingSeparator = (text: string, textWithSeparatorAndBracket: string, separator: string): boolean =>
    `${text.substring(0, text.length - 1)}${separator}}` === textWithSeparatorAndBracket;

type Pill = {
    iconName: string;
    label: string;
};

type State = {
    displayText: string;
    showActivityIndicator: boolean;
    forceShowActivityIndicator: boolean;
    inputIcon: string;
    menuData: any[];
    menuLength: number;
    currentMenuData: any[];
    currentMenuLength: number;
    disabled: boolean;
    pill: Pill | null;
};

/**
 * The maximum number of items to add to the grouped combobox at a time: initially and as the item list gets scrolled.
 * TODO: Make this a property of the component and deprecate the property renderIncrementally.
 */
export const MENU_DATA_PAGE_SIZE = 50;

/**
 * Lightning grouped combobox wrapper.
 *
 * Incremental listbox rendering.
 * The grouped combobox is sensitive to the number of items it displays: the more items it has to
 * display the longer it will take to render the list initially. General observations indicate 100 items is
 * a reasonable maximum when the rendering delay is hardly noticeable. To address the issue when the number
 * of menu items provided is large, the combobox can perform incremental rendering of the menu items.
 * With the incremental rendering enabled (see the property renderIncrementally), the combobox initially picks
 * only a few items from the start and shows just those. Later on more items get added as the user scrolls
 * down through the list and reaches the bottom.
 *
 * @fires ComboboxStateChangedEvent
 * @fires FetchMenuDataEvent
 * @fires FilterMatchesEvent
 * @fires ItemSelectedEvent
 * @fires NewResourceEvent
 */
export default class Combobox extends LightningElement {
    static SELECTOR = 'builder_platform_interaction-combobox';
    labels = LABELS;

    /**
     * @typedef {Object} Pill - a pill
     * @property {string} iconName - icon name (eg: utility:text)
     * @property {string} label - label
     */

    /**
     * @property {Array} menuData - A full list of combobox items.
     * @property {number} menuLength - Total number of items in a flattened menu.
     * @property {number} currentMenuData - A list of items to display in the combobox. A subset of the full list of items.
     * @property {number} currentMenuLength - Total number of items in a flattened current menu.
     * @property {boolean} disabled - disabled status
     * @property {Pill} pill - pill object
     * @property {boolean} hasPill - is in pill mode?
     */
    @track
    state: State = {
        displayText: '',
        showActivityIndicator: false,
        forceShowActivityIndicator: false,
        inputIcon: 'utility:search',
        menuData: [],
        menuLength: 0,
        currentMenuData: [],
        currentMenuLength: 0,
        disabled: false,
        pill: null
    };

    @api
    position = null;

    @api
    fieldLevelHelp;
    _waitingForMenuDataDropDown: any;
    _placeholder: any;
    _messageWhenValueMissing: any;
    _initialyRendered: any;
    _isPillClicked: any;
    _itemSelected: any;
    item: any;

    /**
     * Force the activity indicator
     */
    set showActivityIndicator(value) {
        this.state.forceShowActivityIndicator = value;
    }

    @api
    get showActivityIndicator() {
        return this.state.forceShowActivityIndicator || this.state.showActivityIndicator;
    }

    set inlineItem(item) {
        let newItem = item;
        if (item) {
            if (!item.value) {
                newItem = { ...item, value: item.guid };
            }
            // eslint-disable-next-line @lwc/lwc/no-api-reassignments
            this.value = newItem;
            this._groupedComboboxFocus();
            this.fireComboboxStateChangedEvent();
        }
    }

    @api
    get inlineItem() {
        return this._item;
    }

    /**
     * Label for combobox.
     * If empty no label.
     *
     * @param {string} value The label value to set
     */
    set label(value) {
        if (!value) {
            this._comboboxVariant = LIGHTNING_INPUT_VARIANTS.LABEL_HIDDEN;
        } else {
            this._comboboxLabel = value;
        }
    }

    @api
    focus(): void {
        this._groupedComboboxFocus();
    }

    @api
    get label() {
        return this._comboboxLabel;
    }

    /**
     * Variant type for grouped-combobox
     * Must be from the LIGHTNING_INPUT_VARIANTS const
     *
     * @param {string} value The variant type to set
     */
    set variant(value) {
        if (value) {
            for (const key in LIGHTNING_INPUT_VARIANTS) {
                if (LIGHTNING_INPUT_VARIANTS[key] === value) {
                    this._comboboxVariant = value;
                    return;
                }
            }

            throw new Error(
                `Variant must either be '${LIGHTNING_INPUT_VARIANTS.STANDARD}' or '${LIGHTNING_INPUT_VARIANTS.LABEL_HIDDEN}'!`
            );
        }
    }

    @api
    get variant() {
        return this._comboboxVariant;
    }

    /**
     * Pass the error message on to lightning-grouped-combobox
     *
     * @param {String | null } error - the new error message
     */
    set errorMessage(error) {
        if (error || error === null || error === '') {
            this.setErrorMessage(error);
        }
    }

    @api
    get errorMessage(): string | null {
        return this._errorMessage;
    }

    /**
     * True: allow literal or reference
     * False : allow only reference
     *
     * @param {string | boolean} isAllowed value to set allow literals
     */
    set literalsAllowed(isAllowed) {
        const previousIsLiteralAllowed = this._isLiteralAllowed;
        this._isLiteralAllowed = sanitizeBoolean(isAllowed);
        if (this._isValidationEnabled && previousIsLiteralAllowed !== this._isLiteralAllowed) {
            this._needsValidationOnEnable = true;
            this.doValidation();
            this.fireComboboxStateChangedEvent();
        }
    }

    @api
    get literalsAllowed(): boolean {
        return (
            this._isLiteralAllowed &&
            !(isComplexType(this._dataType) || this._dataType === FLOW_DATA_TYPE.BOOLEAN.value)
        );
    }

    /**
     * If passing in a MenuItem, it must have a value and displayText.
     * If the item is the second level, then parent must also be passed in.
     */

    /**
     * Input value for the combobox.
     * Combobox returns date time literal value as ISO8601 UTC date string
     * Combobox accepts date time literals of ISO8601 format
     *
     * @param {menuDataRetrieval.MenuItem | string} itemOrDisplayText - The value of the combobox
     */
    set value(itemOrDisplayText) {
        this._isNormalized = false;
        let displayText;
        if (isObject(itemOrDisplayText)) {
            if (itemOrDisplayText.value) {
                this._mergeFieldLevel = 1;
                const item = unwrap(itemOrDisplayText);
                displayText = this.syncValueAndDisplayText(item);
                const foundItem = this.findItem(itemOrDisplayText.value);
                // TODO: W-5314359 remove once loop editor change is done
                if (foundItem) {
                    this._item = { ...foundItem };
                } else {
                    this._item = { ...item };
                }

                this._item.displayText = displayText;
                // set the base value to parent for fetching previous level
                if (itemOrDisplayText.parent) {
                    this._base = itemOrDisplayText.parent.displayText;
                    this._mergeFieldLevel = this.getMergeFieldLevel(itemOrDisplayText);
                }
            } else {
                throw new Error('Setting an item on Flow Combobox without a value property!');
            }
        } else {
            if (!itemOrDisplayText && this.state.displayText) {
                if (this.state.pill && !this.hasPillError) {
                    this.state.pill = null;
                }

                if (this._mergeFieldLevel > 1) {
                    this.fireFetchMenuDataEvent();
                } else {
                    this.fireFilterMatchesEvent('', false);
                }
            }

            this._item = null;
            displayText = this.getStringValue(unwrap(itemOrDisplayText));
            displayText = this.normalizeIfMetadataDateTime(displayText);
            this._mergeFieldLevel = 1;
        }

        this.state.displayText = displayText;
        this.updateInputIcon();
        this.setMergeFieldState();

        this._isUserBlurred = false;
    }

    getMergeFieldLevel(itemOrDisplayText) {
        let mergeFieldLevel = 1;
        let item = itemOrDisplayText;
        while (item.parent) {
            mergeFieldLevel++;
            item = item.parent;
        }
        return mergeFieldLevel;
    }

    /**
     * Returns the Menu Item associated with the combobox value or the literal string value if no item has been selected
     *
     * @returns {menuDataRetrieval.MenuItem | string} the current value of the combobox
     */
    @api
    get value() {
        return this._item ? this._item : this.literalValue;
    }

    /**
     * Possible datatypes for this combobox.
     * Needed for validation for literal and showing date picker for date/datetime.
     *
     * @param {string} dataType The FlowDataTypes that this combobox accepts.
     */
    set type(dataType) {
        if (dataType && dataType.toUpperCase) {
            if (!Object.values(FLOW_DATA_TYPE).find((type) => type.value.toUpperCase() === dataType.toUpperCase())) {
                throw new Error(`Data type must be a valid Flow Data Type but instead was ${dataType}`);
            }
            this._dataType = dataType;

            this.state.displayText = this.normalizeIfMetadataDateTime(this.state.displayText);

            if (this._isValidationEnabled) {
                this._needsValidationOnEnable = true;
                this.doValidation();
                this.fireComboboxStateChangedEvent();
            } else {
                this._isValidationEnabled = true;
            }
        } else {
            this._dataType = null;
        }
    }

    @api
    get type() {
        return this._dataType;
    }

    /**
     * Menu items that the combobox would show.
     * Expected in the exact format the lightning-grouped-combobox needs.
     *
     * @param {Array} data - the menu data
     */
    set menuData(data) {
        this.state.menuData = data;
        this._setCurrentMenuData();
        this.state.showActivityIndicator = false;
        if (this._waitingForMenuDataDropDown) {
            const combobox = this.getGroupedCombobox() as any;
            if (combobox) {
                combobox.focusAndOpenDropdownIfNotEmpty();
            }
            this._waitingForMenuDataDropDown = false;
        }
        if (this.hasPill) {
            // recreate the pill : the icon comes from the menu data
            this._createPill(true);
        }
    }

    @api
    get menuData() {
        return this.state.menuData;
    }

    @api
    get currentMenuData() {
        return this.state.currentMenuData;
    }

    @api
    get currentMenuLength() {
        return this.state.currentMenuLength;
    }

    set disabled(disabled) {
        const wasDisabled = this.state.disabled;
        this.state.disabled = !!disabled;

        if (this.state.disabled) {
            this.state.showActivityIndicator = false;
        }

        if (!this.state.disabled && wasDisabled) {
            if (this._needsValidationOnEnable) {
                this.doValidation();
                this._createPill();
                this.fireComboboxStateChangedEvent();
            } else {
                this._createPill();
            }
        }
    }

    /**
     * Set this attribute to disable the combobox.
     *
     * @type {boolean}
     */
    @api
    get disabled() {
        return this.state.disabled;
    }

    /**
     * Placeholder text for the combobox input field.
     *
     * @type {string}
     */
    set placeholder(message) {
        this._placeholder = message;
    }

    @api
    get placeholder() {
        if (this.isDateOrDateTime && this.literalsAllowed) {
            return getFormat(this.isDateTime);
        }
        if (!this._placeholder) {
            this._placeholder = LABELS.defaultPlaceholder;
        }
        return this._placeholder;
    }

    /**
     * Boolean to mark combobox input as required field.
     * Defaults to false.
     *
     * @type {string}
     */
    @api required = false;

    /**
     * The error message to display when the combobox is required, but has no value
     *
     * @returns {string | null} the message to display
     */
    @api
    get messageWhenValueMissing(): string | null {
        if (!this._messageWhenValueMissing) {
            this._messageWhenValueMissing = ERROR_MESSAGE.REQUIRED;
        }
        return this._messageWhenValueMissing;
    }

    /**
     * The allowed param types based on the rule service. Used for the merge field validation if present.
     *
     * @type {Object}
     */
    @api
    allowedParamTypes = null;

    // Enables incremental menu rendering when a limited number of items is rendered initially and more items get added
    // as the user scrolls down in the list. This is a temporary property and will be removed once the feature is
    // approved for broad use.
    _renderIncrementally = false;

    _stashedRenderIncrementally;

    set renderIncrementally(value) {
        value = !!value;
        if (this._renderIncrementally !== value) {
            this._renderIncrementally = value;
            this._setCurrentMenuData();
        }
    }

    @api
    get renderIncrementally() {
        return this._renderIncrementally;
    }

    /**
     * Child of a {@link BaseExpressionBuilder} component?
     */
    @api
    hasBaseExpressionBuilderParent = false;

    /**
     * Returns the literal value of the combobox (could be different from the displayed value)
     */
    get literalValue() {
        if (this.isDateOrDateTime && this.literalsAllowed && !this.errorMessage) {
            return createMetadataDateTime(this.state.displayText, this.isDateTime) || this.state.displayText;
        }
        return this.state.displayText;
    }

    get isDateOrDateTime() {
        return this.type === FLOW_DATA_TYPE.DATE.value || this.type === FLOW_DATA_TYPE.DATE_TIME.value;
    }

    get isDateTime() {
        return this.type === FLOW_DATA_TYPE.DATE_TIME.value;
    }

    get showLabelInPillMode() {
        return this.hasPill && this._comboboxVariant !== LIGHTNING_INPUT_VARIANTS.LABEL_HIDDEN;
    }

    renderedCallback() {
        if (!this._isInitialErrorMessageSet && this._errorMessage) {
            this.setErrorMessage(this._errorMessage);
        }

        if (!this._initialyRendered) {
            this._initialyRendered = true;
            if (this.hasBaseExpressionBuilderParent) {
                this._createPill();
            }
        } else if (this._isPillRemoved) {
            this._isPillRemoved = false;
            this._groupedComboboxFocus();
        } else if (!this._isPillClicked && !this._itemSelected && !this.hasBaseExpressionBuilderParent) {
            this._createPill();
        }
    }

    connectedCallback() {
        this._isInitialized = true;
        this.state.displayText = this.normalizeIfMetadataDateTime(this.state.displayText);
    }

    /**
     * If set to true, will allow fetching of different levels of menu data
     */
    @api
    enableFieldDrilldown = false;

    @api
    enableLookupTraversal = false;

    /**
     * Blocks all the data validation on the component.
     *
     * @type {boolean}
     */
    @api
    blockValidation = false;

    /**
     * Separator for multi-level menu data traversal.
     * Defaults to period.
     *
     * @type {string}
     */
    @api
    separator = '.';

    /**
     * Run validation on this combobox again
     *
     * @returns {string | null} current error message
     */
    @api
    validate() {
        this.doValidation();
        return this._errorMessage;
    }

    /**
     * Is pill supported?
     * false by default
     *
     * @type {boolean}
     */
    @api
    isPillSupported = false;

    /**
     * Get pill if any?
     *
     * @returns {Pill|null} pill object if any null otherwise
     */
    @api
    get pill(): Pill | null {
        return this.state.pill;
    }

    /**
     * has Pill?
     */
    @api
    get hasPill(): boolean {
        return this.isPillSupported && !!this.state.pill;
    }

    /**
     * Removes the pill (ie: reset corresponding internal component state, no {@link RemoveMergeFieldPillEvent} dispatched)
     */
    @api
    resetPill() {
        this.state.pill = null;
        this._isPillRemoved = false;
        this._itemSelected = false;
        this._isPillClicked = false;
    }

    /**
     * Returns pill tooltip
     *
     * @returns {string} pill tooltip with error message if any
     */
    @api
    get pillTooltip(): string {
        return this.state.pill ? getPillTooltip(this.state.pill.label, this._errorMessage) : '';
    }

    /**
     * Is pill in error mode?
     *
     * @returns {boolean} true if pill in error mode, false otherwise?
     */
    @api
    get hasPillError(): boolean {
        return !!this._errorMessage;
    }

    /* ***************** */
    /* Private Variables */
    /* ***************** */

    /**
     * This is true only when the expression is a valid expression identifier.
     * Eg: {!testVar} true
     *     {!testVar&} false since it is a literal
     */
    _isMergeField = false;

    @track
    _comboboxVariant = LIGHTNING_INPUT_VARIANTS.STANDARD;

    @track
    _comboboxLabel;

    _dataType;

    _isLiteralAllowed = true;

    _itemCache = {};

    private _errorMessage: string | null = null;

    _item;

    /**
     * This is the base for when you get past the first-level of an item.
     * Will be the value of the selected item.
     */
    _base;

    /**
     * This will be false only for the first time the component is rendered.
     */
    _isValidationEnabled = false;

    /**
     * Flag to set the initial error message on renderedCallback only once.
     */
    _isInitialErrorMessageSet = false;

    /**
     * Flag indicating whether all attributes have been set
     */
    _isInitialized = false;

    /**
     * Flag indicating that the current set value is due to the user blurring out
     * in which case, the user explicitly desired an sobject and thus set value will not append a separator.
     *
     * This will be used (and managed) in set value
     */
    _isUserBlurred = false;

    /**
     * This will keep track of the merge field level for the combobox.
     * The merge field level is incremented only when hasNext is true.
     * {!myAccount.Name} - 2
     * {!invalidVar.Name} - 1
     */
    _mergeFieldLevel = 1;

    _waitingForMenuDataDropdown = false;

    /**
     * Flag for when combobox needs to normalize the date/time ISO input
     * We only want to normalize a date/time value once
     * True if value has been normalized, false otherwise
     */
    _isNormalized = false;

    /**
     * Combobox does not validate itself when disabled because a disabled combobox does not show errors.
     * However, if an attribute is changed which would normally trigger re-validation, it is tracked with this
     * flag and validation is run when the combobox is enabled
     */
    _needsValidationOnEnable = false;

    /**
     * This variable is used to stop firing oncomboboxstatechanged when a user selected a new inline resource
     * option from the menudata. It is set to true when handleSelect is fired and set back to false in handleBlur
     */
    _isNewInlineResourceSelected = false;

    /**
     * monitoring pill removal in order to render accordingly combobox component or pill one
     * default false
     *
     * @type {boolean}
     */
    private _isPillRemoved = false;

    /* ********************** */
    /*     Event handlers     */
    /* ********************** */

    /**
     * Fires an event to filter the current menu data.
     *
     * @param {Object} event - Event fired from grouped-combobox
     * @fires FilterMatchesEvent
     * @fires FetchMenuDataEvent
     */
    handleTextInput(event) {
        // Do nothing if the event is fired with undefined.  This is catching an issue with IE11 where textinput events
        // are being fired with undefined upon initial element rendering
        if (event.detail.text === undefined) {
            return;
        }

        // Typing should invalidate the selected _item
        this._item = null;

        // Grab the previous value && update the current values
        const previousValue = this.state.displayText;
        this.state.displayText = event.detail.text;
        this.updateInputIcon();

        // set state to resource if value starts with {!, append the closing brace, and place cursor before it
        if (this.state.displayText === '{!' && previousValue === '{' && !this._isMergeField) {
            this._isMergeField = true;
            this.setValueAndCursor('{!}');
        } else {
            this.setMergeFieldState();
        }

        const sanitizedValue = this.getSanitizedValue();

        // Make sure the menu data is up to date with the current value
        // As of 218, we support showing only 2 level of menu data
        if (this.isPotentialField()) {
            // Checks if base is a valid parent element and fetch menu data if so
            this.getParentElementAndFetchFields();
        } else if (this._mergeFieldLevel > 1) {
            // if on the second level and no longer a potential field, get first level menu data
            // TODO check _mergeFieldLevel before setting to null if/when we have fields that have hasNext = true
            this._base = null;
            this.fireFetchMenuDataEvent();
        }

        this.fireFilterMatchesEvent(this.getFilterText(sanitizedValue), this._isMergeField);
    }

    /**
     * Fires an event to fetch the next level
     *
     * @param {Object} event - Event fired from grouped-combobox
     */
    handleSelect(event) {
        this._itemSelected = true;

        this.restoreRenderIncrementally();

        if (event.detail.value === COMBOBOX_NEW_RESOURCE_VALUE) {
            this._isNewInlineResourceSelected = true;
            this.fireNewResourceEvent();
            return;
        }

        // Get next level menu data if the selected option hasNext
        const item = this.findItem(event.detail.value);
        const itemHasNextLevel = item && item.hasNext;

        // menu data should be filtered using new display text, filtering must be fired before item is selected, as if the user typed the whole string
        if (!itemHasNextLevel) {
            this.fireFilterMatchesEvent(
                this.getFilterText(this.getSanitizedValue(item.displayText)),
                this._isMergeField
            );
        }

        this._item = item;

        if (itemHasNextLevel) {
            this._base = item.displayText;
            this._waitingForMenuDataDropDown = true;
            this.fireFetchMenuDataEvent(item);
        }

        this.setMergeFieldState(item.displayText);
        this.updateInputIcon();

        // And add a separator if selected option has next level
        this.setValueAndCursor(item.displayText, itemHasNextLevel);

        if (!itemHasNextLevel) {
            this.fireItemSelectedEvent(item);
        }
    }

    private restoreRenderIncrementally() {
        if (this._stashedRenderIncrementally != null) {
            this._renderIncrementally = this._stashedRenderIncrementally;
        }
    }

    /**
     * fires an event to validate combobox value and possibly switch to pill mode
     */
    handleBlur(): void {
        if (this._isNewInlineResourceSelected) {
            this._isNewInlineResourceSelected = false;
            return;
        }
        this.setMergeFieldState(this.state.displayText, true);

        // Remove the last dot from the expression & get the updated menuData
        if (this._isMergeField && this.state.displayText.charAt(this.state.displayText.length - 2) === this.separator) {
            this.state.displayText = `${this.state.displayText.substring(0, this.state.displayText.length - 2)}}`;
            // TODO check _mergeFieldLevel before setting to null if/when we have fields that have hasNext = true
            this._base = null;
            this.fireFetchMenuDataEvent(this.item ? this.item.parent : null);
        }

        // If value is null, check if there is one item associated with displayText
        const item = this.matchTextWithItem();
        if (item && this.state.displayText !== item.displayText) {
            this.state.displayText = item.displayText;
            this._item = item;
        }

        this.doValidation();
        this._createPill();
        this._isUserBlurred = true;

        // Do not show the menu data dropdown after blur
        this._waitingForMenuDataDropDown = false;
        this.fireComboboxStateChangedEvent();
    }

    /**
     * On focus, filter the menu data based on the current text displayed
     */
    handleFocus() {
        if (this.state.displayText) {
            // This is needed since in the case of errors, item is not defined in the ComboboxStateChangedEvent
            // The parent has no idea what the menu data should be, so fetch those fields when necessary
            if (this.isPotentialField()) {
                this.getParentElementAndFetchFields();
            }
            this.fireFilterMatchesEvent(this.getFilterText(this.getSanitizedValue()), this._isMergeField);
        }
    }

    /**
     * Add more items to display in the combobox once the bottom of the list is reached while scrolling.
     *
     * @param event
     */
    handleEndReached(event) {
        event.stopPropagation();
        event.preventDefault();

        // Add more menu items to display, if the menu list shown is partial.
        if (this._renderIncrementally) {
            this._sliceMenuNext();
        }
    }

    /**
     * On pill remove event - Resets displayed text and menu data
     *
     * @param {CustomEvent} event - lightning pill component remove event
     *  Fires RemoveMergeFieldPillEvent event
     */
    handlePillRemove(event: CustomEvent): void {
        event.stopPropagation();
        event.preventDefault();
        this._clearPill();
        this._resetMenuDataAndDisplayText();
        this.dispatchEvent(new RemoveMergeFieldPillEvent(this._item));
    }

    /**
     * On pill click event
     *
     * @param {CustomEvent} event - lightning pill component click event
     * Fires EditMergeFieldPillEvent event
     */
    handlePillClick(event: CustomEvent): void {
        event.stopPropagation();
        event.preventDefault();
        this._isPillClicked = true;
        this._clearPill();
        this.dispatchEvent(new EditMergeFieldPillEvent(this._item));
    }

    /* **************************** */
    /*    Private Helper methods    */
    /* **************************** */

    /**
     * Returns the string value of numbers and booleans
     *
     * @param {*} valueToConvert The value to convert to string
     * @returns {string} The string value
     */
    getStringValue(valueToConvert) {
        if (isUndefinedOrNull(valueToConvert)) {
            valueToConvert = '';
        } else if (['number', 'boolean'].includes(typeof valueToConvert)) {
            return valueToConvert.toString();
        } else if (typeof valueToConvert !== 'string') {
            throw new Error(`Trying to set value of invalid type ${typeof valueToConvert} on Flow Combobox!`);
        }
        return valueToConvert;
    }

    /**
     * Set the resource state if the value start with '{!' and ends with '}'
     *
     * @param {string} value the value to set state on, defaults to displayText
     * @param {boolean} isStrictMode whether or not merge fields should be strictly evaluated (should be true for validation)
     */
    setMergeFieldState(value = this.state.displayText, isStrictMode = false) {
        this._isMergeField = isReference(value) && (!isStrictMode || !this.isExpressionIdentifierLiteral(value, true));
    }

    /**
     * Determines if the displayText is in the format of a field
     *
     * @returns {boolean} returns true if the current displayText is a potential field
     */
    isPotentialField(): boolean {
        const field = splitStringBySeparator(this.getSanitizedValue(), this.separator)[1];
        return this._isMergeField && !isUndefinedOrNull(field);
    }

    /**
     * Grabs the flow element from the cache/store and gets the fields for the item
     */
    getParentElementAndFetchFields() {
        const devNames = splitStringBySeparator(this.getSanitizedValue(), this.separator);
        let baseMergeField = addCurlyBraces(devNames.slice(0, devNames.length - 1).join(this.separator));
        const item = this.matchTextWithItem(baseMergeField, false);
        if (item && baseMergeField !== item.displayText) {
            const newDisplayText = `${item.displayText.substring(0, item.displayText.length - 1)}${this.separator}${
                devNames[devNames.length - 1]
            }}`;
            this.setValueAndCursor(newDisplayText);
            baseMergeField = item.displayText;
        }
        if (this._base !== baseMergeField) {
            // get parent element from combobox cache
            const parentElementInComboboxShape = item ? item : getElementFromParentElementCache(baseMergeField);
            if (parentElementInComboboxShape) {
                this._base = baseMergeField;
                this.fireFetchMenuDataEvent(parentElementInComboboxShape);
            }
        }
    }

    /**
     * Dispatches the FetchMenuData Event & makes the spinner active
     *
     * @param {Object} item - the selected item to fetch the next level of menu data.
     *                        If undefined or null first level of menu data is fetched.
     */
    fireFetchMenuDataEvent(item?) {
        if (this.enableFieldDrilldown) {
            this._clearMenuData();
            if (item) {
                if (!item.hasNext) {
                    return;
                }
                this._mergeFieldLevel = this.getMergeFieldLevel(item) + 1;
            } else {
                this._mergeFieldLevel = 1;
            }
            const fetchMenuDataEvent = new FetchMenuDataEvent(item);
            this.dispatchEvent(fetchMenuDataEvent);
            this.state.showActivityIndicator = true;

            // @W-10681666: force render incrementally for labels
            if (item?.subtype === $LABEL) {
                this._stashedRenderIncrementally = this._renderIncrementally;
                this._renderIncrementally = true;
            } else if (this._stashedRenderIncrementally != null) {
                this.restoreRenderIncrementally();
            }
        }
    }

    /**
     * Dispatches the FilterMatches Event & makes the spinner active
     *
     * @param {string} value the value to filter on
     * @param {boolean} isMergeField true if the combobox value is a merge field, false otherwise
     */
    fireFilterMatchesEvent(value, isMergeField) {
        const filterMatchesEvent = new FilterMatchesEvent(value, isMergeField);
        this.dispatchEvent(filterMatchesEvent);
        this.state.showActivityIndicator = true;
    }

    /**
     * Fire value change event with error message if provided
     * NOTE: This event is only fired if there have been changes
     */
    fireComboboxStateChangedEvent() {
        const comboboxStateChangedEvent = new ComboboxStateChangedEvent(
            this._item,
            this.literalValue,
            this._errorMessage,
            this._isMergeField
        );
        this.dispatchEvent(comboboxStateChangedEvent);
    }

    /**
     * Fire new resource event.
     */
    fireNewResourceEvent() {
        const newResourceEvent = new NewResourceEvent(this.position);
        this.dispatchEvent(newResourceEvent);
    }

    /**
     * Fire item selected event
     *
     * @param {Object} item The item that was selected
     */
    fireItemSelectedEvent(item) {
        const itemSelectedEvent = new ItemSelectedEvent(item);
        this.dispatchEvent(itemSelectedEvent);
    }

    /**
     * Find a single item that matches with text if any and if _item isn't already set
     *
     * @param {string} text The text to match with an item's displayText
     * @param {boolean} setItem set _item if a match is found
     * @param {boolean} forced set _item even if it does already exists
     * @returns {MenuItem} returns the item if found, otherwise undefined
     */
    matchTextWithItem(text = this.state.displayText, setItem = true, forced = false) {
        let matchedItem;
        if ((!this._item || forced) && text && this.state.menuData) {
            const matchedItems: any[] = [];
            const groupOrItemCount = this.state.menuData.length;
            for (let i = 0; i < groupOrItemCount; i++) {
                const currentMenuData: any = this.state.menuData[i];
                if (currentMenuData.items) {
                    // a menu data group
                    currentMenuData.items.forEach((item) => {
                        if (item.displayText && item.displayText.toLowerCase() === text.toLowerCase()) {
                            matchedItems.push(item);
                        }
                    });
                } else {
                    // a menu data item
                    const item: any = this.state.menuData[i];
                    if (item.displayText && item.displayText.toLowerCase() === text.toLowerCase()) {
                        matchedItems.push(item);
                    }
                }
            }
            if (matchedItems.length === 1) {
                matchedItem = matchedItems[0];
                if (setItem) {
                    this._item = matchedItem;
                }
            }
        }
        return matchedItem;
    }

    /**
     * Grabs the item associated with the selected value.
     * If no value is found, returns undefined
     *
     * @param {string} value The unique value to find the item
     * @returns {Object} the return value
     */
    findItem(value) {
        let foundItem;
        let groupCount;

        if (this.state.menuData) {
            groupCount = this.state.menuData.length;
        }
        // check if the item has already been cached to avoid running through the nested arrays
        if (
            value !== SYSTEM_VARIABLE_RECORD_PREFIX &&
            value !== SYSTEM_VARIABLE_RECORD_PRIOR_PREFIX &&
            this._itemCache[value]
        ) {
            return this._itemCache[value];
        }
        for (let i = 0; i < groupCount; i++) {
            const groupOrItem: any = this.state.menuData[i];
            if (groupOrItem.items) {
                // a menu data group
                foundItem = groupOrItem.items.find((item) => {
                    // add item to the cache whether or not it's the foundItem
                    this._itemCache[item.value] = item;
                    return item.value === value;
                });
            } else if (groupOrItem.value === value) {
                // a menu data item
                this._itemCache[groupOrItem.value] = groupOrItem;
                foundItem = groupOrItem;
            }
            if (foundItem) {
                return foundItem;
            }
        }
        return foundItem;
    }

    /**
     * Returns the input element.
     *
     * @returns {HTMLElement} the input element.
     */

    getInputElement() {
        const combobox = this.getGroupedCombobox();
        return combobox.shadowRoot.querySelector(SELECTORS.BASE_COMBOBOX).shadowRoot.querySelector(SELECTORS.INPUT);
    }

    /**
     * Sets the dot for next level and places the cursor before the closing brace
     *
     * @param {string} value the value to set
     * @param {boolean} hasNextLevel whether or not the selected item has a next level
     */
    setValueAndCursor(value, hasNextLevel = false) {
        const input = this.getInputElement() as any;

        // Add a separator to the end if selected value has a next level
        if (hasNextLevel) {
            if (isReference(value)) {
                value = `${value.substring(0, value.length - 1)}${this.separator}}`;
            } else {
                value += this.separator;
            }
        }

        this.state.displayText = input.value = value;
        // Lightning components team may provide a method to accomplish this in the future
        if (this._isMergeField) {
            input.setSelectionRange(this.state.displayText.length - 1, this.state.displayText.length - 1);
        }
    }

    /**
     * Get the proper value depending on the combobox state.
     * If in resource state, returns value without {! & }
     *
     * @param {string} value The value to sanitize. Defaults to displayText
     * @returns {string} The resource value or full text
     */
    getSanitizedValue(value = this.state.displayText) {
        if ((value === this.state.displayText && this._isMergeField) || isReference(value)) {
            return value.substring(2, value.length - 1);
        }
        return value;
    }

    /**
     * Returns value after the last . if in resource state.
     * Ex: MyAccount.MyN would return MyN
     *
     * @param {string} sanitizedValue the already sanitized value
     * @returns {string} the filter text to search on
     */
    getFilterText(sanitizedValue) {
        const lastIndex: number = sanitizedValue.lastIndexOf(this.separator);
        if (this._isMergeField && lastIndex !== -1 && (this._item || this._base)) {
            return sanitizedValue.substring(lastIndex + 1);
        }
        return sanitizedValue;
    }

    /**
     * Input icon search and don't show spinner for no selection otherwise clear.
     */
    updateInputIcon() {
        if (this.state.displayText && this.state.displayText.length > 0) {
            this.state.inputIcon = '';
        } else {
            this.state.inputIcon = 'utility:search';
            this.state.showActivityIndicator = false;
        }
    }

    /**
     * Clears an error message if any previously set on the combobox.
     */
    clearErrorMessage() {
        this._isInitialErrorMessageSet = true;
        this._errorMessage = null;
    }

    /**
     * Set the error message on the combobox.
     *
     * @param {string} customErrorMessage to be set on the combobox.
     */
    setErrorMessage(customErrorMessage) {
        const groupedCombobox = this.getGroupedCombobox() as any;
        if (groupedCombobox) {
            groupedCombobox.setCustomValidity(customErrorMessage);
            groupedCombobox.showHelpMessageIfInvalid();

            this._isInitialErrorMessageSet = true;
        }
        this._errorMessage = customErrorMessage;
    }

    /**
     * Returns the lightning grouped combobox element.
     *
     * @returns {Object} the grouped combobox element.
     */
    getGroupedCombobox() {
        return this.template.querySelector(SELECTORS.GROUPED_COMBOBOX) as any;
    }

    /**
     * In most cases returns the item.displayText.  Returns the existing state.displayText only if:
     * 1. This is not initialization
     * 2. This is not being called as a reaction to the user blurring
     * 3. The item has next
     * 4. The item.displayText with a separator inserted before the closing bracket matches state.displayText
     * This catches the case where a trailing separator was stripped before firing ItemSelected and the parent component
     * passes this new value (without the separator) back down.  In which case, we still want the combobox display to
     * include the separator
     *
     * @param {Object} item an item
     * @returns {string} The display text to be used
     */
    syncValueAndDisplayText(item) {
        let displayText = this.getStringValue(item.displayText);

        if (
            this._isInitialized &&
            !this._isUserBlurred &&
            item.hasNext &&
            isMatchWithTrailingSeparator(item.displayText, this.state.displayText, this.separator)
        ) {
            displayText = this.state.displayText;
        }

        return displayText;
    }

    /**
     * Built pill (if supported) for merge field and update corresponding tracked field
     *
     * @param force
     * @private
     */
    private _createPill(force = false): void {
        if (
            this.isPillSupported &&
            !this.disabled &&
            this._isMergeField &&
            (!this.pill || force) &&
            this._item &&
            this.state.displayText &&
            !this.errorMessage
        ) {
            // item not yet fully loaded
            if (!this._item.iconName) {
                this.matchTextWithItem(this.state.displayText, true, true);
            }

            this.state.pill = {
                label: getPillLabel(this._item),
                iconName: this._item.iconName
            };
            this._isPillRemoved = false;
            this._isPillClicked = false;
        }
    }
    /**
     * Reset tracked pill field
     */
    private _clearPill(): void {
        this.state.pill = null;
        this._isPillRemoved = true;
    }

    /**
     * Reset current selected display text and built menuData
     */
    private _resetMenuDataAndDisplayText(): void {
        this.state.displayText = '';
        this._item = null;
        this._base = null;
        this.clearErrorMessage();
        this.fireFetchMenuDataEvent();
    }

    /**
     * Focus on inner lightning-groupedCombobox component
     */
    private _groupedComboboxFocus(): void {
        this.getGroupedCombobox().focus();
    }

    /** */
    /*    Validation Helper methods     */
    /** */

    /**
     * Runs the validation for this combobox
     */
    doValidation() {
        if (this.blockValidation) {
            return;
        }

        this.clearErrorMessage();

        // When combobox is disabled as per design the error message is cleared but the selected value is preserved
        if (this.disabled) {
            return;
        }
        this._needsValidationOnEnable = false;

        if (isTextWithMergeFields(this.state.displayText)) {
            this.validateMultipleMergeFieldsWithText();
        } else {
            this.validateMergeFieldOrLiteral();
        }
    }

    /**
     * Validates text with merge field(s).
     * ex: Hi {!myAccount.Name}!
     */
    validateMultipleMergeFieldsWithText() {
        const mergeFieldsAllowedForDataTypes = [
            FLOW_DATA_TYPE.STRING.value,
            FLOW_DATA_TYPE.PICKLIST.value,
            FLOW_DATA_TYPE.MULTI_PICKLIST.value
        ];

        // merge fields are valid only with literals allowed
        if (!this._isLiteralAllowed) {
            this._errorMessage = ERROR_MESSAGE.GENERIC;
            return;
        }

        if (!mergeFieldsAllowedForDataTypes.includes(this._dataType)) {
            this._errorMessage = ERROR_MESSAGE[this._dataType];
            return;
        }

        this.state.showActivityIndicator = true;

        this.validateUsingMergeFieldLib(validateTextWithMergeFields);
    }

    validateMergeFieldOrLiteral() {
        if (this.state.displayText) {
            if (this._isMergeField) {
                this.validateResource();
            } else {
                this.validateLiteral();
            }
        } else if (this.required) {
            this._errorMessage = this.messageWhenValueMissing;
        }
    }
    /**
     * Validates the literal value entered in combobox.
     */
    validateLiteral() {
        // literals allowed in combobox, validates number, currency (number), date and date time.
        // date and date time converts the input date string to format 'MM/dd/yyyy'
        // & date time string to 'MM/dd/yyyy h:mm a [GMT]ZZ'
        if (this.literalsAllowed) {
            this.validateLiteralForDataType();
        } else if (!this._item) {
            this._errorMessage = ERROR_MESSAGE.GENERIC;
        }
    }

    /**
     * Validates the resource value (value enclosed in {! and } ) selected or entered.
     */
    validateResource() {
        if (this.literalsAllowed && this.isExpressionIdentifierLiteral()) {
            this.validateLiteralForDataType();
        } else {
            let isValidUsingMergeField = true;
            if (this._mergeFieldLevel > 1 || this.allowedParamTypes) {
                isValidUsingMergeField = this.validateUsingMergeFieldLib(validateMergeField);
            }
            // For single level merge field also use menu data
            if (isValidUsingMergeField && this._mergeFieldLevel === 1 && !this._item) {
                this._errorMessage = ERROR_MESSAGE.GENERIC;
            }
        }
    }

    /**
     * Validates the literal value entered in the combobox against the _dataTypes
     */
    validateLiteralForDataType() {
        if (this._dataType) {
            switch (this._dataType) {
                case FLOW_DATA_TYPE.NUMBER.value:
                case FLOW_DATA_TYPE.CURRENCY.value:
                    this.validateNumber();
                    break;
                case FLOW_DATA_TYPE.DATE.value:
                case FLOW_DATA_TYPE.DATE_TIME.value:
                    this.validateDateOrDateTime();
                    break;
                default:
                    break;
            }
        }
    }

    /**
     * Validate the input value is a valid number and set error
     */
    validateNumber() {
        if (!isValidNumber(this.state.displayText)) {
            this._errorMessage = ERROR_MESSAGE[this._dataType];
        }
    }

    validateDateOrDateTime() {
        if (isValidFormattedDateTime(this.state.displayText, this.isDateTime)) {
            this.state.displayText = formatDateTime(this.state.displayText, this.isDateTime);
        } else {
            this._errorMessage = ERROR_MESSAGE[this._dataType];
        }
    }

    /**
     * Validate the merge field or merge fields with text using passed in merge field validation function reference.
     *
     * @param {Function} validateFunctionRef a existing function reference from merge field lib that returns promise.
     * @returns {boolean} true if validation was successful, false otherwise
     */
    validateUsingMergeFieldLib(validateFunctionRef): boolean {
        const errors = validateFunctionRef.call(this, this.state.displayText, {
            allowGlobalConstants: true,
            allowedParamTypes: this.allowedParamTypes,
            allowSObjectFieldsTraversal: this.enableLookupTraversal
        });
        if (errors.length > 0) {
            this._errorMessage = errors[0].message;
            return false;
        }
        return true;
    }

    /**
     * Validates if the expression literal identifier is a valid dev name.
     * Eg: {!testVar} - is a valid expression, returns false
     *     {^testVar} - is a valid expression literal, returns true
     *     {!$GlobalConstant.___}, {!$SystemVariable.___}, and any Global Variable are all expressions, return false
     * Dot at the end is allowed for SObject where dot signifies to fetch next level data
     *
     * @param {string} valueToCheck the value to check, defaults to displayText
     * @param {boolean} allowDotSuffix to allow dot at the end of the expression identifier
     * @returns {*} returns false if invalid dev name chars or regex result.
     */
    isExpressionIdentifierLiteral(valueToCheck = this.state.displayText, allowDotSuffix?) {
        const consecutiveSeparatorsRegex = new RegExp(`\\${this.separator}{2,}`);
        let value;
        let regexResult = true;
        if (isReference(valueToCheck)) {
            value = valueToCheck.substring(2, valueToCheck.length - 1);
        }

        if (isNonRecordGlobalResourceId(value)) {
            return false;
        }

        if (value) {
            // check that there aren't consecutive separators anywhere and doesn't start with a separator
            if (consecutiveSeparatorsRegex.exec(value) || value.startsWith(this.separator)) {
                return true;
            }
            // split the merge field by separator
            const mergeFieldArray = splitStringBySeparator(value, this.separator);
            let i = 0;
            while (regexResult && i < mergeFieldArray.length) {
                // Let the check proceed, if the first part is $Record. This is necessary because $Record isn't
                // a system variable such as the others.
                const currentMergeField = mergeFieldArray[i];
                if (
                    i === 0 &&
                    (isRecordSystemVariableIdentifier(currentMergeField) ||
                        isRecordPriorSystemVariableIdentifier(currentMergeField))
                ) {
                    regexResult = true;
                } else if (currentMergeField) {
                    // don't execute regex on empty strings
                    regexResult = MERGE_FIELD_REGEX.test(currentMergeField);
                }
                i++;
            }
        } else {
            return !allowDotSuffix; // {!} is valid string constant
        }

        if (allowDotSuffix) {
            return !regexResult;
        }

        // The regex is valid dev name regex with optional trailing separator
        // With allowDotSuffix = false we need to check trailing dot does not exists
        return !value.endsWith(this.separator) && !regexResult;
    }

    normalizeIfMetadataDateTime(text: string): string {
        let literal = text;
        if (
            !this._isNormalized &&
            this.isDateOrDateTime &&
            this.literalsAllowed &&
            !this.errorMessage &&
            isValidMetadataDateTime(literal, this.isDateTime)
        ) {
            literal = normalizeDateTime(literal, this.isDateTime);
            this._isNormalized = true;
        }

        return literal;
    }

    _clearMenuData(): void {
        this.state.menuData = [];
        this.state.menuLength = 0;
        this.state.currentMenuData = [];
        this.state.currentMenuLength = 0;
    }

    _setCurrentMenuData() {
        // If there are too many items to display, pick a few from the start and show only those.
        if (this.renderIncrementally) {
            this._sliceMenuFirst();
        } else {
            this.state.currentMenuData = this.state.menuData;
        }
    }

    _sliceMenuFirst() {
        this.state.menuLength = getMenuLength(this.state.menuData);
        if (MENU_DATA_PAGE_SIZE < this.state.menuLength) {
            const result = sliceMenu(this.state.menuData, MENU_DATA_PAGE_SIZE);
            this.state.currentMenuData = result.menu;
            this.state.currentMenuLength = result.length;
        } else {
            this.state.currentMenuData = this.state.menuData;
            this.state.currentMenuLength = this.state.menuLength;
        }
    }

    _sliceMenuNext() {
        if (this.state.menuData && this.state.currentMenuLength < this.state.menuLength) {
            const result = sliceMenu(this.state.menuData, this.state.currentMenuLength + MENU_DATA_PAGE_SIZE);
            // Highlight a very first item in new menu items to ensure the grouped combobox scrolls to it.
            // This is based on the current behavior of the grouped combobox, which always scrolls to a highlighted item
            // each time combobox items get updated. Highlighting of a specific menu item overrides the default combobox
            // behavior, which is to highlight and scroll to a first item in the list.
            setSelectableMenuItem(result.menu, this.state.currentMenuLength, (item) =>
                Object.assign({ highlight: true }, unwrap(item))
            );
            this.state.currentMenuLength = result.length;
            this.state.currentMenuData = result.menu;
        }
    }
}
