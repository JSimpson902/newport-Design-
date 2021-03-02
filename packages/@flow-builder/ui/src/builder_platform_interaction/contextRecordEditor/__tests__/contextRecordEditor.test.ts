// @ts-nocheck
import contextRecordEditor from '../contextRecordEditor';
import { createElement } from 'lwc';
import { CONDITION_LOGIC, FLOW_TRIGGER_TYPE, FlowComparisonOperator } from 'builder_platform_interaction/flowMetadata';
import {
    AddRecordFilterEvent,
    DeleteRecordFilterEvent,
    UpdateRecordFilterEvent,
    ConfigurationEditorChangeEvent,
    UpdateNodeEvent,
    PropertyChangedEvent
} from 'builder_platform_interaction/events';
import * as store from 'mock/storeData';
import * as expressionUtilsMock from 'builder_platform_interaction/expressionUtils';
import {
    ticks,
    INTERACTION_COMPONENTS_SELECTORS,
    LIGHTNING_COMPONENTS_SELECTORS,
    setDocumentBodyChildren
} from 'builder_platform_interaction/builderTestUtils';
import { LABELS, requireRecordChangeOptions } from '../contextRecordEditorLabels';

jest.mock('builder_platform_interaction/fieldToFerovExpressionBuilder', () =>
    require('builder_platform_interaction_mocks/fieldToFerovExpressionBuilder')
);
jest.mock('builder_platform_interaction/ferovResourcePicker', () =>
    require('builder_platform_interaction_mocks/ferovResourcePicker')
);
jest.mock('builder_platform_interaction/fieldPicker', () => require('builder_platform_interaction_mocks/fieldPicker'));

jest.mock('builder_platform_interaction/contextLib', () => {
    return Object.assign({}, require('builder_platform_interaction_mocks/contextLib'), {
        orgHasBeforeSaveEnabled: jest.fn()
    });
});

jest.mock('builder_platform_interaction/expressionUtils', () => {
    const actual = jest.requireActual('builder_platform_interaction/expressionUtils');
    return {
        getResourceByUniqueIdentifier: jest.fn(),
        getEntitiesMenuData: actual.getEntitiesMenuData,
        EXPRESSION_PROPERTY_TYPE: actual.EXPRESSION_PROPERTY_TYPE,
        getChildrenItemsPromise: actual.getChildrenItemsPromise,
        filterMatches: actual.filterMatches
    };
});
jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

jest.mock('builder_platform_interaction/storeUtils', () => {
    return {
        getElementByGuid: jest.fn(),
        isExecuteOnlyWhenChangeMatchesConditionsPossible: jest.fn().mockReturnValue(true)
    };
});

const SELECTORS = {
    ...INTERACTION_COMPONENTS_SELECTORS,
    DISABLE_RADIOGROUP_INFORMATION_TEXT: 'div.slds-scoped-notification'
};

function createComponentForTest(node) {
    const el = createElement('builder_platform_interaction-context-record-editor', {
        is: contextRecordEditor
    });

    Object.assign(el, { node });

    setDocumentBodyChildren(el);
    return el;
}

const getEntityResourcePicker = (contextEditor) => {
    return contextEditor.shadowRoot.querySelector(SELECTORS.ENTITY_RESOURCE_PICKER);
};

const getRecordFilter = (contextEditor) => {
    return contextEditor.shadowRoot.querySelector(SELECTORS.RECORD_FILTER);
};

const getCustomPropertyEditor = (contextEditor) => {
    return contextEditor.shadowRoot.querySelector(SELECTORS.CUSTOM_PROPERTY_EDITOR);
};

const defaultValueItem = { item: { value: 'guid1', displayText: 'var 1' } };
const getComboboxStateChangedEvent = (detail = defaultValueItem) => {
    return new CustomEvent('comboboxstatechanged', {
        detail
    });
};

const filterElement = {
    leftHandSide: { value: 'Account.Id', error: null },
    operator: { value: 'EqualTo', error: null },
    rightHandSide: { value: '{!myFormula1}', error: null },
    rightHandSideDataType: { value: 'reference', error: null },
    rightHandSideGuid: { value: 'FORMULA_8', error: null }
};

describe('context-record-editor', () => {
    let scheduledNewStartElement,
        beforeSaveNewStartElement,
        beforeSaveNewStartElementWithFilters,
        beforeSaveNewStartElementWithFiltersOnCreate,
        scheduledNewStartElementWithFilters,
        scheduledNewStartElementWithoutFilters,
        scheduledJourneyStartElement,
        startElementWithFiltersIsChangedOperator;
    beforeEach(() => {
        scheduledNewStartElement = () => ({
            description: { value: '', error: null },
            elementType: 'START_ELEMENT',
            guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
            isCanvasElement: true,
            label: { value: '', error: null },
            name: { value: '', error: null },
            object: { value: 'Account', error: null },
            objectIndex: { value: 'guid', error: null },
            filterLogic: { value: CONDITION_LOGIC.AND, error: null },
            filters: [],
            frequency: { value: 'Once', error: null },
            startDate: undefined,
            startTime: undefined,
            triggerType: { value: FLOW_TRIGGER_TYPE.SCHEDULED, error: null }
        });
        beforeSaveNewStartElement = () => ({
            description: { value: '', error: null },
            elementType: 'START_ELEMENT',
            guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
            isCanvasElement: true,
            label: { value: '', error: null },
            name: { value: '', error: null },
            object: { value: 'Account', error: null },
            objectIndex: { value: 'guid', error: null },
            filterLogic: { value: CONDITION_LOGIC.NO_CONDITIONS, error: null },
            filters: [],
            frequency: undefined,
            startDate: undefined,
            startTime: undefined,
            recordTriggerType: { value: 'Update', error: null },
            triggerType: { value: FLOW_TRIGGER_TYPE.BEFORE_SAVE, error: null }
        });
        beforeSaveNewStartElementWithFilters = () => ({
            description: { value: '', error: null },
            elementType: 'START_ELEMENT',
            guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
            isCanvasElement: true,
            label: { value: '', error: null },
            name: { value: '', error: null },
            object: { value: 'Account', error: null },
            objectIndex: { value: 'guid', error: null },
            filterLogic: { value: CONDITION_LOGIC.AND, error: null },
            filters: [
                {
                    rowIndex: 'a0e8a02d-60fb-4481-8165-10a01fe7031c',
                    leftHandSide: {
                        value: '',
                        error: null
                    },
                    rightHandSide: {
                        value: '',
                        error: null
                    },
                    rightHandSideDataType: {
                        value: '',
                        error: null
                    },
                    operator: {
                        value: '',
                        error: null
                    }
                }
            ],
            frequency: undefined,
            startDate: undefined,
            startTime: undefined,
            recordTriggerType: { value: 'Update', error: null },
            triggerType: { value: FLOW_TRIGGER_TYPE.BEFORE_SAVE, error: null }
        });
        beforeSaveNewStartElementWithFiltersOnCreate = () => ({
            description: { value: '', error: null },
            elementType: 'START_ELEMENT',
            guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
            isCanvasElement: true,
            label: { value: '', error: null },
            name: { value: '', error: null },
            object: { value: 'Account', error: null },
            objectIndex: { value: 'guid', error: null },
            filterLogic: { value: CONDITION_LOGIC.AND, error: null },
            filters: [
                {
                    rowIndex: 'a0e8a02d-60fb-4481-8165-10a01fe7031c',
                    leftHandSide: {
                        value: '',
                        error: null
                    },
                    rightHandSide: {
                        value: '',
                        error: null
                    },
                    rightHandSideDataType: {
                        value: '',
                        error: null
                    },
                    operator: {
                        value: '',
                        error: null
                    }
                }
            ],
            frequency: undefined,
            startDate: undefined,
            startTime: undefined,
            recordTriggerType: { value: 'Create', error: null },
            triggerType: { value: FLOW_TRIGGER_TYPE.BEFORE_SAVE, error: null }
        });
        scheduledNewStartElementWithFilters = () => ({
            description: { value: '', error: null },
            elementType: 'START_ELEMENT',
            guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
            isCanvasElement: true,
            label: { value: '', error: null },
            name: { value: '', error: null },
            object: { value: 'Account', error: null },
            objectIndex: { value: 'guid', error: null },
            filterLogic: { value: CONDITION_LOGIC.AND, error: null },
            filters: [
                {
                    rowIndex: 'a0e8a02d-60fb-4481-8165-10a01fe7031c',
                    leftHandSide: {
                        value: '',
                        error: null
                    },
                    rightHandSide: {
                        value: '',
                        error: null
                    },
                    rightHandSideDataType: {
                        value: '',
                        error: null
                    },
                    operator: {
                        value: '',
                        error: null
                    }
                }
            ],
            frequency: { value: 'Once', error: null },
            startDate: undefined,
            startTime: undefined,
            triggerType: { value: 'Scheduled', error: null }
        });
        scheduledNewStartElementWithoutFilters = () => ({
            description: { value: '', error: null },
            elementType: 'START_ELEMENT',
            guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
            isCanvasElement: true,
            label: { value: '', error: null },
            name: { value: '', error: null },
            object: { value: 'Account', error: null },
            objectIndex: { value: 'guid', error: null },
            filterLogic: { value: CONDITION_LOGIC.NO_CONDITIONS, error: null },
            filters: [],
            frequency: { value: 'Once', error: null },
            startDate: undefined,
            startTime: undefined,
            triggerType: { value: 'Scheduled', error: null }
        });
        scheduledJourneyStartElement = () => ({
            description: { value: '', error: null },
            elementType: 'START_ELEMENT',
            guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
            isCanvasElement: true,
            label: { value: '', error: null },
            name: { value: '', error: null },
            object: { value: 'Audience', error: null },
            objectIndex: { value: 'guid', error: null },
            filterLogic: { value: CONDITION_LOGIC.NO_CONDITIONS, error: null },
            filters: [],
            frequency: { value: 'Once', error: null },
            startDate: undefined,
            startTime: undefined,
            triggerType: { value: 'ScheduledJourney', error: null }
        });
        startElementWithFiltersIsChangedOperator = () => ({
            description: { value: '', error: null },
            elementType: 'START_ELEMENT',
            guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
            isCanvasElement: true,
            label: { value: '', error: null },
            name: { value: '', error: null },
            object: { value: 'Account', error: null },
            objectIndex: { value: 'guid', error: null },
            filterLogic: { value: CONDITION_LOGIC.AND, error: null },
            filters: [
                {
                    rowIndex: 'a0e8a02d-60fb-4481-8165-10a01fe7031c',
                    leftHandSide: {
                        value: '',
                        error: null
                    },
                    rightHandSide: {
                        value: '',
                        error: null
                    },
                    rightHandSideDataType: {
                        value: '',
                        error: null
                    },
                    operator: {
                        value: FlowComparisonOperator.IsChanged,
                        error: null
                    }
                }
            ],
            frequency: { value: 'Once', error: null },
            startDate: undefined,
            startTime: undefined,
            recordTriggerType: { value: 'Update', error: null },
            triggerType: { value: 'Scheduled', error: null }
        });
    });

    describe('handle record change options radio group when IsChanged operator is selected', () => {
        let contextEditor;
        beforeEach(() => {
            expressionUtilsMock.getResourceByUniqueIdentifier.mockReturnValue(store.accountSObjectVariable);
            contextEditor = createComponentForTest(scheduledNewStartElementWithFilters());
        });
        it('record change options radio group is disabled', async () => {
            contextEditor.node = startElementWithFiltersIsChangedOperator();
            const updateNodeCallback = jest.fn();
            contextEditor.addEventListener(UpdateNodeEvent.EVENT_NAME, updateNodeCallback);

            const propertyChangeEvent = new PropertyChangedEvent('filterLogic', CONDITION_LOGIC.OR);
            getRecordFilter(contextEditor).dispatchEvent(propertyChangeEvent);
            await ticks(1);

            const requireRecordChangeOptionsRadioGroup = contextEditor.shadowRoot.querySelector(
                LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_RADIO_GROUP
            );

            expect(requireRecordChangeOptionsRadioGroup).not.toBe(null);
        });
        it('record change options radio group value is trueEveryTime', async () => {
            contextEditor.node = startElementWithFiltersIsChangedOperator();
            const updateNodeCallback = jest.fn();
            contextEditor.addEventListener(UpdateNodeEvent.EVENT_NAME, updateNodeCallback);

            const propertyChangeEvent = new PropertyChangedEvent('filterLogic', CONDITION_LOGIC.OR);
            getRecordFilter(contextEditor).dispatchEvent(propertyChangeEvent);
            await ticks(1);

            const requireRecordChangeOptionsRadioGroup = contextEditor.shadowRoot.querySelector(
                LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_RADIO_GROUP
            );

            expect(requireRecordChangeOptionsRadioGroup.value).toBe('trueEveryTime');
        });
        it('shows the information text div for record change options radio group', async () => {
            contextEditor.node = startElementWithFiltersIsChangedOperator();
            const updateNodeCallback = jest.fn();
            contextEditor.addEventListener(UpdateNodeEvent.EVENT_NAME, updateNodeCallback);

            const propertyChangeEvent = new PropertyChangedEvent('filterLogic', CONDITION_LOGIC.OR);
            getRecordFilter(contextEditor).dispatchEvent(propertyChangeEvent);
            await ticks(1);

            expect(contextEditor.shadowRoot.querySelector(SELECTORS.DISABLE_RADIOGROUP_INFORMATION_TEXT)).not.toBe(
                null
            );
        });
    });
    it('entity picker (object) value should be "Account" for scheduled', () => {
        const contextEditor = createComponentForTest(scheduledNewStartElement());
        expect(getEntityResourcePicker(contextEditor).value).toBe('Account');
    });

    it('entity picker (object) value should be "Account" for beforeSave', () => {
        const contextEditor = createComponentForTest(beforeSaveNewStartElement());
        expect(getEntityResourcePicker(contextEditor).value).toBe('Account');
    });

    it('record filter logic should be "no conditions" ', () => {
        const contextEditor = createComponentForTest(scheduledNewStartElementWithoutFilters());
        expect(getRecordFilter(contextEditor).filterLogic.value).toBe(CONDITION_LOGIC.NO_CONDITIONS);
    });

    it('record filter logic should be "and" ', () => {
        expressionUtilsMock.getResourceByUniqueIdentifier.mockReturnValue(store.accountSObjectVariable);
        const contextEditor = createComponentForTest(scheduledNewStartElementWithFilters());
        expect(getRecordFilter(contextEditor).filterLogic.value).toBe(CONDITION_LOGIC.AND);
    });

    it('record filter logic should be "and" for DML', () => {
        expressionUtilsMock.getResourceByUniqueIdentifier.mockReturnValue(store.accountSObjectVariable);
        const contextEditor = createComponentForTest(beforeSaveNewStartElementWithFilters());
        expect(getRecordFilter(contextEditor).filterLogic.value).toBe(CONDITION_LOGIC.AND);
    });

    it('does not show the requireRecordChangeOptions when conditions are not set on an update trigger', async () => {
        const contextEditor = createComponentForTest(beforeSaveNewStartElement());

        await ticks(1);
        const requireRecordChangeOptionsRadioGroup = contextEditor.shadowRoot.querySelector(
            LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_RADIO_GROUP
        );
        expect(requireRecordChangeOptionsRadioGroup).toBeNull();
    });

    it('shows the requireRecordChangeOptions when conditions are set on an update trigger', async () => {
        const contextEditor = createComponentForTest(beforeSaveNewStartElementWithFilters());

        await ticks(1);
        const requireRecordChangeOptionsRadioGroup = contextEditor.shadowRoot.querySelector(
            LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_RADIO_GROUP
        );
        expect(requireRecordChangeOptionsRadioGroup).not.toBeNull();
        expect(requireRecordChangeOptionsRadioGroup.label).toBe(LABELS.requireRecordChangeOption);
        const recordChangeOptions = requireRecordChangeOptionsRadioGroup.options;

        expect(requireRecordChangeOptions()[0].value).toBe('trueEveryTime');
        expect(requireRecordChangeOptions()[1].value).toBe('trueOnChangeOnly');

        expect(recordChangeOptions[0].value).toBe(requireRecordChangeOptions()[0].value);
        expect(recordChangeOptions[1].value).toBe(requireRecordChangeOptions()[1].value);
    });

    it('does not show the requireRecordChangeOptions on a create trigger', async () => {
        const storeUtils = require('builder_platform_interaction/storeUtils');

        storeUtils.isExecuteOnlyWhenChangeMatchesConditionsPossible = jest.fn().mockReturnValue(false);
        const contextEditor = createComponentForTest(beforeSaveNewStartElementWithFiltersOnCreate());

        await ticks(1);
        const requireRecordChangeOptionsRadioGroup = contextEditor.shadowRoot.querySelector(
            LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_RADIO_GROUP
        );
        expect(requireRecordChangeOptionsRadioGroup).toBeNull();
    });

    describe('handle events', () => {
        let contextEditor, entityResourcePicker;
        beforeEach(() => {
            expressionUtilsMock.getResourceByUniqueIdentifier.mockReturnValue(store.accountSObjectVariable);
            contextEditor = createComponentForTest(scheduledNewStartElementWithFilters());
        });
        it('handles "entityResourcePicker" value changed event', async () => {
            entityResourcePicker = getEntityResourcePicker(contextEditor);
            entityResourcePicker.dispatchEvent(getComboboxStateChangedEvent());
            await ticks(1);
            expect(entityResourcePicker.value).toBe('guid1');
        });
        it('handle UpdateRecordFilterEvent should update the filter element', async () => {
            const updateRecordFilterEvent = new UpdateRecordFilterEvent(0, filterElement, null);
            getRecordFilter(contextEditor).dispatchEvent(updateRecordFilterEvent);
            await ticks(1);
            expect(contextEditor.node.filters[0]).toMatchObject(filterElement);
        });
        it('handle AddRecordFilterEvent should add a filter element', async () => {
            const addRecordFilterEvent = new AddRecordFilterEvent(); // This is using the numerical rowIndex not the property rowIndex
            getRecordFilter(contextEditor).dispatchEvent(addRecordFilterEvent);
            await ticks(1);
            expect(contextEditor.node.filters).toHaveLength(2);
        });
        it('handle record filter logic Change event', async () => {
            const propertyChangeEvent = new PropertyChangedEvent('filterLogic', CONDITION_LOGIC.OR);
            getRecordFilter(contextEditor).dispatchEvent(propertyChangeEvent);
            await ticks(1);
            expect(contextEditor.node.filterLogic.value).toBe(CONDITION_LOGIC.OR);
        });
        it('record filter fire DeleteRecordFilterEvent', async () => {
            const deleteRecordFilterEvent = new DeleteRecordFilterEvent(0); // This is using the numerical rowIndex not the property rowIndex
            getRecordFilter(contextEditor).dispatchEvent(deleteRecordFilterEvent);
            await ticks(1);
            expect(contextEditor.node.filters).toHaveLength(0);
        });
    });

    describe('handle UpdateNodeEvent dispatch', () => {
        let contextEditor;
        beforeEach(() => {
            expressionUtilsMock.getResourceByUniqueIdentifier.mockReturnValue(store.accountSObjectVariable);
            contextEditor = createComponentForTest(scheduledNewStartElementWithFilters());
        });
        it('handle "entityResourcePicker" value changed event should dispatch an UpdateNodeEvent', async () => {
            contextEditor.node = beforeSaveNewStartElement();
            const updateNodeCallback = jest.fn();
            contextEditor.addEventListener(UpdateNodeEvent.EVENT_NAME, updateNodeCallback);

            getEntityResourcePicker(contextEditor).dispatchEvent(getComboboxStateChangedEvent());
            expect(updateNodeCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { node: contextEditor.node }
                })
            );
        });
        it('handle UpdateRecordFilterEvent should dispatch an UpdateNodeEvent', async () => {
            contextEditor.node = scheduledNewStartElementWithFilters();
            const updateNodeCallback = jest.fn();
            contextEditor.addEventListener(UpdateNodeEvent.EVENT_NAME, updateNodeCallback);

            const updateRecordFilterEvent = new UpdateRecordFilterEvent(0, filterElement, null);
            getRecordFilter(contextEditor).dispatchEvent(updateRecordFilterEvent);
            expect(updateNodeCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { node: contextEditor.node }
                })
            );
        });
        it('handle AddRecordFilterEvent should dispatch an UpdateNodeEvent', async () => {
            contextEditor.node = scheduledNewStartElementWithoutFilters();
            const updateNodeCallback = jest.fn();
            contextEditor.addEventListener(UpdateNodeEvent.EVENT_NAME, updateNodeCallback);

            const addRecordFilterEvent = new AddRecordFilterEvent();
            getRecordFilter(contextEditor).dispatchEvent(addRecordFilterEvent);
            expect(updateNodeCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { node: contextEditor.node }
                })
            );
        });
        it('handle PropertyChangedEvent from filterLogic should dispatch an UpdateNodeEvent', async () => {
            contextEditor.node = scheduledNewStartElementWithFilters();
            const updateNodeCallback = jest.fn();
            contextEditor.addEventListener(UpdateNodeEvent.EVENT_NAME, updateNodeCallback);

            const propertyChangeEvent = new PropertyChangedEvent('filterLogic', CONDITION_LOGIC.OR);
            getRecordFilter(contextEditor).dispatchEvent(propertyChangeEvent);
            await ticks(1);
            expect(contextEditor.node.filterLogic.value).toBe(CONDITION_LOGIC.OR);
            expect(updateNodeCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { node: contextEditor.node }
                })
            );
        });
        it('handle DeleteRecordFilterEvent should dispatch an UpdateNodeEvent', async () => {
            contextEditor.node = scheduledNewStartElementWithFilters();
            const updateNodeCallback = jest.fn();
            contextEditor.addEventListener(UpdateNodeEvent.EVENT_NAME, updateNodeCallback);

            const deleteRecordFilterEvent = new DeleteRecordFilterEvent(0);
            getRecordFilter(contextEditor).dispatchEvent(deleteRecordFilterEvent);
            expect(updateNodeCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { node: contextEditor.node }
                })
            );
        });
    });

    describe('custom property editor', () => {
        let getTriggerMock, contextEditor;
        beforeEach(() => {
            getTriggerMock = jest
                .spyOn(jest.requireActual('builder_platform_interaction/triggerTypeLib'), 'getTriggerTypeInfo')
                .mockImplementation(() => {
                    return Promise.resolve({ configurationEditor: 'cpeComponent' });
                });
            contextEditor = createComponentForTest(scheduledJourneyStartElement());
        });
        afterEach(() => {
            getTriggerMock.mockRestore();
        });
        it('should render the custom property editor component if the trigger supports it', () => {
            expect(getCustomPropertyEditor(contextEditor)).not.toBeNull();
        });
        it('should not render the entity picker if the custom property editor component is rendered', () => {
            expect(getEntityResourcePicker(contextEditor)).toBeNull();
        });
        it('should not render the record filter list if the custom property editor component is rendered', () => {
            expect(getRecordFilter(contextEditor)).toBeNull();
        });
        it('should fire and handle the ConfigurationEditorChangeEvent correctly', async () => {
            const cpeChangeEvent = new ConfigurationEditorChangeEvent('objectContainer', 'foo'); // This is using the numerical rowIndex not the property rowIndex
            getCustomPropertyEditor(contextEditor).dispatchEvent(cpeChangeEvent);
            await ticks(1);
            expect(contextEditor.node.objectContainer.value).toBe('foo');
        });
        it("should validate using the custom property editor component's validate method", () => {
            const mockValidatefunction = jest.fn(() => {
                return ['error1'];
            });
            getCustomPropertyEditor(contextEditor).validate = mockValidatefunction;
            const errors = contextEditor.validate();
            expect(mockValidatefunction).toHaveBeenCalled();
            expect(errors).toContain('error1');
        });
    });
});
