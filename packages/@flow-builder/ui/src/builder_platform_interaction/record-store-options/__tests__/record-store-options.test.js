import {createElement} from 'engine';
import { getShadowRoot } from 'lwc-test-utils';
import RecordStoreOption from 'builder_platform_interaction-record-store-options';
import { RecordStoreOptionChangedEvent } from 'builder_platform_interaction-events';
import { ELEMENT_TYPE } from 'builder_platform_interaction-flow-metadata';

const createComponentUnderTest = (elementType, props) => {
    const el = createElement('builder_platform_interaction-record-store-options', {
        is: RecordStoreOption
    });
    el.elementType = elementType;
    Object.assign(el, props);
    document.body.appendChild(el);
    return el;
};

const NUMBER_RECORDS_TO_STORE_OPTIONS = {
    firstRecord: 'firstRecord',
    allRecords: 'allRecord'
};

const WAY_TO_STORE_FIELDS_OPTIONS = {
    togetherInsObjectVariable: 'sObjectVariable',
    separateVariable: 'separateVariables'
};

const selectors = {
    lightningRadioGroup: 'lightning-radio-group',
    lightningFormattedRichText : 'lightning-formatted-rich-text',
    lightningCombobox : 'lightning-input'
};

const getNumberRecordsToStoreRadioGroup = (recordStoreOptionComponent) => {
    const numberRecordsToStoreRadioGroup = getShadowRoot(recordStoreOptionComponent).querySelectorAll(selectors.lightningRadioGroup);
    return numberRecordsToStoreRadioGroup[0];
};

const getTitle = (recordStoreOptionComponent) => {
    const formattedRichText = getShadowRoot(recordStoreOptionComponent).querySelector(selectors.lightningFormattedRichText);
    return formattedRichText;
};

const getAssignNullIfNoRecordFoundCombobox = (recordStoreOptionComponent) => {
    const assignNullIfNoRecordFoundCombobox = getShadowRoot(recordStoreOptionComponent).querySelector(selectors.lightningCombobox);
    return assignNullIfNoRecordFoundCombobox;
};

const getChangeEvent = (eventValue) => {
    return new CustomEvent('change', {
        detail: {
            value : eventValue,
        }
    });
};

const getRecordStoreOptionChangedEventDetail = (assignNullToVariableNoRecordValue, numberRecordsToStoreValue, wayToStoreFieldsValue) => {
    return {assignNullToVariableNoRecord: assignNullToVariableNoRecordValue,
        numberRecordsToStore: numberRecordsToStoreValue,
        wayToStoreFields: wayToStoreFieldsValue};
};

describe('record-store-options default', () => {
    let recordStoreOptionComponent;
    beforeEach(() => {
        recordStoreOptionComponent = createComponentUnderTest(ELEMENT_TYPE.RECORD_LOOKUP);
    });
    test('Check Label', () => {
        expect(recordStoreOptionComponent).toBeDefined();
        expect(getTitle(recordStoreOptionComponent).value).toBe('FlowBuilderRecordEditor.storeFieldsSelectionLabel');
    });
    test('Should have 2 options to store records', () => {
        expect(getNumberRecordsToStoreRadioGroup(recordStoreOptionComponent).options).toHaveLength(2);
    });
    test('Check Radio Button default is firstRecord', () => {
        expect(getNumberRecordsToStoreRadioGroup(recordStoreOptionComponent).value).toBe(NUMBER_RECORDS_TO_STORE_OPTIONS.firstRecord);
    });
    test('checkbox "Assign Null if no record found" is not checked', () => {
        expect(getAssignNullIfNoRecordFoundCombobox(recordStoreOptionComponent).checked).toBe(false);
    });
    test('Event RecordStoreOptionChangedEvent is dispatched after selected radio button changed', async () => {
        const eventCallback = jest.fn();
        recordStoreOptionComponent.addEventListener(RecordStoreOptionChangedEvent.EVENT_NAME, eventCallback);
        getNumberRecordsToStoreRadioGroup(recordStoreOptionComponent).dispatchEvent(getChangeEvent(NUMBER_RECORDS_TO_STORE_OPTIONS.allRecords));
        await Promise.resolve();
        expect(eventCallback).toHaveBeenCalled();
        expect(eventCallback.mock.calls[0][0].detail).toMatchObject(getRecordStoreOptionChangedEventDetail(false, NUMBER_RECORDS_TO_STORE_OPTIONS.allRecords, WAY_TO_STORE_FIELDS_OPTIONS.togetherInsObjectVariable));
    });
    test('checkbox "Assign Null if no record found" changed', async () => {
        const eventCallback = jest.fn();
        recordStoreOptionComponent.addEventListener(RecordStoreOptionChangedEvent.EVENT_NAME, eventCallback);
        getAssignNullIfNoRecordFoundCombobox(recordStoreOptionComponent).dispatchEvent(getChangeEvent(true));
        await Promise.resolve();
        expect(eventCallback).toHaveBeenCalled();
        expect(eventCallback.mock.calls[0][0].detail).toMatchObject(getRecordStoreOptionChangedEventDetail(true, NUMBER_RECORDS_TO_STORE_OPTIONS.firstRecord, WAY_TO_STORE_FIELDS_OPTIONS.togetherInsObjectVariable));
    });
});

describe('record-store-options with values', () => {
    let recordStoreOptionComponent;
    test('Check Radio Button is firstRecord if outputReference refers to sObject variable', () => {
        recordStoreOptionComponent = createComponentUnderTest(ELEMENT_TYPE.RECORD_LOOKUP, {numberOfRecordsToStore: NUMBER_RECORDS_TO_STORE_OPTIONS.firstRecord});
        expect(getNumberRecordsToStoreRadioGroup(recordStoreOptionComponent).value).toBe(NUMBER_RECORDS_TO_STORE_OPTIONS.firstRecord);
    });
    test('Check Radio Button is allRecords if outputReference refers to sObject collection variable', () => {
        recordStoreOptionComponent = createComponentUnderTest(ELEMENT_TYPE.RECORD_LOOKUP, {numberOfRecordsToStore: NUMBER_RECORDS_TO_STORE_OPTIONS.allRecords});
        expect(getNumberRecordsToStoreRadioGroup(recordStoreOptionComponent).value).toBe(NUMBER_RECORDS_TO_STORE_OPTIONS.allRecords);
    });
    test('checkbox "Assign Null if no record found" is checked', () => {
        recordStoreOptionComponent = createComponentUnderTest(ELEMENT_TYPE.RECORD_LOOKUP, {assignNullValuesIfNoRecordsFound: true});
        expect(getAssignNullIfNoRecordFoundCombobox(recordStoreOptionComponent).checked).toBe(true);
    });
});

describe('record-store-options Record Create', () => {
    let recordStoreOptionComponent;
    beforeEach(() => {
        recordStoreOptionComponent = createComponentUnderTest(ELEMENT_TYPE.RECORD_CREATE);
    });
    test('Check Label', () => {
        expect(recordStoreOptionComponent).toBeDefined();
        expect(getTitle(recordStoreOptionComponent)).toBeNull();
    });
});