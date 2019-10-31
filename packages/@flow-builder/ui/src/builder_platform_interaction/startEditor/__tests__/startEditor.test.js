import { createElement } from 'lwc';

import {
    FLOW_TRIGGER_TYPE,
    FLOW_TRIGGER_FREQUENCY
} from 'builder_platform_interaction/flowMetadata';
import {
    AddRecordFilterEvent,
    DeleteRecordFilterEvent,
    UpdateRecordFilterEvent,
    RecordFilterTypeChangedEvent
} from 'builder_platform_interaction/events';
import { query } from 'builder_platform_interaction/builderTestUtils';
import StartEditor from '../startEditor';
import { RECORD_FILTER_CRITERIA } from 'builder_platform_interaction/recordEditorLib';
import * as store from 'mock/storeData';
import * as expressionUtilsMock from 'builder_platform_interaction/expressionUtils';
import * as contextLibMock from 'builder_platform_interaction/contextLib';

jest.mock('builder_platform_interaction/fieldToFerovExpressionBuilder', () =>
    require('builder_platform_interaction_mocks/fieldToFerovExpressionBuilder')
);
jest.mock('builder_platform_interaction/ferovResourcePicker', () =>
    require('builder_platform_interaction_mocks/ferovResourcePicker')
);
jest.mock('builder_platform_interaction/fieldPicker', () =>
    require('builder_platform_interaction_mocks/fieldPicker')
);

jest.mock('builder_platform_interaction/contextLib', () => {
    return { orgHasBeforeSaveEnabled: jest.fn() };
});

jest.mock('builder_platform_interaction/expressionUtils', () => {
    const actual = require.requireActual(
        '../../expressionUtils/expressionUtils.js'
    );
    return {
        getResourceByUniqueIdentifier: jest.fn(),
        getEntitiesMenuData: actual.getEntitiesMenuData,
        EXPRESSION_PROPERTY_TYPE: actual.EXPRESSION_PROPERTY_TYPE,
        getChildrenItems: actual.getChildrenItems,
        filterMatches: actual.filterMatches
    };
});
jest.mock('builder_platform_interaction/storeLib', () =>
    require('builder_platform_interaction_mocks/storeLib')
);

const SELECTORS = {
    ENTITY_RESOURCE_PICKER:
        'builder_platform_interaction-entity-resource-picker',
    SECHEDULE_SECTION: '.scheduleSection',
    SAVE_TYPE_SECTION: 'lightning-radio-group.recordCreateOrUpdate',
    TRIGGER_TYPE_INPUT: 'lightning-radio-group.triggerType',
    START_DATE_INPUT: 'lightning-input.startDate',
    START_TIME_INPUT: 'lightning-input.startTime',
    FREQUENCY_INPUT: 'lightning-combobox.frequency',
    RECORD_FILTER: 'builder_platform_interaction-record-filter'
};

function createComponentForTest(node) {
    const el = createElement('builder_platform_interaction-start-editor', {
        is: StartEditor
    });

    Object.assign(el, { node });

    document.body.appendChild(el);
    return el;
}

const getEntityResourcePicker = startEditor => {
    return startEditor.shadowRoot.querySelector(
        SELECTORS.ENTITY_RESOURCE_PICKER
    );
};

const getRecordFilter = startEditor => {
    return startEditor.shadowRoot.querySelector(SELECTORS.RECORD_FILTER);
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

const defaultNewStartElement = () => ({
    description: { value: '', error: null },
    elementType: 'START_ELEMENT',
    guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
    isCanvasElement: true,
    label: { value: '', error: null },
    name: { value: '', error: null },
    object: { value: '', error: null },
    objectIndex: { value: 'guid', error: null },
    filterType: {},
    filters: [{}],
    frequency: undefined,
    startDate: undefined,
    startTime: undefined,
    triggerType: { value: '', error: null }
});

const scheduledNewStartElement = () => ({
    description: { value: '', error: null },
    elementType: 'START_ELEMENT',
    guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
    isCanvasElement: true,
    label: { value: '', error: null },
    name: { value: '', error: null },
    object: { value: 'Account', error: null },
    objectIndex: { value: 'guid', error: null },
    filterType: {},
    filters: [],
    frequency: { value: 'Once', error: null },
    startDate: undefined,
    startTime: undefined,
    triggerType: { value: FLOW_TRIGGER_TYPE.SCHEDULED, error: null }
});

const beforeSaveNewStartElement = () => ({
    description: { value: '', error: null },
    elementType: 'START_ELEMENT',
    guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
    isCanvasElement: true,
    label: { value: '', error: null },
    name: { value: '', error: null },
    object: { value: 'Account', error: null },
    objectIndex: { value: 'guid', error: null },
    filterType: {},
    filters: [],
    frequency: undefined,
    startDate: undefined,
    startTime: undefined,
    saveType: { value: 'Update', error: null },
    triggerType: { value: FLOW_TRIGGER_TYPE.BEFORE_SAVE, error: null }
});

const scheduledNewStartElementWithFilters = () => ({
    description: { value: '', error: null },
    elementType: 'START_ELEMENT',
    guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
    isCanvasElement: true,
    label: { value: '', error: null },
    name: { value: '', error: null },
    object: { value: 'Account', error: null },
    objectIndex: { value: 'guid', error: null },
    filterType: RECORD_FILTER_CRITERIA.ALL,
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

const scheduledNewStartElementWithoutFilters = () => ({
    description: { value: '', error: null },
    elementType: 'START_ELEMENT',
    guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
    isCanvasElement: true,
    label: { value: '', error: null },
    name: { value: '', error: null },
    object: { value: 'Account', error: null },
    objectIndex: { value: 'guid', error: null },
    filterType: RECORD_FILTER_CRITERIA.NONE,
    filters: [],
    frequency: { value: 'Once', error: null },
    startDate: undefined,
    startTime: undefined,
    triggerType: { value: 'Scheduled', error: null }
});

describe('start-editor', () => {
    it('when triggerType is not set, schedule section is not displayed', () => {
        const startElement = createComponentForTest(defaultNewStartElement());
        expect(startElement.node.triggerType.value).toBeFalsy();
        const scheduleSection = query(
            startElement,
            SELECTORS.SECHEDULE_SECTION
        );
        expect(scheduleSection).toBeFalsy();
    });

    it('when before save trigger perm is disabled, before save trigger type is not displayed', () => {
        contextLibMock.orgHasBeforeSaveEnabled.mockReturnValue(false);
        const startElement = createComponentForTest(defaultNewStartElement());
        const scheduleSection = query(
            startElement,
            SELECTORS.TRIGGER_TYPE_INPUT
        );
        expect(scheduleSection.options).toHaveLength(2);
    });

    it('when before save trigger perm is enabled, before save trigger type is displayed', () => {
        contextLibMock.orgHasBeforeSaveEnabled.mockReturnValue(true);
        const startElement = createComponentForTest(defaultNewStartElement());
        const scheduleSection = query(
            startElement,
            SELECTORS.TRIGGER_TYPE_INPUT
        );
        expect(scheduleSection.options).toHaveLength(3);
    });

    it('when triggerType is scheduled, schedule section is displayed', () => {
        const startElement = createComponentForTest(scheduledNewStartElement());
        expect(startElement.node.triggerType.value).toBe(
            FLOW_TRIGGER_TYPE.SCHEDULED
        );
        const scheduleSection = query(
            startElement,
            SELECTORS.SECHEDULE_SECTION
        );
        expect(scheduleSection).toBeTruthy();
    });

    it('when triggerType is beforeSave, beforeSave section is displayed', () => {
        const startElement = createComponentForTest(
            beforeSaveNewStartElement()
        );
        expect(startElement.node.triggerType.value).toBe(
            FLOW_TRIGGER_TYPE.BEFORE_SAVE
        );
        const scheduleSection = query(
            startElement,
            SELECTORS.SECHEDULE_SECTION
        );
        const saveTypeSection = query(
            startElement,
            SELECTORS.SAVE_TYPE_SECTION
        );
        expect(scheduleSection).toBeNull();
        expect(saveTypeSection).toBeTruthy();
    });

    it('handles triggerType updates', () => {
        const startElement = createComponentForTest(scheduledNewStartElement());
        const event = new CustomEvent('change', {
            detail: {
                value: FLOW_TRIGGER_TYPE.SCHEDULED
            }
        });
        query(startElement, SELECTORS.TRIGGER_TYPE_INPUT).dispatchEvent(event);

        expect(startElement.node.triggerType.value).toBe(
            FLOW_TRIGGER_TYPE.SCHEDULED
        );
    });

    it('handles startDate updates', () => {
        const startElement = createComponentForTest(scheduledNewStartElement());
        const event = new CustomEvent('change', {
            detail: {
                value: 'Jul 25, 2019'
            }
        });
        query(startElement, SELECTORS.START_DATE_INPUT).dispatchEvent(event);

        expect(startElement.node.startDate.value).toBe('Jul 25, 2019');
    });

    it('handles startTime updates', () => {
        const startElement = createComponentForTest(scheduledNewStartElement());
        const event = new CustomEvent('change', {
            detail: {
                value: '11:59 AM'
            }
        });
        query(startElement, SELECTORS.START_DATE_INPUT).dispatchEvent(event);

        expect(startElement.node.startDate.value).toBe('11:59 AM');
    });

    it('handles frequency updates', () => {
        const startElement = createComponentForTest(scheduledNewStartElement());
        const event = new CustomEvent('change', {
            detail: {
                value: FLOW_TRIGGER_FREQUENCY.WEEKLY
            }
        });
        query(startElement, SELECTORS.FREQUENCY_INPUT).dispatchEvent(event);

        expect(startElement.node.frequency.value).toBe(
            FLOW_TRIGGER_FREQUENCY.WEEKLY
        );
    });

    it('entity picker (object) value should be "Account" for scheduled', () => {
        const startElement = createComponentForTest(scheduledNewStartElement());
        expect(getEntityResourcePicker(startElement).value).toBe('Account');
    });

    it('entity picker (object) value should be "Account" for beforeSave', () => {
        const startElement = createComponentForTest(
            beforeSaveNewStartElement()
        );
        expect(getEntityResourcePicker(startElement).value).toBe('Account');
    });

    it('record filter type should be "none" ', () => {
        const startElement = createComponentForTest(
            scheduledNewStartElementWithoutFilters()
        );
        expect(getRecordFilter(startElement).filterType).toBe(
            RECORD_FILTER_CRITERIA.NONE
        );
    });

    it('record filter type should be "all" ', () => {
        expressionUtilsMock.getResourceByUniqueIdentifier.mockReturnValue(
            store.accountSObjectVariable
        );
        const startElement = createComponentForTest(
            scheduledNewStartElementWithFilters()
        );
        expect(getRecordFilter(startElement).filterType).toBe(
            RECORD_FILTER_CRITERIA.ALL
        );
    });

    describe('handle events', () => {
        let startElement, entityResourcePicker;
        beforeEach(() => {
            expressionUtilsMock.getResourceByUniqueIdentifier.mockReturnValue(
                store.accountSObjectVariable
            );
            startElement = createComponentForTest(
                scheduledNewStartElementWithFilters()
            );
        });
        it('handles "entityResourcePicker" value changed event', () => {
            entityResourcePicker = getEntityResourcePicker(startElement);
            entityResourcePicker.dispatchEvent(getComboboxStateChangedEvent());
            return Promise.resolve().then(() => {
                expect(entityResourcePicker.value).toBe('guid1');
            });
        });
        it('handle UpdateRecordFilterEvent should update the filter element', () => {
            const updateRecordFilterEvent = new UpdateRecordFilterEvent(
                0,
                filterElement,
                null
            );
            getRecordFilter(startElement).dispatchEvent(
                updateRecordFilterEvent
            );
            return Promise.resolve().then(() => {
                expect(startElement.node.filters[0]).toMatchObject(
                    filterElement
                );
            });
        });
        it('handle AddRecordFilterEvent should add a filter element', () => {
            const addRecordFilterEvent = new AddRecordFilterEvent(); // This is using the numerical rowIndex not the property rowIndex
            getRecordFilter(startElement).dispatchEvent(addRecordFilterEvent);
            return Promise.resolve().then(() => {
                expect(startElement.node.filters).toHaveLength(2);
            });
        });
        it('handle record filter type Change event', () => {
            const recordFilterTypeChangedEvent = new RecordFilterTypeChangedEvent(
                RECORD_FILTER_CRITERIA.ALL
            );
            getRecordFilter(startElement).dispatchEvent(
                recordFilterTypeChangedEvent
            );
            return Promise.resolve().then(() => {
                expect(startElement.node.filterType).toBe(
                    RECORD_FILTER_CRITERIA.ALL
                );
            });
        });
        it('record filter fire DeleteRecordFilterEvent', () => {
            const deleteRecordFilterEvent = new DeleteRecordFilterEvent(0); // This is using the numerical rowIndex not the property rowIndex
            getRecordFilter(startElement).dispatchEvent(
                deleteRecordFilterEvent
            );
            return Promise.resolve().then(() => {
                expect(startElement.node.filters).toHaveLength(0);
            });
        });
    });
});
