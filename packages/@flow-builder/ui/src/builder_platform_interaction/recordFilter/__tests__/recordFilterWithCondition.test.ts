import {
    changeEvent,
    clickEvent,
    deepQuerySelector,
    INTERACTION_COMPONENTS_SELECTORS,
    LIGHTNING_COMPONENTS_SELECTORS,
    setDocumentBodyChildren,
    ticks
} from 'builder_platform_interaction/builderTestUtils';
import {
    AddRecordFilterEvent,
    DeleteRecordFilterEvent,
    PropertyChangedEvent,
    UpdateListItemEvent,
    UpdateRecordFilterEvent
} from 'builder_platform_interaction/events';
import { CONDITION_LOGIC, ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import RecordLookupFilter from 'builder_platform_interaction/recordFilter';
import { RULE_OPERATOR } from 'builder_platform_interaction/ruleLib';
import { createElement } from 'lwc';
import { accountFields } from 'serverData/GetFieldsForEntity/accountFields.json';
import { LABELS } from '../recordFilterLabels';

jest.mock('builder_platform_interaction/fieldToFerovExpressionBuilder', () =>
    require('builder_platform_interaction_mocks/fieldToFerovExpressionBuilder')
);

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

const EMPTY_FILTER_ITEM = {
    operator: { value: '', error: null },
    leftHandSide: { value: '', error: null },
    rightHandSide: { value: '', error: null },
    rightHandSideDataType: { value: '', error: null },
    rowIndex: '326e1b1a-7235-487f-9b44-38db56af4a43'
};

const AND_FILTER_LOGIC = { value: CONDITION_LOGIC.AND, error: null };
const NO_CONDITIONS_FILTER_LOGIC = { value: CONDITION_LOGIC.NO_CONDITIONS, error: null };
const CUSTOM_FILTER_LOGIC = { value: '1 OR 2 AND 3', error: null };

const mock3FilterItems = [
    {
        operator: { value: 'EqualTo', error: null },
        leftHandSide: { value: 'Account.Name', error: null },
        rightHandSide: { value: 'Account Name', error: null },
        rightHandSideDataType: { value: 'string', error: null },
        rowIndex: '326e1b1a-7235-487f-9b44-38db56af4a45'
    },
    {
        operator: { value: 'EqualTo', error: null },
        leftHandSide: { value: 'Account.Fax', error: null },
        rightHandSide: { value: '012345567', error: null },
        rightHandSideDataType: { value: 'string', error: null },
        rowIndex: '346e1b1a-7235-487f-9b44-38db56af4a45'
    },
    {
        operator: { value: 'EqualTo', error: null },
        leftHandSide: { value: 'Account.Id', error: null },
        rightHandSide: { value: '{!accountIdVar}', error: null },
        rightHandSideDataType: { value: 'reference', error: null },
        rowIndex: '143e1b1a-7235-487f-9b44-38db56af4a45'
    }
];

const createComponentUnderTest = (inputs) => {
    const {
        elementType = ELEMENT_TYPE.RECORD_LOOKUP,
        filterLogic = AND_FILTER_LOGIC,
        filterItems = [EMPTY_FILTER_ITEM]
    } = inputs;

    const el = createElement('builder_platform_interaction-record-filter', {
        is: RecordLookupFilter
    });
    Object.assign(el, {
        elementType,
        filterItems,
        filterLogic,
        recordEntityName: 'Account',
        recordFields: accountFields,
        useFilterWithCustomLogic: true,
        options: inputs.options,
        showWarningMessage: inputs.showWarningMessage
    });
    setDocumentBodyChildren(el);
    return el;
};
const getFilterRecordsCombobox = (filterCmp) =>
    deepQuerySelector(filterCmp, [
        INTERACTION_COMPONENTS_SELECTORS.CONDITION_LIST,
        LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_COMBOBOX
    ]);
const getFilterList = (filterCmp) =>
    deepQuerySelector(filterCmp, [
        INTERACTION_COMPONENTS_SELECTORS.CONDITION_LIST,
        INTERACTION_COMPONENTS_SELECTORS.LIST
    ]);
const getExpressionBuilders = (filterCmp) =>
    filterCmp.shadowRoot.querySelectorAll(INTERACTION_COMPONENTS_SELECTORS.FIELD_TO_FEROV_EXPRESSION_BUILDER);

const getListAddButton = (filterCmp) =>
    deepQuerySelector(filterCmp, [
        INTERACTION_COMPONENTS_SELECTORS.CONDITION_LIST,
        INTERACTION_COMPONENTS_SELECTORS.LIST,
        LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_BUTTON
    ]);
const getFirstRow = (filterCmp) =>
    filterCmp.shadowRoot
        .querySelector(INTERACTION_COMPONENTS_SELECTORS.CONDITION_LIST)
        .shadowRoot.querySelectorAll('slot')[1]
        .assignedNodes()[0]
        .querySelector(INTERACTION_COMPONENTS_SELECTORS.ROW);
const getFirstRowDeleteButton = (filterCmp) =>
    getFirstRow(filterCmp).shadowRoot.querySelector(LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_BUTTON_ICON);
const getCustomConditionLogicInput = (filterCmp) =>
    deepQuerySelector(filterCmp, [
        INTERACTION_COMPONENTS_SELECTORS.CONDITION_LIST,
        LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_INPUT
    ]);
const getWarningLabel = (filterCmp) => filterCmp.shadowRoot.querySelector(INTERACTION_COMPONENTS_SELECTORS.RICH_LABEL);

describe('record-filter', () => {
    describe('Filter records combobox', () => {
        describe('For record lookup', () => {
            let element;
            beforeEach(() => {
                element = createComponentUnderTest({});
            });
            it('"And" should be the default selected ', () => {
                expect(getFilterRecordsCombobox(element).value).toBe(CONDITION_LOGIC.AND);
            });
            it('Should display filter items list', () => {
                expect(getFilterList(element)).not.toBeNull();
            });
        });
        describe('For record update', () => {
            let element;
            beforeEach(() => {
                element = createComponentUnderTest({ elementType: ELEMENT_TYPE.RECORD_UPDATE });
            });
            it('"And" should be the default selected ', () => {
                expect(getFilterRecordsCombobox(element).value).toBe(CONDITION_LOGIC.AND);
            });
            it('Should display filter items list', () => {
                expect(getFilterList(element)).not.toBeNull();
            });
        });
        describe('when options are supplied', () => {
            let element, filterRecordCombobox;
            beforeEach(() => {
                const options = [
                    {
                        value: CONDITION_LOGIC.NO_CONDITIONS,
                        label: LABELS.filterNoCriteriaUpdate
                    },
                    {
                        value: CONDITION_LOGIC.AND,
                        label: LABELS.andConditionLogicLabel
                    },
                    {
                        value: CONDITION_LOGIC.OR,
                        label: LABELS.orConditionLogicLabel
                    },
                    {
                        value: CONDITION_LOGIC.CUSTOM_LOGIC,
                        label: LABELS.customConditionLogicLabel
                    },
                    {
                        value: CONDITION_LOGIC.FORMULA,
                        label: LABELS.formulaOptionLabel
                    }
                ];
                element = createComponentUnderTest({ elementType: ELEMENT_TYPE.RECORD_UPDATE, options });
                filterRecordCombobox = getFilterRecordsCombobox(element);
            });
            it('should have defaulted to "AND"', () => {
                expect(filterRecordCombobox.value).toBe(CONDITION_LOGIC.AND);
            });
            it('should have the right labels for combobox elements', () => {
                expect(filterRecordCombobox.options[0].label).toBe('FlowBuilderRecordEditor.filterNoCriteriaUpdate');
                expect(filterRecordCombobox.options[1].label).toBe('FlowBuilderConditionList.andConditionLogicLabel');
                expect(filterRecordCombobox.options[2].label).toBe('FlowBuilderConditionList.orConditionLogicLabel');
                expect(filterRecordCombobox.options[3].label).toBe(
                    'FlowBuilderConditionList.customConditionLogicLabel'
                );
            });
            it('should display filter items list', () => {
                expect(getFilterList(element)).not.toBeNull();
            });
        });
        describe('For record delete', () => {
            let element;
            beforeEach(() => {
                element = createComponentUnderTest({ elementType: ELEMENT_TYPE.RECORD_DELETE });
            });
            it('"And" should be the default selected ', () => {
                expect(getFilterRecordsCombobox(element).value).toBe(CONDITION_LOGIC.AND);
            });
            it('Should display filter items list', () => {
                expect(getFilterList(element)).not.toBeNull();
            });
        });
    });
    describe('Combobox header label', () => {
        it('For record lookup', () => {
            const filterRecord = getFilterRecordsCombobox(createComponentUnderTest({}));
            expect(filterRecord.label).toBe('FlowBuilderRecordEditor.criteriaMatchingRecords');
        });
        it('For record update', () => {
            const filterRecord = getFilterRecordsCombobox(
                createComponentUnderTest({ elementType: ELEMENT_TYPE.RECORD_UPDATE })
            );
            expect(filterRecord.label).toBe('FlowBuilderRecordUpdateEditor.filterCriteriaHeaderUpdate');
        });
        it('For record delete', () => {
            const filterRecord = getFilterRecordsCombobox(
                createComponentUnderTest({ elementType: ELEMENT_TYPE.RECORD_DELETE })
            );
            expect(filterRecord.label).toBe('FlowBuilderRecordEditor.filterCriteriaHeaderDelete');
        });
        it('For start', () => {
            const filterRecord = getFilterRecordsCombobox(
                createComponentUnderTest({ elementType: ELEMENT_TYPE.START_ELEMENT })
            );
            expect(filterRecord.label).toBe('FlowBuilderRecordEditor.criteriaMatchingRecords');
        });
        it('For start on DML', () => {
            const filterRecord = getFilterRecordsCombobox(
                createComponentUnderTest({ elementType: ELEMENT_TYPE.START_ON_DML })
            );
            expect(filterRecord.label).toBe('FlowBuilderRecordEditor.criteriaMatchingRecords');
        });
        it('For record choice set', () => {
            const filterRecord = getFilterRecordsCombobox(
                createComponentUnderTest({ elementType: ELEMENT_TYPE.RECORD_CHOICE_SET })
            );
            expect(filterRecord.label).toBe('FlowBuilderRecordEditor.criteriaMatchingRecords');
        });
    });
    describe('Combobox options', () => {
        it('should have expected labels for record lookup', () => {
            const filterRecord = getFilterRecordsCombobox(createComponentUnderTest({}));
            expect(filterRecord.options[0].label).toBe('FlowBuilderRecordEditor.filterNoCriteriaGet');
            expect(filterRecord.options[1].label).toBe('FlowBuilderConditionList.andConditionLogicLabel');
            expect(filterRecord.options[2].label).toBe('FlowBuilderConditionList.orConditionLogicLabel');
            expect(filterRecord.options[3].label).toBe('FlowBuilderConditionList.customConditionLogicLabel');
        });
        it('should have expected labels for record update', () => {
            const filterRecord = getFilterRecordsCombobox(
                createComponentUnderTest({ elementType: ELEMENT_TYPE.RECORD_UPDATE })
            );
            expect(filterRecord.options[0].label).toBe('FlowBuilderRecordEditor.filterNoCriteriaUpdate');
            expect(filterRecord.options[1].label).toBe('FlowBuilderConditionList.andConditionLogicLabel');
            expect(filterRecord.options[2].label).toBe('FlowBuilderConditionList.orConditionLogicLabel');
            expect(filterRecord.options[3].label).toBe('FlowBuilderConditionList.customConditionLogicLabel');
        });
        it('should have expected labels for record delete', () => {
            const filterRecord = getFilterRecordsCombobox(
                createComponentUnderTest({ elementType: ELEMENT_TYPE.RECORD_DELETE })
            );
            expect(filterRecord.options[0].label).toBe('FlowBuilderConditionList.andConditionLogicLabel');
            expect(filterRecord.options[1].label).toBe('FlowBuilderConditionList.orConditionLogicLabel');
            expect(filterRecord.options[2].label).toBe('FlowBuilderConditionList.customConditionLogicLabel');
        });
        it('should have expected labels for start element', () => {
            const filterRecord = getFilterRecordsCombobox(
                createComponentUnderTest({ elementType: ELEMENT_TYPE.START_ELEMENT })
            );
            expect(filterRecord.options[0].label).toBe('FlowBuilderRecordEditor.filterNoCriteriaRunFlow');
            expect(filterRecord.options[1].label).toBe('FlowBuilderConditionList.andConditionLogicLabel');
            expect(filterRecord.options[2].label).toBe('FlowBuilderConditionList.orConditionLogicLabel');
            expect(filterRecord.options[3].label).toBe('FlowBuilderConditionList.customConditionLogicLabel');
        });
        it('should have expected labels for record choice set', () => {
            const filterRecord = getFilterRecordsCombobox(
                createComponentUnderTest({ elementType: ELEMENT_TYPE.RECORD_CHOICE_SET })
            );
            expect(filterRecord.options[0].label).toBe('FlowBuilderRecordEditor.filterNoCriteriaGet');
            expect(filterRecord.options[1].label).toBe('FlowBuilderConditionList.andConditionLogicLabel');
            expect(filterRecord.options[2].label).toBe('FlowBuilderConditionList.orConditionLogicLabel');
            expect(filterRecord.options[3].label).toBe('FlowBuilderConditionList.customConditionLogicLabel');
        });
        it('should have expected labels for START on DML', () => {
            const filterRecord = getFilterRecordsCombobox(
                createComponentUnderTest({ elementType: ELEMENT_TYPE.START_ON_DML })
            );
            expect(filterRecord.options[0].label).toBe('FlowBuilderRecordEditor.filterNoCriteria');
            expect(filterRecord.options[1].label).toBe('FlowBuilderConditionList.andConditionLogicLabel');
            expect(filterRecord.options[2].label).toBe('FlowBuilderConditionList.orConditionLogicLabel');
            expect(filterRecord.options[3].label).toBe('FlowBuilderConditionList.customConditionLogicLabel');
            expect(filterRecord.options[4].label).toBe('FlowBuilderFilterEditor.formulaOptionLabel');
        });
    });
    describe('Warning labels for no_conditions', () => {
        it('should not show warning filterLogic is not NO_CONDITIONs', () => {
            const element = createComponentUnderTest({
                filterLogic: AND_FILTER_LOGIC,
                elementType: ELEMENT_TYPE.RECORD_UPDATE,
                showWarningMessage: true
            });
            const warningLabelElem = getWarningLabel(element);
            expect(warningLabelElem).toBeNull();
        });
        it('should show warning message when showWarningMessage is true', () => {
            const element = createComponentUnderTest({
                filterLogic: NO_CONDITIONS_FILTER_LOGIC,
                elementType: ELEMENT_TYPE.RECORD_UPDATE,
                showWarningMessage: true
            });
            const warningLabelElem = getWarningLabel(element);
            expect(warningLabelElem).not.toBeNull();
            expect(warningLabelElem.label).toBe('FlowBuilderRecordEditor.updateAllRecords');
        });
        it('should not show warning messagew when showWarningMessage is false', () => {
            const element = createComponentUnderTest({
                filterLogic: NO_CONDITIONS_FILTER_LOGIC,
                elementType: ELEMENT_TYPE.RECORD_UPDATE,
                showWarningMessage: false
            });
            const warningLabelElem = getWarningLabel(element);
            expect(warningLabelElem).toBeNull();
        });
        it('should not show warning message when element is RECORD_UPDATE and showWarningMessage is undefined', () => {
            const element = createComponentUnderTest({
                filterLogic: NO_CONDITIONS_FILTER_LOGIC,
                elementType: ELEMENT_TYPE.RECORD_UPDATE
            });
            const warningLabelElem = getWarningLabel(element);
            expect(warningLabelElem).toBeNull();
        });
        it('should show warning message when element is RECORD_LOOKUP and showWarningMessage is undefined', () => {
            const element = createComponentUnderTest({
                filterLogic: NO_CONDITIONS_FILTER_LOGIC,
                elementType: ELEMENT_TYPE.RECORD_LOOKUP
            });
            const warningLabelElem = getWarningLabel(element);
            expect(warningLabelElem).not.toBeNull();
            expect(warningLabelElem.label).toBe('FlowBuilderRecordEditor.getAllRecords');
        });
    });
    describe('Filter Items', () => {
        describe('For record lookup', () => {
            let element;
            beforeEach(() => {
                element = createComponentUnderTest({ filterLogic: AND_FILTER_LOGIC, filterItems: mock3FilterItems });
            });
            it('"And" should be the default selected ', () => {
                expect(getFilterRecordsCombobox(element).value).toBe(CONDITION_LOGIC.AND);
            });
            it('Filter items list should be displayed', () => {
                expect(getFilterList(element)).not.toBeNull();
            });
            it('All filter items should be displayed', () => {
                expect(getExpressionBuilders(element)).toHaveLength(3);
            });
            it('passes EqualTo as the default operator', () => {
                expect(getExpressionBuilders(element)[0].defaultOperator).toEqual(RULE_OPERATOR.EQUAL_TO);
            });
        });
        describe('For record update', () => {
            let element;
            beforeEach(() => {
                element = createComponentUnderTest({
                    elementType: ELEMENT_TYPE.RECORD_UPDATE,
                    filterLogic: AND_FILTER_LOGIC,
                    filterItems: mock3FilterItems
                });
            });
            it('"And" should be the default selected ', () => {
                expect(getFilterRecordsCombobox(element).value).toBe(CONDITION_LOGIC.AND);
            });
            it('Filter items list should be displayed', () => {
                expect(getFilterList(element)).not.toBeNull();
            });
            it('All filter items should be displayed', () => {
                expect(getExpressionBuilders(element)).toHaveLength(3);
            });
            it('passes EqualTo as the default operator', () => {
                expect(getExpressionBuilders(element)[0].defaultOperator).toEqual(RULE_OPERATOR.EQUAL_TO);
            });
        });
        describe('For record delete', () => {
            let element;
            beforeEach(() => {
                element = createComponentUnderTest({
                    elementType: ELEMENT_TYPE.RECORD_DELETE,
                    filterItems: mock3FilterItems
                });
            });
            it('"And" should be the default selected ', () => {
                expect(getFilterRecordsCombobox(element).value).toBe(CONDITION_LOGIC.AND);
            });
            it('Filter items list should be displayed', () => {
                expect(getFilterList(element)).not.toBeNull();
            });
            it('All filter items should be displayed', () => {
                expect(getExpressionBuilders(element)).toHaveLength(3);
            });
            it('passes EqualTo as the default operator', () => {
                expect(getExpressionBuilders(element)[0].defaultOperator).toEqual(RULE_OPERATOR.EQUAL_TO);
            });
        });
        describe('For record delete with custom logic', () => {
            let element;
            beforeEach(() => {
                element = createComponentUnderTest({
                    elementType: ELEMENT_TYPE.RECORD_DELETE,
                    filterLogic: CUSTOM_FILTER_LOGIC,
                    filterItems: mock3FilterItems
                });
            });
            it('"Custom Logic" should be selected ', () => {
                expect(getFilterRecordsCombobox(element).value).toBe(CONDITION_LOGIC.CUSTOM_LOGIC);
            });
            it('Filter items list should be displayed', () => {
                expect(getFilterList(element)).not.toBeNull();
            });
            it('Custom condition logic input should be displayed', () => {
                expect(getCustomConditionLogicInput(element)).not.toBeNull();
                expect(getCustomConditionLogicInput(element).value).toBe(CUSTOM_FILTER_LOGIC.value);
            });
            it('passes EqualTo as the default operator', () => {
                expect(getExpressionBuilders(element)[0].defaultOperator).toEqual(RULE_OPERATOR.EQUAL_TO);
            });
        });
    });
    describe('Filter items events dispatch', () => {
        it('when fires addRecordFilterEvent', async () => {
            const element = createComponentUnderTest({});
            const eventCallback = jest.fn();
            element.addEventListener(AddRecordFilterEvent.EVENT_NAME, eventCallback);
            const addFilterListButton = getListAddButton(element);
            addFilterListButton.dispatchEvent(clickEvent());
            await ticks(1);
            expect(eventCallback).toHaveBeenCalled();
        });

        it('when fires updateRecordFilterEvent', async () => {
            const updateData = {
                index: 0,
                value: 'newValue'
            };
            const element = createComponentUnderTest({ filterLogic: AND_FILTER_LOGIC, filterItems: mock3FilterItems });
            const eventCallback = jest.fn();
            element.addEventListener(UpdateRecordFilterEvent.EVENT_NAME, eventCallback);
            const row = getFirstRow(element);
            row.dispatchEvent(new UpdateListItemEvent(updateData.index, updateData.value));
            await ticks(1);
            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0]).toMatchObject({
                detail: {
                    index: updateData.index,
                    value: updateData.value
                }
            });
        });

        it('when fires deleteRecordFilterEvent', async () => {
            const firstRowIndex = 0;
            const element = createComponentUnderTest({
                elementType: ELEMENT_TYPE.RECORD_LOOKUP,
                filterLogic: AND_FILTER_LOGIC,
                filterItems: mock3FilterItems
            });
            const eventCallback = jest.fn();
            element.addEventListener(DeleteRecordFilterEvent.EVENT_NAME, eventCallback);
            const rowsDeleteButtons = getFirstRowDeleteButton(element);
            rowsDeleteButtons.dispatchEvent(clickEvent());
            await ticks(1);
            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0]).toMatchObject({
                detail: {
                    index: firstRowIndex
                }
            });
        });

        it('when fires UpdateFilterLogicEvent', async () => {
            const element = createComponentUnderTest({
                elementType: ELEMENT_TYPE.RECORD_DELETE,
                filterLogic: AND_FILTER_LOGIC,
                filterItems: mock3FilterItems
            });
            const eventCallback = jest.fn();
            element.addEventListener(PropertyChangedEvent.EVENT_NAME, eventCallback);
            getFilterRecordsCombobox(element).dispatchEvent(changeEvent(CONDITION_LOGIC.CUSTOM_LOGIC));
            await ticks(1);
            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0]).toMatchObject({
                detail: {
                    value: '1 AND 2 AND 3'
                }
            });
        });
    });
    describe('when Filterable fields', () => {
        it('should show only filterable fields', () => {
            const element = createComponentUnderTest({});
            const filterableFields = Object.values(element.recordFields);
            expect(filterableFields).toContainEqual(
                expect.objectContaining({
                    filterable: true
                })
            );
        });
    });
});
