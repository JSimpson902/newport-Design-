import { createElement } from 'lwc';
import ResourceEditor  from "../resourceEditor";
import { shouldNotBeNullOrUndefined } from "builder_platform_interaction/validationRules";

jest.mock('builder_platform_interaction/resourceEditorContainer', () => require('builder_platform_interaction_mocks/resourceEditorContainer'));

const setupComponentUnderTest = () => {
    const element = createElement('builder_platform_interaction-resource-editor', {
        is: ResourceEditor,
    });
    document.body.appendChild(element);
    return element;
};

jest.mock('builder_platform_interaction/expressionUtils', () => {
    return {
        getResourceTypesMenuData: jest.fn().mockReturnValue(['mockResource']),
    };
});

jest.mock('builder_platform_interaction/validationRules', () => {
    return {
        shouldNotBeNullOrUndefined: jest.fn(),
    };
});

const selectors = {
    CONTAINER: 'builder_platform_interaction-resource-editor-container',
    COMBOBOX: 'lightning-combobox',
};

const mockReturnValue = 'mockReturnValue';
const mockResource = 'mockResource';

describe('resource-editor', () => {
    const fireChangeEvent = (component, value) => {
        const changeEvent = new CustomEvent('change', {
            detail: {
                value,
            }
        });
        component.dispatchEvent(changeEvent);
    };

    it('has an inner resource-editor-container component that takes in the selected resource type', () => {
        const resourceEditor = setupComponentUnderTest();
        const combobox = resourceEditor.shadowRoot.querySelector(selectors.COMBOBOX);
        fireChangeEvent(combobox, mockResource);
        return Promise.resolve().then(() => {
            const container = resourceEditor.shadowRoot.querySelector(selectors.CONTAINER);
            expect(container).toBeDefined();
            expect(container.selectedResource).toEqual(mockResource);
        });
    });

    it('has an lightning combobox that takes in the list of resource types', () => {
        const resourceEditor = setupComponentUnderTest();
        const combobox = resourceEditor.shadowRoot.querySelector(selectors.COMBOBOX);
        expect(combobox.options).toEqual(expect.any(Array));
        expect(combobox.options).toContain(mockResource);
    });

    it('has a required resource types picker', () => {
        const resourceEditor = setupComponentUnderTest();
        const combobox = resourceEditor.shadowRoot.querySelector(selectors.COMBOBOX);
        expect(combobox.required).toBeTruthy();
    });

    it('calls the inner container validate method on validate', () => {
        const resourceEditor = setupComponentUnderTest();
        const combobox = resourceEditor.shadowRoot.querySelector('lightning-combobox');
        fireChangeEvent(combobox, mockResource);
        return Promise.resolve().then(() => {
            const container = resourceEditor.shadowRoot.querySelector(selectors.CONTAINER);
            container.validate.mockReturnValueOnce(mockReturnValue);
            const val = resourceEditor.validate();
            expect(container.validate).toHaveBeenCalledTimes(1);
            expect(val).toEqual(mockReturnValue);
        });
    });

    it('calls the inner container getNode method on getNode', () => {
        const resourceEditor = setupComponentUnderTest();
        const container = resourceEditor.shadowRoot.querySelector(selectors.CONTAINER);
        container.getNode.mockReturnValueOnce(mockReturnValue);
        const value = resourceEditor.getNode();
        expect(container.getNode).toHaveBeenCalledTimes(1);
        expect(value).toEqual(mockReturnValue);
    });

    describe('Validation', () => {
        it('returns an error when there is no selected resource', () => {
            const resourceEditor = setupComponentUnderTest();
            const mockError = 'mockError';
            shouldNotBeNullOrUndefined.mockReturnValueOnce(mockError);
            const errors = resourceEditor.validate();
            expect(errors).toHaveLength(1);
            expect(errors).toContain(mockError);
            expect(shouldNotBeNullOrUndefined).toHaveBeenCalledWith(null);
        });

        it('returns no error when resource is selected', () => {
            const resourceEditor = setupComponentUnderTest();
            const combobox = resourceEditor.shadowRoot.querySelector('lightning-combobox');
            fireChangeEvent(combobox, mockResource);
            return Promise.resolve().then(() => {
                // we should get undefined because the inner container holding the editor is empty
                const errors = resourceEditor.validate();
                expect(errors).not.toBeDefined();
            });
        });
    });
});