// @ts-nocheck
import { createElement } from 'lwc';
import ScreenEditor from 'builder_platform_interaction/screenEditor';
import { getElementForPropertyEditor } from 'builder_platform_interaction/propertyEditorFactory';
import * as flowWithAllElements from 'mock/flows/flowWithAllElements.json';
import { getElementByDevName } from 'builder_platform_interaction/storeUtils';
import { createScreenElementSelectedEvent } from 'builder_platform_interaction/events';

import {
    ticks,
    LIGHTNING_COMPONENTS_SELECTORS,
    INTERACTION_COMPONENTS_SELECTORS,
    deepQuerySelector,
    blurEvent
} from 'builder_platform_interaction/builderTestUtils';
import { FLOW_PROCESS_TYPE } from 'builder_platform_interaction/flowMetadata';
import { setupState, resetState, loadFlow } from '../../integrationTestUtils';

const SELECTORS = {
    ...LIGHTNING_COMPONENTS_SELECTORS,
    ...INTERACTION_COMPONENTS_SELECTORS,
    SCREEN_FIELD: 'builder_platform_interaction-screen-field',
    SCREEN_SECTION_FIELD: 'builder_platform_interaction-screen-section-field'
};

const SCREEN_FIELD_TITLES = {
    SECTION: 'FlowBuilderScreenEditor.fieldTypeLabelSection',
    TEXT: 'FlowBuilderScreenEditor.fieldTypeLabelTextField',
    NUMBER: 'FlowBuilderScreenEditor.fieldTypeLabelNumber',
    EMAIL: 'Email'
};

const createComponentUnderTest = (props) => {
    const el = createElement('builder_platform_interaction-screen-editor', {
        is: ScreenEditor
    });
    if (props) {
        Object.assign(el, props);
    }
    document.body.appendChild(el);
    return el;
};

const getScreenPropertiesEditorContainerElement = (screenEditor) => {
    return screenEditor.shadowRoot.querySelector(SELECTORS.SCREEN_PROPERTIES_EDITOR_CONTAINER);
};

const getExtensionPropertiesEditorElement = (screenEditor) => {
    return getScreenPropertiesEditorContainerElement(screenEditor).shadowRoot.querySelector(
        SELECTORS.SCREEN_EXTENSION_PROPERTIES_EDITOR
    );
};

const getInputFieldPropertiesEditorElement = (screenEditor) => {
    return getScreenPropertiesEditorContainerElement(screenEditor).shadowRoot.querySelector(
        SELECTORS.SCREEN_INPUT_FIELD_PROPERTIES_EDITOR
    );
};

const getSectionFieldPropertiesEditorElement = (screenEditor) => {
    return getScreenPropertiesEditorContainerElement(screenEditor).shadowRoot.querySelector(
        SELECTORS.SCREEN_SECTION_FIELD_PROPERTIES_EDITOR
    );
};

const getScreenEditorCanvas = (screenEditor) => {
    return deepQuerySelector(screenEditor, [SELECTORS.SCREEN_EDITOR_CANVAS, SELECTORS.SCREEN_CANVAS]);
};

const getFieldElementInScreenEditorCanvas = (screenEditor, elementTitle) => {
    const screenEditorCanvas = getScreenEditorCanvas(screenEditor);
    const screenEditorHighlights = screenEditorCanvas.shadowRoot.querySelectorAll(SELECTORS.SCREEN_EDITOR_HIGHLIGHT);
    let element;
    screenEditorHighlights.forEach((screenEditorHighlight) => {
        if (screenEditorHighlight.title === elementTitle) {
            element = screenEditorHighlight;
        }
    });
    return element.shadowRoot.querySelector('div');
};

const getSectionElementInScreenEditorCanvas = (screenEditor, sectionTitle) => {
    const screenEditorCanvas = getScreenEditorCanvas(screenEditor);
    let result = screenEditorCanvas;
    const screenEditorHighlights = result.shadowRoot.querySelectorAll(SELECTORS.SCREEN_EDITOR_HIGHLIGHT);
    result = null;
    for (const element of screenEditorHighlights) {
        if (element.title === SCREEN_FIELD_TITLES.SECTION) {
            const section = element
                .querySelector(SELECTORS.SCREEN_FIELD)
                .shadowRoot.querySelector(SELECTORS.SCREEN_SECTION_FIELD);

            if (section.title === sectionTitle) {
                result = section;
            }
        }
    }
    return result;
};

const getScreenFieldElementInColumn = (column, elementTitle) => {
    const screenEditorHighlights = column.shadowRoot.querySelectorAll(SELECTORS.SCREEN_EDITOR_HIGHLIGHT);
    let result = null;
    for (const element of screenEditorHighlights) {
        if (element.title === elementTitle) {
            result = element;
        }
    }
    if (result === null) {
        return result;
    }

    return result;
};

const getScreenFieldElementInSection = (section, elementTitle) => {
    const columns = section.shadowRoot.querySelectorAll(SELECTORS.SCREEN_CANVAS);
    let result = null;
    for (const column of columns) {
        result = getScreenFieldElementInColumn(column, elementTitle);
        if (result) {
            return result;
        }
    }

    return result;
};

const getApiNameElementInPropertiesEditor = (propertiesEditor) => {
    return deepQuerySelector(propertiesEditor, [SELECTORS.SCREEN_PROPERTY_FIELD_EDITOR, 'lightning-input']);
};

describe('ScreenEditor', () => {
    let screenNode, store;
    let screenEditor;
    describe('Existing Screen containing screen fields, including two sections, each in turn containing nested screen fields', () => {
        beforeAll(async () => {
            store = setupState();
            await loadFlow(flowWithAllElements, store);
        });
        afterAll(() => {
            resetState();
        });
        beforeEach(async () => {
            /*
                Layout of ScreenWithSection
                - Section1
                    - Column1
                        - Slider
                - Number
                - Section2
                    - Column1
                        - Text
                    - Column2
                        - Email
                - Address
            */
            const element = getElementByDevName('ScreenWithSection');
            screenNode = getElementForPropertyEditor(element);
            screenEditor = createComponentUnderTest({
                node: screenNode,
                processType: FLOW_PROCESS_TYPE.FLOW
            });
            await ticks(50);
        });
        it('Select the Address screen field and verify the extension properties editor', async () => {
            expect.assertions(2);
            const addressElement = getFieldElementInScreenEditorCanvas(screenEditor, 'Address');
            expect(addressElement).not.toBeNull();
            addressElement.click();
            await ticks(50);
            const extensionPropertiesEditor = getExtensionPropertiesEditorElement(screenEditor);
            expect(extensionPropertiesEditor).not.toBeNull();
        });
        it('Select the first Section and verify the section properties editor', async () => {
            expect.assertions(2);
            const section = getSectionElementInScreenEditorCanvas(screenEditor, 'ScreenWithSection_Section1');
            expect(section).not.toBeNull();
            section.click();
            await ticks(50);
            const sectionPropertiesEditor = getSectionFieldPropertiesEditorElement(screenEditor);
            expect(sectionPropertiesEditor).not.toBeNull();
        });
        it('Select the Slider screen field in the first section and verify the extension properties editor', async () => {
            expect.assertions(2);
            const section = getSectionElementInScreenEditorCanvas(screenEditor, 'ScreenWithSection_Section1');
            const slider = getScreenFieldElementInSection(section, 'Slider');
            expect(slider).not.toBeNull();
            const canvas = getScreenEditorCanvas(screenEditor);
            canvas.dispatchEvent(createScreenElementSelectedEvent(slider.screenElement));
            await ticks(50);
            const extensionPropertiesEditor = getExtensionPropertiesEditorElement(screenEditor);
            expect(extensionPropertiesEditor).not.toBeNull();
        });
        it('Change the name of the Slider, switch to a different screen field, then switch back and verify we still have the updated name', async () => {
            expect.assertions(3);
            const canvas = getScreenEditorCanvas(screenEditor);
            const section = getSectionElementInScreenEditorCanvas(screenEditor, 'ScreenWithSection_Section1');

            // Select slider component in canvas and verify the API name of the slider on the extension properties editor
            const slider = getScreenFieldElementInSection(section, 'Slider');
            canvas.dispatchEvent(createScreenElementSelectedEvent(slider.screenElement));
            await ticks(50);
            let extensionPropertiesEditor = getExtensionPropertiesEditorElement(screenEditor);
            let apiNameField = getApiNameElementInPropertiesEditor(extensionPropertiesEditor);
            expect(apiNameField.value).toEqual('slider_1');

            // Change the API name of the slider
            apiNameField.value = 'slider_2';
            apiNameField.dispatchEvent(blurEvent);

            // Select the address component on the canvas and verify API name
            const address = getFieldElementInScreenEditorCanvas(screenEditor, 'Address');
            address.click();
            await ticks(50);
            extensionPropertiesEditor = getExtensionPropertiesEditorElement(screenEditor);
            apiNameField = getApiNameElementInPropertiesEditor(extensionPropertiesEditor);
            expect(apiNameField.value).toEqual('address_2');

            // Select the slider again and verify it has the updated API name
            canvas.dispatchEvent(createScreenElementSelectedEvent(slider.screenElement));
            await ticks(50);
            extensionPropertiesEditor = getExtensionPropertiesEditorElement(screenEditor);
            apiNameField = getApiNameElementInPropertiesEditor(extensionPropertiesEditor);
            expect(apiNameField.value).toEqual('slider_2');
        });
        it('Select the Text screen field in the first Column in the second Section and verify the input properties editor', async () => {
            expect.assertions(2);
            const section = getSectionElementInScreenEditorCanvas(screenEditor, 'ScreenWithSection_Section2');
            const text = getScreenFieldElementInSection(section, SCREEN_FIELD_TITLES.TEXT);
            expect(text).not.toBeNull();
            const canvas = getScreenEditorCanvas(screenEditor);
            canvas.dispatchEvent(createScreenElementSelectedEvent(text.screenElement));
            await ticks(50);
            const inputFieldPropertiesEditor = getInputFieldPropertiesEditorElement(screenEditor);
            expect(inputFieldPropertiesEditor).not.toBeNull();
        });
        it('Select the Email screen field in the second Column in the second Section and verify the extension properties editor', async () => {
            expect.assertions(2);
            const section = getSectionElementInScreenEditorCanvas(screenEditor, 'ScreenWithSection_Section2');
            const email = getScreenFieldElementInSection(section, SCREEN_FIELD_TITLES.EMAIL);
            expect(email).not.toBeNull();
            const canvas = getScreenEditorCanvas(screenEditor);
            canvas.dispatchEvent(createScreenElementSelectedEvent(email.screenElement));
            await ticks(50);
            const extensionPropertiesEditor = getExtensionPropertiesEditorElement(screenEditor);
            expect(extensionPropertiesEditor).not.toBeNull();
        });
        it('Add a Column to the second Section and verify the canvas is updated accordingly', async () => {
            expect.assertions(2);
            const section = getSectionElementInScreenEditorCanvas(screenEditor, 'ScreenWithSection_Section2');
            section.click();
            await ticks(50);
            let columns = section.shadowRoot.querySelectorAll(SELECTORS.SCREEN_CANVAS);
            expect(columns).toHaveLength(2);
            const sectionPropertiesEditor = getSectionFieldPropertiesEditorElement(screenEditor);
            const addButton = deepQuerySelector(sectionPropertiesEditor, [SELECTORS.LIST, 'lightning-button']);
            addButton.click();
            await ticks(50);
            columns = section.shadowRoot.querySelectorAll(SELECTORS.SCREEN_CANVAS);
            expect(columns).toHaveLength(3);
        });
    });
});
