// @ts-nocheck
import { createElement } from 'lwc';
import ScreenField from 'builder_platform_interaction/screenField';
import { createTestScreenField, setDocumentBodyChildren, ticks } from 'builder_platform_interaction/builderTestUtils';
import { Store } from 'builder_platform_interaction/storeLib';
import { flowWithAllElementsUIModel } from 'mock/storeData';
import { getCachedExtensionType } from 'builder_platform_interaction_mocks/flowExtensionLib';
import { orgHasComponentPreview } from 'builder_platform_interaction/contextLib';

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

jest.mock('builder_platform_interaction/selectors', () => {
    return {
        readableElementsSelector: jest.fn((data) => Object.values(data.elements))
    };
});

jest.mock('builder_platform_interaction/contextLib', () => ({
    orgHasFlowScreenSections: jest.fn(),
    orgHasComponentPreview: jest.fn().mockImplementation(() => {
        return true;
    }),
    orgHasFlowBuilderDebug: jest.fn().mockImplementation(() => {
        return true;
    })
}));

jest.mock('aura', () => {
    return {
        createComponent: jest.requireActual('aura').createComponent,
        renderComponent: jest.requireActual('aura').renderComponent
    };
});

window.$A = {
    unrender: jest.fn(),
    afterRender: jest.fn()
};

jest.mock('builder_platform_interaction/flowExtensionLib', () =>
    require('builder_platform_interaction_mocks/flowExtensionLib')
);

const SELECTORS = {
    SCREEN_FIELD_CARD: 'builder_platform_interaction-screen-field-card',
    EXTENSION_FIELD: 'builder_platform_interaction-screen-extension-field',
    EXTENSION_FIELD_WRAPPER: 'builder_platform_interaction-screen-extension-field-wrapper'
};

const createComponentUnderTest = (props) => {
    const el = createElement('builder_platform_interaction-screen-field', {
        is: ScreenField
    });
    if (props) {
        Object.assign(el, props);
    }
    setDocumentBodyChildren(el);
    return el;
};

beforeAll(() => {
    Store.setMockState(flowWithAllElementsUIModel);
});
afterAll(() => {
    Store.resetStore();
});

describe('custom Aura field is not previewed', () => {
    let testScreenField;
    beforeEach(() => {
        const field = createTestScreenField('lcfield1', 'Extension', 'c:fakeCmpName1');
        testScreenField = createComponentUnderTest({
            screenfield: field
        });
    });
    it('Extension wrapper is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        expect(extensionFieldWrapper).not.toBeNull();
    });
    it('Dummy placeholder is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const dummyComponentField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.SCREEN_FIELD_CARD);
        expect(dummyComponentField).not.toBeNull();
    });
    it('Extension field is not present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const extensionField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD);
        expect(extensionField).toBeNull();
    });
});

describe('custom LWC field is not previewed', () => {
    let testScreenField;
    beforeEach(() => {
        const field = createTestScreenField('lcfield1', 'Extension', 'c:fakeLwc');
        testScreenField = createComponentUnderTest({
            screenfield: field
        });
    });
    it('Extension wrapper is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        expect(extensionFieldWrapper).not.toBeNull();
    });
    it('Dummy placeholder is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const dummyComponentField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.SCREEN_FIELD_CARD);
        expect(dummyComponentField).not.toBeNull();
    });
    it('Extension field is not present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const extensionField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD);
        expect(extensionField).toBeNull();
    });
});

describe('LWC field is previewed when on allow list', () => {
    let testScreenField;
    beforeEach(() => {
        const field = createTestScreenField('lcfield1', 'Extension', 'flowruntime:address');
        testScreenField = createComponentUnderTest({
            screenfield: field
        });
    });
    it('Extension wrapper field is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        expect(extensionFieldWrapper).not.toBeNull();
    });
    it('Extension field is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const extensionField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD);
        expect(extensionField).not.toBeNull();
    });
    it('Dummy field is not present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        expect(extensionFieldWrapper).not.toBeNull();
        const dummyComponentField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.SCREEN_FIELD_CARD);
        expect(dummyComponentField).toBeNull();
    });
});

describe('Component is not previewed if 1 required input param is missing', () => {
    let testScreenField;
    beforeEach(() => {
        const field = createTestScreenField('lcfield1', 'Extension', 'flowruntime:lookup');
        field.inputParameters = [
            {
                value: 'foo',
                name: { value: 'fieldApiName' },
                valueDataType: 'String'
            },
            {
                value: 'foo',
                name: { value: 'label' },
                valueDataType: 'String'
            }
        ];
        testScreenField = createComponentUnderTest({
            screenfield: field
        });
    });
    it('Screen extension wrapper is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        expect(extensionFieldWrapper).not.toBeNull();
    });
    it('Dummy placeholder is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const dummyComponentField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.SCREEN_FIELD_CARD);
        expect(dummyComponentField).not.toBeNull();
    });
    it('Extension field is not present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const extensionField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD);
        expect(extensionField).toBeNull();
    });
});

describe('Component is previewed if all required input params are literals', () => {
    let testScreenField;
    beforeEach(() => {
        const field = createTestScreenField('lcfield1', 'Extension', 'flowruntime:lookup');
        field.inputParameters = [
            {
                value: 'foo',
                name: { value: 'fieldApiName' },
                valueDataType: 'String'
            },
            {
                value: 'foo',
                name: { value: 'objectApiName' },
                valueDataType: 'String'
            },
            {
                value: 'foo',
                name: { value: 'label' },
                valueDataType: 'String'
            },
            {
                value: 'foo',
                name: { value: 'recordId' },
                valueDataType: 'String'
            }
        ];
        testScreenField = createComponentUnderTest({
            screenfield: field
        });
    });
    it('Wrapper field is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        expect(extensionFieldWrapper).not.toBeNull();
    });
    it('Dummy field is not present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const dummyComponentField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.SCREEN_FIELD_CARD);
        expect(dummyComponentField).toBeNull();
    });
    it('Extension field is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const extensionField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD);
        expect(extensionField).not.toBeNull();
    });
});

describe('Component is not previewed when required param is a reference', () => {
    let testScreenField;
    beforeEach(() => {
        const field = createTestScreenField('lcfield1', 'Extension', 'flowruntime:lookup');
        field.inputParameters = [
            {
                value: 'foo',
                name: { value: 'fieldApiName' },
                valueDataType: 'String'
            },
            {
                value: 'foo',
                name: { value: 'objectApiName' },
                valueDataType: 'String'
            },
            {
                value: '{!foo}',
                name: { value: 'label' },
                valueDataType: 'Reference'
            }
        ];
        testScreenField = createComponentUnderTest({
            screenfield: field
        });
    });
    it('Extension wrapper is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        expect(extensionFieldWrapper).not.toBeNull();
    });
    it('Dummy placeholder is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const dummyComponentField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.SCREEN_FIELD_CARD);
        expect(dummyComponentField).not.toBeNull();
    });
    it('Extension field is not present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const extensionField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD);
        expect(extensionField).toBeNull();
    });
});

describe('Component allowed for preview is not previewed when org perm is disabled', () => {
    let testScreenField;
    const shouldOrgAllowPreview = (allow) => {
        orgHasComponentPreview.mockImplementation(() => {
            return allow;
        });
    };
    beforeEach(() => {
        shouldOrgAllowPreview(false);
        jest.mock('builder_platform_interaction/contextLib', () => {
            return Object.assign({}, require('builder_platform_interaction_mocks/contextLib'), {
                orgHasComponentPreview() {
                    return false;
                }
            });
        });
        const field = createTestScreenField('lcfield1', 'Extension', 'flowruntime:address');
        testScreenField = createComponentUnderTest({
            screenfield: field
        });
    });
    it('Extension wrapper is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        expect(extensionFieldWrapper).not.toBeNull();
    });
    it('Dummy placeholder is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const dummyComponentField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.SCREEN_FIELD_CARD);
        expect(dummyComponentField).not.toBeNull();
    });
    it('Extension field is not present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const extensionField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD);
        expect(extensionField).toBeNull();
    });
});

describe('Component is not previewed if component descriptor is not avaialable', () => {
    let testScreenField;
    const cachedInfo = () => {
        getCachedExtensionType.mockImplementation(() => {
            return '';
        });
    };
    beforeEach(() => {
        cachedInfo();
        const field = createTestScreenField('lcfield1', 'Extension', 'flowruntime:address');
        testScreenField = createComponentUnderTest({
            screenfield: field
        });
    });
    it('Extension wrapper is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        expect(extensionFieldWrapper).not.toBeNull();
    });
    it('Dummy placeholder is present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const dummyComponentField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.SCREEN_FIELD_CARD);
        expect(dummyComponentField).not.toBeNull();
    });
    it('Extension field is not present', async () => {
        await ticks(1);
        const extensionFieldWrapper = testScreenField.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD_WRAPPER);
        const extensionField = extensionFieldWrapper.shadowRoot.querySelector(SELECTORS.EXTENSION_FIELD);
        expect(extensionField).toBeNull();
    });
});
