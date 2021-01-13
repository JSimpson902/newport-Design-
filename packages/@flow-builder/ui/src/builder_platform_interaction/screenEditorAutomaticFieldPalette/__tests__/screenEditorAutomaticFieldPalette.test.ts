import ScreenEditorAutomaticFieldPalette from '../screenEditorAutomaticFieldPalette';
import { createElement } from 'lwc';
import { Store } from 'builder_platform_interaction/storeLib';
import { flowWithAllElementsUIModel } from 'mock/storeData';

import {
    SObjectReferenceChangedEvent,
    RemoveMergeFieldPillEvent,
    EditMergeFieldPillEvent
} from 'builder_platform_interaction/events';
import { ticks } from 'builder_platform_interaction/builderTestUtils';
import * as storeMockedData from 'mock/storeData';

import { accountFields as mockAccountFields } from 'serverData/GetFieldsForEntity/accountFields.json';
import { INTERACTION_COMPONENTS_SELECTORS } from 'builder_platform_interaction/builderTestUtils';

jest.mock('builder_platform_interaction/sobjectLib', () => ({
    fetchFieldsForEntity: jest.fn(() => {
        return Promise.resolve(mockAccountFields);
    })
}));
jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));
jest.mock('builder_platform_interaction/ferovResourcePicker', () =>
    require('builder_platform_interaction_mocks/ferovResourcePicker')
);
jest.mock('builder_platform_interaction/fieldToFerovExpressionBuilder', () =>
    require('builder_platform_interaction_mocks/fieldToFerovExpressionBuilder')
);

const TOTAL_SUPPORTED_FIELDS = 71;
const NB_REQUIRED_FIELDS = 4;

const SELECTORS = {
    searchInput: '.palette-search-input'
};

const getSObjectOrSObjectCollectionPicker = (screenEditorAutomaticFieldPalette) =>
    screenEditorAutomaticFieldPalette.shadowRoot.querySelector(
        INTERACTION_COMPONENTS_SELECTORS.SOBJECT_OR_SOBJECT_COLLECTION_PICKER
    );

const getBasePalette = (screenEditorAutomaticFieldPalette) =>
    screenEditorAutomaticFieldPalette.shadowRoot.querySelector(INTERACTION_COMPONENTS_SELECTORS.LEFT_PANEL_PALETTE);

const getNoItemToShowIllustration = (screenEditorAutomaticFieldPalette) =>
    screenEditorAutomaticFieldPalette.shadowRoot.querySelector(INTERACTION_COMPONENTS_SELECTORS.ILLUSTRATION);

const getSearchInput = (screenEditorAutomaticFieldPalette) =>
    screenEditorAutomaticFieldPalette.shadowRoot.querySelector(SELECTORS.searchInput);

function createComponentForTest() {
    const el = createElement('builder_platform_interaction-screen-editor-automatic-field-palette', {
        is: ScreenEditorAutomaticFieldPalette
    });
    document.body.appendChild(el);
    return el;
}

describe('Screen editor automatic field palette', () => {
    let element;
    beforeEach(() => {
        element = createComponentForTest();
    });
    beforeAll(() => {
        // @ts-ignore
        Store.setMockState(flowWithAllElementsUIModel);
    });
    afterAll(() => {
        // @ts-ignore
        Store.resetStore();
    });
    describe('Check initial state', () => {
        it('should contain an entity resource picker for sobject', () => {
            expect(getSObjectOrSObjectCollectionPicker(element)).not.toBeNull();
        });
        it('should not show the palette to show fields', () => {
            expect(getBasePalette(element)).toBeNull();
        });
        it('should display the no item to show illustration', () => {
            expect(getNoItemToShowIllustration(element)).not.toBeNull();
        });
    });

    describe('Event handling related to search', () => {
        const sObjectReferenceChangedEvent = new SObjectReferenceChangedEvent(
            storeMockedData.accountSObjectVariable.guid
        );
        beforeEach(async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
        });
        it('should not trim the given search term', async () => {
            const searchTerm = 'Billing ';
            getSearchInput(element).value = searchTerm;
            const inputEvent = new CustomEvent('input');
            getSearchInput(element).dispatchEvent(inputEvent);
            await ticks(1);
            expect(element.searchPattern).toEqual(searchTerm);
        });
    });

    describe('SObjectReferenceChangedEvent event handling', () => {
        const sObjectReferenceChangedEvent = new SObjectReferenceChangedEvent(
            storeMockedData.accountSObjectVariable.guid
        );
        test('SObjectReferenceChangedEvent should update properly recordVariable', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            expect(element.recordVariable).toEqual(storeMockedData.accountSObjectVariable.guid);
        });
        test('SObjectReferenceChangedEvent should load properly entityFields', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            expect(element.entityFields).toEqual(mockAccountFields);
        });
        test('SObjectReferenceChangedEvent should generate proper data with 2 sections for inner palette', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            expect(element.paletteData).toHaveLength(2);
        });
        test('SObjectReferenceChangedEvent should generate proper items for palette first required section', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            expect(element.paletteData[0]._children).toHaveLength(NB_REQUIRED_FIELDS);
        });
        test('SObjectReferenceChangedEvent should generate proper items for palette second section', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            expect(element.paletteData[1]._children).toHaveLength(TOTAL_SUPPORTED_FIELDS - NB_REQUIRED_FIELDS);
        });
        test('SObjectReferenceChangedEvent should hide no items to show illustration', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            expect(getNoItemToShowIllustration(element)).toBeNull();
        });
        test('SObjectReferenceChangedEvent should display base palette', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            expect(getBasePalette(element)).not.toBeNull();
        });
        test('SObjectReferenceChangedEvent with error should keep illustration visible', async () => {
            const sObjectReferenceChangedEventwithError = new SObjectReferenceChangedEvent(
                'myCrazyValue',
                'Enter a valid value.'
            );
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEventwithError);
            await ticks(1);
            expect(getNoItemToShowIllustration(element)).not.toBeNull();
        });
        test('Search pattern should be reset after sObject change', async () => {
            element.searchPattern = 'name';
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            expect(element.searchPattern).toBeNull();
        });
        test('SObjectReferenceChangedEvent with same value still displays base palette', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            expect(getBasePalette(element)).not.toBeNull();
        });
        test('SObjectReferenceChangedEvent with same value still generate proper items for palette first required section', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            expect(element.paletteData[0]._children).toHaveLength(NB_REQUIRED_FIELDS);
        });
        test('SObjectReferenceChangedEvent with same value still generate proper items for palette second section', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            expect(element.paletteData[1]._children).toHaveLength(TOTAL_SUPPORTED_FIELDS - NB_REQUIRED_FIELDS);
        });
        test('SObjectReferenceChangedEvent with same value keeps the search pattern as is', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            element.searchPattern = 'name';
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
            expect(element.searchPattern).toEqual('name');
        });
    });

    describe('Pills related event handling', () => {
        const sObjectReferenceChangedEvent = new SObjectReferenceChangedEvent(
            storeMockedData.accountSObjectVariable.guid
        );
        const removeMergeFieldPillEvent = new RemoveMergeFieldPillEvent({});
        const editMergeFieldPillEvent = new EditMergeFieldPillEvent({});
        beforeEach(async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(sObjectReferenceChangedEvent);
            await ticks(1);
        });
        test('RemoveMergeFieldPillEvent should hide base palette', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(removeMergeFieldPillEvent);
            await ticks(1);
            expect(getBasePalette(element)).toBeNull();
        });
        test('RemoveMergeFieldPillEvent should show no items to show illustration', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(removeMergeFieldPillEvent);
            await ticks(1);
            expect(getNoItemToShowIllustration(element)).not.toBeNull();
        });
        test('RemoveMergeFieldPillEvent should reset record variable', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(removeMergeFieldPillEvent);
            await ticks(1);
            expect(element.recordVariable).toBe('');
        });
        test('EditMergeFieldPillEvent when pill value is clicked should not show no items to show illustration', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(editMergeFieldPillEvent);
            await ticks(1);
            expect(getNoItemToShowIllustration(element)).toBeNull();
        });
        test('EditMergeFieldPillEvent when pill value is clicked should keep base palette', async () => {
            getSObjectOrSObjectCollectionPicker(element).dispatchEvent(editMergeFieldPillEvent);
            await ticks(1);
            expect(getBasePalette(element)).not.toBeNull();
        });
    });
});
