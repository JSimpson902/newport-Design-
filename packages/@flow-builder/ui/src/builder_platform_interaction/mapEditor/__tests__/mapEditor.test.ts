import { createElement } from 'lwc';
import MapEditor from 'builder_platform_interaction/mapEditor';
import { Store } from 'builder_platform_interaction/storeLib';
import * as store from 'mock/storeData';
import { addCurlyBraces } from 'builder_platform_interaction/commonUtils';
import { setDocumentBodyChildren, ticks } from 'builder_platform_interaction/builderTestUtils';
import { flowWithAllElementsUIModel } from 'mock/storeData';
import { INTERACTION_COMPONENTS_SELECTORS } from 'builder_platform_interaction/builderTestUtils';
import { CollectionReferenceChangedEvent, UpdateCollectionProcessorEvent } from 'builder_platform_interaction/events';
import { ComboboxTestComponent } from '../../integrationTests/__tests__/comboboxTestUtils';

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

const commonUtils = jest.requireActual('builder_platform_interaction/commonUtils');
commonUtils.format = jest
    .fn()
    .mockImplementation((formatString, ...args) => formatString + '(' + args.toString() + ')');

const defaultEmptyElementInfo = {
    collectionReference: { value: null, error: null },
    currentValueFromCollection: { value: null, error: null },
    mapItems: [],
    outputTable: { value: '', error: null },
    storeOutputAutomatically: true
};

const testElementInfoWithSObjectCollection = {
    collectionReference: { value: store.accountSObjectCollectionVariable.guid, error: null },
    currentValueFromCollection: { value: store.contactSObjectVariable.name, error: null },
    mapItems: [
        {
            leftHandSide: { value: 'Contact.Description', error: null },
            rightHandSide: { value: 'This is my description', error: null },
            rightHandSideDataType: { value: 'String', error: null },
            operator: { value: 'Assign', error: null },
            rowIndex: 'MapItem_1'
        }
    ],
    outputTable: { value: 'Contact', error: null },
    storeOutputAutomatically: true
};

const createComponentUnderTest = (props?: {}) => {
    const el = createElement('builder_platform_interaction-map-editor', {
        is: MapEditor
    });
    Object.assign(el, props);
    setDocumentBodyChildren(el);
    return el;
};

const SELECTORS = {
    INPUT_COLLECTION: 'builder_platform_interaction-input-collection-picker',
    HELP_TEXT: '.helpText'
};

const getInputCollection = (mapEditor) => mapEditor.shadowRoot.querySelector(SELECTORS.INPUT_COLLECTION);

const getFerovResourcePicker = (inputCollection) =>
    inputCollection.shadowRoot.querySelector(INTERACTION_COMPONENTS_SELECTORS.FEROV_RESOURCE_PICKER);

const getBaseResourcePicker = (ferovResourcePicker) =>
    ferovResourcePicker.shadowRoot.querySelector(INTERACTION_COMPONENTS_SELECTORS.BASE_RESOURCE_PICKER);

const getCombobox = (inputCollection) => {
    const baseResourcePicker = getBaseResourcePicker(getFerovResourcePicker(inputCollection));
    return new ComboboxTestComponent(
        baseResourcePicker.shadowRoot.querySelector(INTERACTION_COMPONENTS_SELECTORS.COMBOBOX)
    );
};

const getHelpText = (mapEditor) => mapEditor.shadowRoot.querySelector('.helpText');

const getMapItems = (mapEditor) =>
    mapEditor.shadowRoot.querySelector(INTERACTION_COMPONENTS_SELECTORS.RECORD_INPUT_OUTPUT_ASSIGNMENTS);

const GROUP_LABELS = {
    APEX_COLLECTION_VARIABLES: 'FLOWBUILDERELEMENTCONFIG.APEXCOLLECTIONVARIABLEPLURALLABEL',
    COLLECTION_VARIABLES: 'FLOWBUILDERELEMENTCONFIG.COLLECTIONVARIABLEPLURALLABEL',
    RECORD_COLLECTION_VARIABLES: 'FLOWBUILDERELEMENTCONFIG.SOBJECTCOLLECTIONPLURALLABEL'
};

describe('map-editor', () => {
    beforeAll(() => {
        // @ts-ignore
        Store.setMockState(flowWithAllElementsUIModel);
    });
    afterAll(() => {
        // @ts-ignore
        Store.resetStore();
    });
    describe('new map mode', () => {
        let mapEditor, inputCollection;
        beforeEach(() => {
            mapEditor = createComponentUnderTest({ elementInfo: defaultEmptyElementInfo });
            inputCollection = getInputCollection(mapEditor);
        });
        it('should not be null', () => {
            expect(mapEditor).not.toBeNull();
        });
        it('should have the input collection combobox', () => {
            expect(inputCollection).not.toBeNull();
        });
        it('should have no selected flow collection', () => {
            const ferovResourcePicker = getFerovResourcePicker(inputCollection);
            expect(ferovResourcePicker.value).toEqual('');
        });
        it('should contain sObject collection variables from flowWithAllElementsUIModel', () => {
            const groupedCombobox = getCombobox(inputCollection).getGroupedCombobox();
            expect(
                groupedCombobox.getItemInGroup(
                    GROUP_LABELS.RECORD_COLLECTION_VARIABLES,
                    'displayText',
                    addCurlyBraces(store.accountSObjectCollectionVariable.name)
                )
            ).not.toBeNull();
        });
        it('should not contain primitive collection variables from flowWithAllElementsUIModel', () => {
            const groupedCombobox = getCombobox(inputCollection).getGroupedCombobox();
            expect(
                groupedCombobox.getItemInGroup(
                    GROUP_LABELS.COLLECTION_VARIABLES,
                    'displayText',
                    addCurlyBraces(store.stringCollectionVariable1.name)
                )
            ).toBeUndefined();
        });
        it('should not contain map items', () => {
            const mapItems = getMapItems(mapEditor);
            expect(mapItems).toBeNull();
        });
    });
    describe('edit map mode', () => {
        describe('SObject Collection', () => {
            let mapEditor, inputCollection;
            beforeEach(() => {
                mapEditor = createComponentUnderTest({ elementInfo: testElementInfoWithSObjectCollection });
                inputCollection = getInputCollection(mapEditor);
            });
            it('should not be null', () => {
                expect(mapEditor).not.toBeNull();
            });
            it('should have the input collection combobox', () => {
                expect(inputCollection).not.toBeNull();
            });
            it('should have selected input collection', () => {
                const ferovRP = getFerovResourcePicker(inputCollection);
                expect(ferovRP.value.value).toEqual(testElementInfoWithSObjectCollection.collectionReference.value);
            });
            it('should have helpText', () => {
                const helpText = getHelpText(mapEditor);
                expect(helpText).not.toBeNull();
                expect(helpText.textContent).toBe(
                    'FlowBuilderMapEditor.newCollection(' + testElementInfoWithSObjectCollection.outputTable.value + ')'
                );
            });
        });
        describe('handling events', () => {
            describe('changing the input collection', () => {
                let mapEditor, inputCollection;
                beforeEach(() => {
                    mapEditor = createComponentUnderTest({ elementInfo: testElementInfoWithSObjectCollection });
                    inputCollection = getInputCollection(mapEditor);
                });
                it('should fire UpdateCollectionProcessorEvent', async () => {
                    const eventCallback = jest.fn();
                    mapEditor.addEventListener(UpdateCollectionProcessorEvent.EVENT_NAME, eventCallback);
                    const valueChangedEvent = new CollectionReferenceChangedEvent(
                        store.caseSObjectCollectionVariable.guid,
                        null
                    );
                    inputCollection.dispatchEvent(valueChangedEvent);
                    await ticks(1);
                    expect(eventCallback).toHaveBeenCalled();
                });
            });
        });
        // TODO: will add more tests in next PR
    });
});
