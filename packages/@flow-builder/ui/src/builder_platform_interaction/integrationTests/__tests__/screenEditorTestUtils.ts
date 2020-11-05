import { createElement } from 'lwc';
import ScreenEditor from 'builder_platform_interaction/screenEditor';
import {
    LIGHTNING_COMPONENTS_SELECTORS,
    INTERACTION_COMPONENTS_SELECTORS,
    deepQuerySelector
} from 'builder_platform_interaction/builderTestUtils';

const SELECTORS = {
    ...LIGHTNING_COMPONENTS_SELECTORS,
    ...INTERACTION_COMPONENTS_SELECTORS
};

export const createComponentUnderTest = (props) => {
    const el = createElement('builder_platform_interaction-screen-editor', {
        is: ScreenEditor
    });
    if (props) {
        Object.assign(el, props);
    }
    document.body.appendChild(el);
    return el;
};

export const getCanvasElement = (screenEditor) => {
    return deepQuerySelector(screenEditor, [SELECTORS.SCREEN_EDITOR_CANVAS, SELECTORS.SCREEN_CANVAS]);
};

export const getCanvasScreenFieldElement = (screenEditor, elementTitle) => {
    const screenEditorCanvas = getCanvasElement(screenEditor);
    const screenEditorHighlight = screenEditorCanvas.shadowRoot.querySelectorAll(SELECTORS.SCREEN_EDITOR_HIGHLIGHT);
    let elementAddress;
    screenEditorHighlight.forEach((element) => {
        if (element.title === elementTitle) {
            elementAddress = element;
        }
    });
    return elementAddress.shadowRoot.querySelector('div');
};

export const getScreenPropertiesEditorContainerElement = (screenEditor) => {
    return screenEditor.shadowRoot.querySelector(SELECTORS.SCREEN_PROPERTIES_EDITOR_CONTAINER);
};

export const getExtensionPropertiesEditorElement = (screenEditor) => {
    return getScreenPropertiesEditorContainerElement(screenEditor).shadowRoot.querySelector(
        SELECTORS.SCREEN_EXTENSION_PROPERTIES_EDITOR
    );
};
