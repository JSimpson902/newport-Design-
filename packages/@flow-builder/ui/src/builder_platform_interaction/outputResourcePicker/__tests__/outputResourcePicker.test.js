import { createElement } from 'lwc';
import OutputResourcePicker from '../outputResourcePicker';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import {
    getMenuData,
    getMenuItemForField,
    normalizeFEROV
} from 'builder_platform_interaction/expressionUtils';
import { Store } from 'builder_platform_interaction/storeLib';
import {
    updateInlineResourceProperties,
    removeLastCreatedInlineResource
} from 'builder_platform_interaction/actions';

import {
    getRHSTypes,
    RULE_OPERATOR
} from 'builder_platform_interaction/ruleLib';
import { ComboboxStateChangedEvent } from 'builder_platform_interaction/events';
import BaseResourcePicker from 'builder_platform_interaction/baseResourcePicker';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';

jest.mock('builder_platform_interaction/storeLib', () =>
    require('builder_platform_interaction_mocks/storeLib')
);

jest.mock('builder_platform_interaction/inlineResourceUtils', () => {
    return {
        getInlineResource: jest.fn(() => 'test resource')
    };
});

jest.mock('builder_platform_interaction/loggingUtils', () => ({
    logInteraction: jest.fn()
}));

jest.mock('builder_platform_interaction/actions', () => {
    return {
        removeLastCreatedInlineResource: jest.fn(),
        updateInlineResourceProperties: jest.fn(() => 'test response')
    };
});

const setupComponentUnderTest = props => {
    const element = createElement(
        'builder_platform_interaction-output-resource-picker',
        {
            is: OutputResourcePicker
        }
    );
    Object.assign(element, props);
    document.body.appendChild(element);
    return element;
};

const expectedElementConfig = {
    elementType: ELEMENT_TYPE.VARIABLE,
    shouldBeWritable: true
};

const parentRecordVar = {
    dataType: FLOW_DATA_TYPE.SOBJECT.value,
    subtype: 'Account'
};

jest.mock('builder_platform_interaction/ruleLib', () => {
    const actual = require.requireActual('../../ruleLib/ruleLib.js');
    return {
        RULE_OPERATOR: actual.RULE_OPERATOR,
        PARAM_PROPERTY: actual.PARAM_PROPERTY,
        getOutputRules: jest
            .fn()
            .mockReturnValue(['rule1'])
            .mockName('getOutputRules'),
        getRHSTypes: jest
            .fn()
            .mockReturnValue({
                paramType: 'Data',
                dataType: 'Currency',
                collection: false
            })
            .mockName('getRHSTypes'),
        elementToParam: jest.fn()
    };
});

jest.mock('builder_platform_interaction/expressionUtils', () => {
    return {
        normalizeFEROV: jest.fn().mockImplementation(identifier => ({
            itemOrDisplayText: identifier
        })),
        getMenuData: jest
            .fn()
            .mockReturnValue(Promise.resolve(['ferovMenuData']))
            .mockName('getMenuData'),
        getResourceByUniqueIdentifier: jest.fn(),
        mutateFlowResourceToComboboxShape: jest.fn(),
        getMenuItemForField: jest.fn()
    };
});

jest.mock('builder_platform_interaction/apexTypeLib', () => {
    return {
        getPropertiesForClass: jest.fn().mockName('getPropertiesForClass')
    };
});

describe('output-resource-picker', () => {
    let props;
    beforeEach(() => {
        props = {
            propertyEditorElementType: ELEMENT_TYPE.VARIABLE,
            elementParam: { elementType: ELEMENT_TYPE.VARIABLE },
            comboboxConfig: { label: 'test label' },
            showNewResource: true
        };
    });

    describe('base resource picker', () => {
        it('exists', () => {
            const outputResourcePicker = setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                const baseResourcePicker = outputResourcePicker.shadowRoot.querySelector(
                    BaseResourcePicker.SELECTOR
                );
                expect(baseResourcePicker).toBeDefined();
            });
        });

        it('has the combobox config object set', () => {
            props.comboboxConfig = {
                label: 'test label',
                literalsAllowed: false,
                placeholder: 'FlowBuilderCombobox.outputPlaceholder'
            };
            const outputResourcePicker = setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                const baseResourcePicker = outputResourcePicker.shadowRoot.querySelector(
                    BaseResourcePicker.SELECTOR
                );
                expect(baseResourcePicker.comboboxConfig).toEqual(
                    props.comboboxConfig
                );
            });
        });
        it('has the value set', () => {
            props.value = 'testValue';
            const outputResourcePicker = setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                const baseResourcePicker = outputResourcePicker.shadowRoot.querySelector(
                    BaseResourcePicker.SELECTOR
                );
                expect(baseResourcePicker.value).toEqual(props.value);
            });
        });
    });

    describe('combobox state changed event handler', () => {
        let outputResourcePicker;
        const displayText = 'hello world';

        beforeEach(() => {
            outputResourcePicker = setupComponentUnderTest(props);
        });
        it('updates the value to the item if there is both item and display text', () => {
            const baseResourcePicker = outputResourcePicker.shadowRoot.querySelector(
                BaseResourcePicker.SELECTOR
            );
            const itemPayload = { value: 'foo' };
            baseResourcePicker.dispatchEvent(
                new ComboboxStateChangedEvent(itemPayload, displayText)
            );
            return Promise.resolve().then(() => {
                expect(baseResourcePicker.value).toEqual(itemPayload);
            });
        });
        it('updates the value to the item if there is no display text', () => {
            const baseResourcePicker = outputResourcePicker.shadowRoot.querySelector(
                BaseResourcePicker.SELECTOR
            );
            const itemPayload = { value: 'foo' };
            baseResourcePicker.dispatchEvent(
                new ComboboxStateChangedEvent(itemPayload)
            );
            return Promise.resolve().then(() => {
                expect(baseResourcePicker.value).toEqual(itemPayload);
            });
        });
        it('updates the value to the display text if there is no item', () => {
            const baseResourcePicker = outputResourcePicker.shadowRoot.querySelector(
                BaseResourcePicker.SELECTOR
            );
            baseResourcePicker.dispatchEvent(
                new ComboboxStateChangedEvent(undefined, displayText)
            );
            return Promise.resolve().then(() => {
                expect(baseResourcePicker.value).toEqual(displayText);
            });
        });
    });

    it('retrieves fer menu data on initial load when value is fer', () => {
        props.value = 'foo';
        setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            expect(getMenuData).toHaveBeenCalledWith(
                expectedElementConfig,
                ELEMENT_TYPE.VARIABLE,
                expect.any(Function),
                Store.getStore(),
                undefined,
                undefined,
                {
                    allowSobjectForFields: false,
                    enableFieldDrilldown: false,
                    includeNewResource: true,
                    allowSObjectFieldsTraversal: false
                }
            );
        });
    });

    it('fetches the fields when requesting field menu data without field data', () => {
        props.value = {
            value: 'accVar.Name',
            parent: parentRecordVar
        };
        normalizeFEROV.mockReturnValueOnce({
            itemOrDisplayText: { parent: parentRecordVar }
        });
        getMenuItemForField.mockReturnValueOnce(props.value);
        setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            expect(getMenuData).toHaveBeenCalledWith(
                expectedElementConfig,
                ELEMENT_TYPE.VARIABLE,
                expect.any(Function),
                Store.getStore(),
                parentRecordVar,
                undefined,
                {
                    allowSobjectForFields: false,
                    enableFieldDrilldown: false,
                    includeNewResource: true,
                    allowSObjectFieldsTraversal: false
                }
            );
        });
    });

    it('passes in enableFieldDrilldown to populateMenudata', () => {
        const enableFieldDrilldown = (props.comboboxConfig.enableFieldDrilldown = true);
        setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            expect(getMenuData).toHaveBeenCalledWith(
                expectedElementConfig,
                ELEMENT_TYPE.VARIABLE,
                expect.any(Function),
                Store.getStore(),
                undefined,
                undefined,
                {
                    allowSobjectForFields: false,
                    enableFieldDrilldown,
                    includeNewResource: true,
                    allowSObjectFieldsTraversal: false
                }
            );
        });
    });

    it('uses rule service and expression utils to retrieve fer data', () => {
        setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            expect(getMenuData).toHaveBeenCalledWith(
                expectedElementConfig,
                ELEMENT_TYPE.VARIABLE,
                expect.any(Function),
                Store.getStore(),
                undefined,
                undefined,
                {
                    allowSobjectForFields: false,
                    enableFieldDrilldown: false,
                    includeNewResource: true,
                    allowSObjectFieldsTraversal: false
                }
            );
        });
    });

    describe('populateParamTypes function', () => {
        it('calls getRHSTypes with the right arguments', () => {
            setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                const populateParamTypesFn = getMenuData.mock.calls[0][2];
                populateParamTypesFn();
                expect(getRHSTypes).toHaveBeenCalledWith(
                    ELEMENT_TYPE.VARIABLE,
                    { elementType: ELEMENT_TYPE.VARIABLE },
                    RULE_OPERATOR.ASSIGN,
                    ['rule1']
                );
            });
        });
    });

    describe('normalize', () => {
        it('normalizes value when changing value', () => {
            const outputResourcePicker = setupComponentUnderTest(props);
            const newValue = 'foobar';
            outputResourcePicker.value = newValue;
            return Promise.resolve().then(() => {
                expect(normalizeFEROV).toHaveBeenCalledWith(newValue);
            });
        });

        it('normalizes value when changing combobox config', () => {
            const outputResourcePicker = setupComponentUnderTest(props);

            props.comboboxConfig.type = FLOW_DATA_TYPE.STRING;
            normalizeFEROV.mockClear();
            outputResourcePicker.comboboxConfig = props.comboboxConfig;
            return Promise.resolve().then(() => {
                expect(normalizeFEROV).toHaveBeenCalledWith(props.value);
            });
        });

        describe('inline resource ', () => {
            function fetchMenuData() {
                return new CustomEvent('fetchmenudata', {
                    detail: {
                        item: {
                            value: '6f346269-409c-422e-9e8c-3898d164298m'
                        }
                    }
                });
            }
            function handleAddInlineResource() {
                return new CustomEvent('addnewresource', {
                    detail: {
                        position: 'left'
                    }
                });
            }
            it('dispatches removeLastCreatedInlineResource when there is an inline resource and fetchMenuData is triggered', () => {
                const idx = 'kl214fea-9c9a-45cf-b804-76fc6df47crr';
                props.rowIndex = idx;
                const spy = Store.getStore().dispatch;
                Store.setMockState({
                    properties: {
                        lastInlineResourceRowIndex: idx,
                        lastInlineResourceGuid:
                            '6f346269-409c-422e-9e8c-3898d164298q'
                    }
                });
                const cmp = setupComponentUnderTest(props);
                const picker = cmp.shadowRoot.querySelector(
                    'builder_platform_interaction-base-resource-picker'
                );
                picker.dispatchEvent(fetchMenuData());

                return Promise.resolve().then(() => {
                    expect(spy).toHaveBeenCalledWith(
                        removeLastCreatedInlineResource
                    );
                });
            });
            it('calls getMenuData when an inline resource is set and fetchMenuData is triggered', () => {
                const idx = 'kl214fea-9c9a-45cf-b804-76fc6df47fff';
                props.rowIndex = idx;
                const menuDataSpy = getMenuData;
                Store.setMockState({
                    properties: {
                        lastInlineResourceRowIndex: idx,
                        lastInlineResourceGuid:
                            '6f346269-409c-422e-9e8c-3898d164298m'
                    }
                });
                const cmp = setupComponentUnderTest(props);
                const picker = cmp.shadowRoot.querySelector(
                    'builder_platform_interaction-base-resource-picker'
                );
                picker.dispatchEvent(fetchMenuData());
                return Promise.resolve().then(() => {
                    expect(menuDataSpy).toHaveBeenCalled();
                });
            });
            it('dispatches response from updateInlineResourceProperties when dispatching addnewresource', () => {
                const updateInlineResourceSpy = updateInlineResourceProperties;
                const spy = Store.getStore().dispatch;

                const cmp = setupComponentUnderTest(props);
                const picker = cmp.shadowRoot.querySelector(
                    'builder_platform_interaction-base-resource-picker'
                );

                picker.dispatchEvent(handleAddInlineResource());
                return Promise.resolve().then(() => {
                    expect(spy).toHaveBeenCalledWith('test response');
                    expect(updateInlineResourceSpy).toHaveBeenCalled();
                });
            });
        });
    });
});
