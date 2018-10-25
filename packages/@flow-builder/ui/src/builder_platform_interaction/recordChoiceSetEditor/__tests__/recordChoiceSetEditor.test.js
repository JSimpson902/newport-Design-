import { createElement } from 'lwc';
import { getShadowRoot } from 'lwc-test-utils';
import RecordChoiceSetEditor from '../recordChoiceSetEditor';
import { PropertyChangedEvent } from 'builder_platform_interaction/events';
import {
    createAction,
    PROPERTY_EDITOR_ACTION
} from 'builder_platform_interaction/actions';
import { getFieldsForEntity } from 'builder_platform_interaction/sobjectLib';
import { RecordFilterTypeChangedEvent } from 'builder_platform_interaction/events';

const SELECTORS = {
    LABEL_DESCRIPTION: 'builder_platform_interaction-label-description',
    ENTITY_RESOURCE_PICKER: 'builder_platform_interaction-entity-resource-picker',
    RECORD_FILTER: 'builder_platform_interaction-record-filter',
    RECORD_SORT: 'builder_platform_interaction-record-sort',
    CHOICE_LIMIT_INPUT: '.choice-limit',
};

const setupComponentUnderTest = (recordChoiceObject) => {
    const element = createElement('builder_platform_interaction-record-choice-set-editor', {
        is: RecordChoiceSetEditor,
    });
    element.node = recordChoiceObject;
    document.body.appendChild(element);
    return element;
};
jest.mock('builder_platform_interaction/actions', () => {
    return {
        createAction: jest.fn().mockImplementation((type, payload) => payload),
        PROPERTY_EDITOR_ACTION: require.requireActual('builder_platform_interaction/actions').PROPERTY_EDITOR_ACTION,
    };
});
// helps remove dependency of the editor tests on the reducer functionality
jest.mock('../recordChoiceSetReducer', () => {
    return {
        recordChoiceSetReducer: jest.fn().mockImplementation(((obj) => Object.assign({}, obj))),
    };
});
jest.mock('builder_platform_interaction/sobjectLib', () => {
    const sobjectLib = require.requireActual('builder_platform_interaction/sobjectLib');
    const mockSobjectLib = Object.assign({}, sobjectLib);
    mockSobjectLib.getFieldsForEntity = jest.fn();
    return mockSobjectLib;
});
const newRecordObjectOrField = {item: {value: 'Contact'}, displayText: 'contact', error: null};

function getComboboxStateChangedEvent() {
    return new CustomEvent('comboboxstatechanged', {
        detail: newRecordObjectOrField,
    });
}
describe('record-choice-set-editor', () => {
    const recordChoiceObject = {
        elementType: 'RECORD_CHOICE_SET',
        guid: 'guid_1',
        name: {
            value: 'recordChoice1',
            error: null
        },
        description: {
            value: 'This is record choice',
            error: null
        },
        object: {
            value: 'Account',
            error: null
        },
        dataType: {
            value: 'Text',
            error: null
        },
        filterType: {
            value: 'none',
            error: null
        },
        sortField: {
            value: 'AccountSource',
            error: null
        },
        sortOrder: {
            value: 'Asc',
            error: null
        },
        limit: {
            value: '',
            error: null
        },
        displayField: {
            value: 'AccountSource',
            error: null
        },
        valueField: {
            value: 'AccountSource',
            error: null
        },
        outputAssignments: []
    };

    const recordChoiceObjectWithoutObjectField = {
        elementType: 'RECORD_CHOICE_SET',
        guid: 'guid_1',
        name: {
            value: 'recordChoice1',
            error: null
        },
        description: {
            value: 'This is record choice',
            error: null
        },
        object: {
            value: null,
            error: null
        }
    };
    describe('Label description component', () => {
        let recordChoiceEditor;
        let labelDescription;
        beforeEach(() => {
            recordChoiceEditor = setupComponentUnderTest(recordChoiceObject);
            labelDescription = getShadowRoot(recordChoiceEditor).querySelector(SELECTORS.LABEL_DESCRIPTION);
        });

        it('Label-Description should be defined', () => {
            expect(labelDescription).not.toBeNull();
        });

        it('Devname should be same as the name of the recordChoiceObject', () => {
            expect(labelDescription.devName).toEqual(recordChoiceObject.name);
        });

        it('Description should be same as the description of the recordChoiceObject', () => {
            expect(labelDescription.description).toEqual(recordChoiceObject.description);
        });

        it('Handles the property changed event and updates the property', () => {
            const event = new PropertyChangedEvent('description', 'new desc', null);
            getShadowRoot(recordChoiceEditor).querySelector('builder_platform_interaction-label-description').dispatchEvent(event);
            expect(createAction).toHaveBeenCalledWith(PROPERTY_EDITOR_ACTION.UPDATE_ELEMENT_PROPERTY, {
                propertyName: 'description',
                value: 'new desc',
                error: null,
                doValidateProperty: true
            });
        });
    });

    describe('Entity-Resource-Picker for Record Choice Object', () => {
        let recordChoiceEditor;
        let entityResourcePicker;
        beforeEach(() => {
            recordChoiceEditor = setupComponentUnderTest(recordChoiceObject);
            entityResourcePicker = getShadowRoot(recordChoiceEditor).querySelector(SELECTORS.ENTITY_RESOURCE_PICKER);
        });

        it('entity-resource-picker should be defined', () => {
            expect(entityResourcePicker).not.toBeNull();
        });

        it('Changing value in entity-resource-picker should update object', () => {
            entityResourcePicker.dispatchEvent(getComboboxStateChangedEvent());
            expect(createAction.mock.calls[1][1]).toEqual({
                propertyName: 'object',
                value: 'Contact',
                error: null,
                doValidateProperty: true
            });
        });

        it('Changing value in entity-resource-picker should call getFieldsForEntity', () => {
            entityResourcePicker.dispatchEvent(getComboboxStateChangedEvent());
            expect(getFieldsForEntity).toHaveBeenCalledTimes(3);
        });

        it('Changing value in entity-resource-picker should update filterType', () => {
            entityResourcePicker.dispatchEvent(getComboboxStateChangedEvent());
            expect(createAction.mock.calls[2][1]).toEqual({
                propertyName: 'filterType',
                value: 'none',
                error: null,
                doValidateProperty: false
            });
        });
    });
    describe('second-section', () => {
        let recordChoiceEditor;
        let recordFilter, recordSort;
        describe('record-filter', () => {
            describe('whithout object field filled', () => {
                recordChoiceEditor = setupComponentUnderTest(recordChoiceObjectWithoutObjectField);
                recordFilter = getShadowRoot(recordChoiceEditor).querySelector(SELECTORS.RECORD_FILTER);
                it('record-filter is undefined', () => {
                    expect(recordFilter).toBeNull();
                });
            });
            describe('with object field filled', () => {
                beforeEach(() => {
                    recordChoiceEditor = setupComponentUnderTest(recordChoiceObject);
                    recordFilter = getShadowRoot(recordChoiceEditor).querySelector(SELECTORS.RECORD_FILTER);
                });
                it('Filter section should be defined', () => {
                    expect(recordFilter).not.toBeNull();
                });
                it('Handles the RecordFilterTypeChangedEvent Changed event', () => {
                    const filterTypeChangedEvent = new RecordFilterTypeChangedEvent('all');
                    recordFilter.dispatchEvent(filterTypeChangedEvent);
                    expect(createAction).toHaveBeenCalledWith(PROPERTY_EDITOR_ACTION.UPDATE_ELEMENT_PROPERTY, {
                        propertyName : 'filterType',
                        value: 'all',
                        error: null,
                        doValidateProperty: true
                    });
                });
            });
        });
        describe('record-sort', () => {
            describe('whithout object field filled', () => {
                recordChoiceEditor = setupComponentUnderTest(recordChoiceObjectWithoutObjectField);
                recordSort = getShadowRoot(recordChoiceEditor).querySelector(SELECTORS.RECORD_SORT);
                it('record-filter is undefined', () => {
                    expect(recordSort).toBeNull();
                });
            });
            describe('with object field filled', () => {
                beforeEach(() => {
                    recordChoiceEditor = setupComponentUnderTest(recordChoiceObject);
                    recordSort = getShadowRoot(recordChoiceEditor).querySelector(SELECTORS.RECORD_SORT);
                });
                it('Sort section should be defined', () => {
                    expect(recordSort).not.toBeNull();
                });
                it('Handles the change event when sort order is changed', () => {
                    const recordSortOrderChangedEvent = new CustomEvent('change', {
                        detail: {
                            sortOrder: 'desc',
                            fieldApiName: 'AccountSource'
                        },
                    });
                    recordSort.dispatchEvent(recordSortOrderChangedEvent);
                    expect(createAction).toHaveBeenCalledWith(PROPERTY_EDITOR_ACTION.UPDATE_ELEMENT_PROPERTY, {
                        propertyName : 'sortOrder',
                        value: 'desc',
                        error: undefined,
                        doValidateProperty: false
                    });
                });
                it('Handles the change event when sort fieldAPiName is changed', () => {
                    const recordSortOrderChangedEvent = new CustomEvent('change', {
                        detail: {
                            sortOrder: 'asc',
                            fieldApiName: 'testField'
                        },
                    });
                    recordSort.dispatchEvent(recordSortOrderChangedEvent);
                    expect(createAction).toHaveBeenCalledWith(PROPERTY_EDITOR_ACTION.UPDATE_ELEMENT_PROPERTY, {
                        propertyName : 'sortField',
                        value: 'testField',
                        error: undefined,
                        doValidateProperty: false
                    });
                });
            });
        });
        describe('choice-limit-input', () => {
            it('is null when the object is not defined', () => {
                recordChoiceEditor = setupComponentUnderTest(recordChoiceObjectWithoutObjectField);
                const choiceLimit = getShadowRoot(recordChoiceEditor).querySelector(SELECTORS.CHOICE_LIMIT_INPUT);
                expect(choiceLimit).toBeNull();
            });
            it('is defined when the object is defined', () => {
                recordChoiceEditor = setupComponentUnderTest(recordChoiceObject);
                const choiceLimit = getShadowRoot(recordChoiceEditor).querySelector(SELECTORS.CHOICE_LIMIT_INPUT);
                expect(choiceLimit).not.toBeNull();
            });
            it('default value is empty string', () => {
                recordChoiceEditor = setupComponentUnderTest(recordChoiceObject);
                const choiceLimit = getShadowRoot(recordChoiceEditor).querySelector(SELECTORS.CHOICE_LIMIT_INPUT);
                expect(choiceLimit.value).toBe('');
            });
        });
    });
});