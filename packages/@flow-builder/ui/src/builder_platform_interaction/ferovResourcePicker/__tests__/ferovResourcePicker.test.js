import { createElement } from 'lwc';
import { getShadowRoot } from 'lwc-test-utils';
import FerovResourcePicker from "../ferovResourcePicker";
import BaseResourcePicker from 'builder_platform_interaction/baseResourcePicker';
import { ComboboxStateChangedEvent } from "builder_platform_interaction/events";
import { normalizeFEROV, getMenuData } from "builder_platform_interaction/expressionUtils";
import * as mockRuleLib from "builder_platform_interaction/ruleLib";
import { ELEMENT_TYPE } from "builder_platform_interaction/flowMetadata";
import { FLOW_DATA_TYPE } from "../../dataTypeLib/dataTypeLib";
import { Store } from 'builder_platform_interaction/storeLib';

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

const SELECTORS = {
    BASE_RESOURCE_PICKER: 'builder_platform_interaction-base-resource-picker',
};

const setupComponentUnderTest = (props) => {
    const element = createElement('builder_platform_interaction-ferov-resource-picker', {
        is: FerovResourcePicker,
    });
    Object.assign(element, props);
    document.body.appendChild(element);
    return element;
};

const parentItem = {
    objectType: 'Account',
};

jest.mock('builder_platform_interaction/sobjectLib', () => {
    return {
        getFieldsForEntity: jest.fn(),
    };
});

jest.mock('builder_platform_interaction/ruleLib', () => {
    const mockParam = {
        paramType: 'Data',
        dataType: 'Currency',
        collection: false,
    };
    return {
        mockParam,
        RULE_OPERATOR: require.requireActual('builder_platform_interaction/ruleLib').RULE_OPERATOR,
        PARAM_PROPERTY: require.requireActual('builder_platform_interaction/ruleLib').PARAM_PROPERTY,
        getRHSTypes: jest.fn().mockReturnValue(mockParam).mockName('getRHSTypes')
    };
});

jest.mock('builder_platform_interaction/expressionUtils', () => {
    return {
        getMenuData: jest.fn().mockReturnValue(['ferovMenuData']).mockName('getMenuData'),
        normalizeFEROV: jest.fn().mockImplementation((rhsId) => {
            return require.requireActual('builder_platform_interaction/expressionUtils').normalizeFEROV(rhsId);
        }),
    };
});

describe('ferov-resource-picker', () => {
    let props;

    beforeEach(() => {
        props = {
            propertyEditorElementType: ELEMENT_TYPE.VARIABLE,
            elementParam: { elementType: ELEMENT_TYPE.VARIABLE },
            comboboxConfig: { label: 'test label' },
        };
    });

    describe('base resource picker', () => {
        it('exists', () => {
            const ferovResourcePicker = setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                const baseResourcePicker = getShadowRoot(ferovResourcePicker).querySelector(SELECTORS.BASE_RESOURCE_PICKER);
                expect(baseResourcePicker).toBeDefined();
            });
        });

        it('has the combobox config object set', () => {
            props.comboboxConfig = {
                label: 'test label'
            };
            const ferovResourcePicker = setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                const baseResourcePicker = getShadowRoot(ferovResourcePicker).querySelector(SELECTORS.BASE_RESOURCE_PICKER);
                expect(baseResourcePicker.comboboxConfig).toEqual(props.comboboxConfig);
            });
        });

        it('has the value set as a string', () => {
            props.value = 'test display text';
            const ferovResourcePicker = setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                const baseResourcePicker = getShadowRoot(ferovResourcePicker).querySelector(SELECTORS.BASE_RESOURCE_PICKER);
                expect(baseResourcePicker.value).toEqual(props.value);
            });
        });

        it('has the value set as an item', () => {
            props.value = { value: '{!testValue}', displayText: 'test display text'};
            normalizeFEROV.mockImplementationOnce(() => ({itemOrDisplayText: props.value}));
            const ferovResourcePicker = setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                const baseResourcePicker = getShadowRoot(ferovResourcePicker).querySelector(SELECTORS.BASE_RESOURCE_PICKER);
                expect(baseResourcePicker.value).toEqual(props.value);
            });
        });
    });

    it('gets rules through an api property', () => {
        const mockRules = ['foo'];
        props.rules = mockRules;
        const ferovResourcePicker = setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            expect(ferovResourcePicker.rules).toEqual(mockRules);
        });
    });

    it('sets the rules to an empty array when not given an array', () => {
        props.rules = undefined;
        const ferovResourcePicker = setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            expect(ferovResourcePicker.rules).toEqual([]);
        });
    });

    it('retrieves ferov menu data on initial load when value is ferov', () => {
        props.value = 'foo';
        const normalizedValue = {
            itemOrDisplayText: {
                value: props.value,
            }
        };
        normalizeFEROV.mockReturnValueOnce(normalizedValue);
        setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            expect(getMenuData).toHaveBeenCalledWith(undefined, ELEMENT_TYPE.VARIABLE, expect.any(Function),
                true, false, Store.getStore(), true, undefined, undefined, true, false);
        });
    });

    it('retrieves field menu data on initial load when value is sobject field', () => {
        props.value = 'accVar.Name';
        const normalizedValue = {
            itemOrDisplayText: {
                value: props.value,
                parent: parentItem,
            },
            fields: ['mockField'],
        };
        normalizeFEROV.mockReturnValueOnce(normalizedValue);
        setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            expect(getMenuData).toHaveBeenCalledWith(undefined, ELEMENT_TYPE.VARIABLE, expect.any(Function),
                true, false, Store.getStore(), true, parentItem, ["mockField"], true, false);
        });
    });

    it('fetches the fields when requesting field menu data without field data', () => {
        props.value = 'accVar.Name';
        const normalizedValue = {
            itemOrDisplayText: {
                value: props.value,
                parent: parentItem,
            },
            fields: undefined,
        };
        normalizeFEROV.mockReturnValueOnce(normalizedValue);
        setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            expect(getMenuData).toHaveBeenCalledWith(undefined, ELEMENT_TYPE.VARIABLE, expect.any(Function),
                true, false, Store.getStore(), true, parentItem, undefined, true, false);
        });
    });

    it('uses rule service and expression utils to retrieve ferov data', () => {
        const normalizedValue = {
            itemOrDisplayText: {
                value: props.value,
            }
        };
        normalizeFEROV.mockReturnValueOnce(normalizedValue);
        setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            expect(getMenuData).toHaveBeenCalledWith(undefined, ELEMENT_TYPE.VARIABLE, expect.any(Function),
                true, false, Store.getStore(), true, undefined, undefined, true, false);
        });
    });

    describe('populateParamTypes function', () => {
        it('calls getRHSTypes with the right arguments', () => {
            const normalizedValue = {
                itemOrDisplayText: {
                    value: props.value,
                }
            };
            normalizeFEROV.mockReturnValueOnce(normalizedValue);
            const mockRules = ['rule1'];
            props.rules = mockRules;
            setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                const populateParamTypesFn = getMenuData.mock.calls[0][2];
                populateParamTypesFn();
                expect(mockRuleLib.getRHSTypes).toHaveBeenCalledWith(ELEMENT_TYPE.VARIABLE, { elementType: ELEMENT_TYPE.VARIABLE },
                    mockRuleLib.RULE_OPERATOR.ASSIGN, mockRules);
            });
        });
    });

    it('does not set param types with elementConfig set', () => {
        const elementConfigProps = {
            propertyEditorElementType: ELEMENT_TYPE.VARIABLE,
            elementConfig: { elementType: ELEMENT_TYPE.VARIABLE, shouldBeWritable: false }
        };
        const normalizedValue = {
            itemOrDisplayText: {
                value: props.value,
            }
        };
        normalizeFEROV.mockReturnValueOnce(normalizedValue);
        setupComponentUnderTest(elementConfigProps);
        return Promise.resolve().then(() => {
            expect(mockRuleLib.getRHSTypes).not.toHaveBeenCalled();
            expect(getMenuData).toHaveBeenCalledWith(elementConfigProps.elementConfig, ELEMENT_TYPE.VARIABLE, expect.any(Function),
                true, false, Store.getStore(), true, undefined, undefined, true, false);
        });
    });

    it('sends param types to the base picker when enableFieldDrilldown is true', () => {
        const normalizedValue = {
            itemOrDisplayText: {
                value: props.value,
            }
        };
        normalizeFEROV.mockReturnValueOnce(normalizedValue);
        const mockRules = ['rule1'];
        props.rules = mockRules;
        props.comboboxConfig.enableFieldDrilldown = true;
        const ferovPicker = setupComponentUnderTest(props);
        const basePicker = getShadowRoot(ferovPicker).querySelector(BaseResourcePicker.SELECTOR);

        return Promise.resolve().then(() => {
            const populateParamTypesFn = getMenuData.mock.calls[0][2];
            populateParamTypesFn();
            return Promise.resolve().then(() => {
                expect(mockRuleLib.getRHSTypes).toHaveBeenCalled();
                expect(mockRuleLib.getRHSTypes.mock.results[0]).toEqual(expect.any(Object));
                expect(basePicker.allowedParamTypes).toEqual(mockRuleLib.mockParam);
            });
        });
    });

    it('does not send param types to the base picker when enableFieldDrilldown is not set', () => {
        const normalizedValue = {
            itemOrDisplayText: {
                value: props.value,
            }
        };
        normalizeFEROV.mockReturnValueOnce(normalizedValue);
        const mockRules = ['rule1'];
        props.rules = mockRules;
        const ferovPicker = setupComponentUnderTest(props);
        const basePicker = getShadowRoot(ferovPicker).querySelector(BaseResourcePicker.SELECTOR);

        return Promise.resolve().then(() => {
            const populateParamTypesFn = getMenuData.mock.calls[0][2];
            populateParamTypesFn();
            expect(mockRuleLib.getRHSTypes).toHaveBeenCalled();
            expect(mockRuleLib.getRHSTypes.mock.results[0]).toEqual(expect.any(Object));
            expect(basePicker.allowedParamTypes).toEqual(null);
        });
    });

    it('normalizes value when changing element config', () => {
        const ferovResourcePicker = setupComponentUnderTest(props);

        props.elementConfig = { elementType: 'foo' };
        props.value = 'foobar';

        ferovResourcePicker.comboboxConfig = props.elementConfig;
        ferovResourcePicker.value = props.value;
        return Promise.resolve().then(() => {
            expect(normalizeFEROV).toHaveBeenCalledWith(props.value);
        });
    });

    it('normalizes value when changing combobox config', () => {
        const ferovResourcePicker = setupComponentUnderTest(props);

        props.comboboxConfig.type = FLOW_DATA_TYPE.STRING;
        props.value = 'foobar';

        ferovResourcePicker.comboboxConfig = props.comboboxConfig;
        ferovResourcePicker.value = props.value;
        return Promise.resolve().then(() => {
            expect(normalizeFEROV).toHaveBeenCalledWith(props.value);
        });
    });
    describe('event handling', () => {
        const comboboxValue = {
            value: "value",
        };
        const displayText = "displayText";
        it('when combobox changes to valid item, item is stored', () => {
            const ferovResourcePicker = setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                const baseResourcePicker = getShadowRoot(ferovResourcePicker).querySelector(SELECTORS.BASE_RESOURCE_PICKER);
                baseResourcePicker.dispatchEvent(new ComboboxStateChangedEvent(comboboxValue, displayText));
                return Promise.resolve().then(() => {
                    expect(ferovResourcePicker.value).toMatchObject(comboboxValue);
                });
            });
        });
        it('when combobox changes to valid literal, literal is stored', () => {
            const ferovResourcePicker = setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                const baseResourcePicker = getShadowRoot(ferovResourcePicker).querySelector(SELECTORS.BASE_RESOURCE_PICKER);
                baseResourcePicker.dispatchEvent(new ComboboxStateChangedEvent(null, displayText));
                return Promise.resolve().then(() => {
                    expect(ferovResourcePicker.value).toEqual(displayText);
                });
            });
        });
        it('when resource picker is in an invalid state, displayText is stored even if combobox fires an item', () => {
            props.errorMessage = 'error';
            const ferovResourcePicker = setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                const baseResourcePicker = getShadowRoot(ferovResourcePicker).querySelector(SELECTORS.BASE_RESOURCE_PICKER);
                baseResourcePicker.dispatchEvent(new ComboboxStateChangedEvent(comboboxValue, displayText));
                return Promise.resolve().then(() => {
                    expect(ferovResourcePicker.value).toEqual(displayText);
                });
            });
        });
    });
    describe('handles system & global variables', () => {
        beforeEach(() => {
            // if RHS doesn't exist, menu data isn't set
            normalizeFEROV.mockReturnValueOnce({itemOrDisplayText: 'foo'});
        });
        it('defaults hideSystemVariables to false', () => {
            setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                expect(getMenuData).toHaveBeenCalledWith(undefined, ELEMENT_TYPE.VARIABLE, expect.any(Function),
                true, false, Store.getStore(), true, undefined, undefined, true, false);
            });
        });
        it('defaults showGlobalVariables to false', () => {
            setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                expect(getMenuData).toHaveBeenCalledWith(undefined, ELEMENT_TYPE.VARIABLE, expect.any(Function),
                true, false, Store.getStore(), true, undefined, undefined, true, false);
            });
        });
        it('passes along showSystemVariables setting', () => {
            props.hideSystemVariables = true;
            setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                expect(getMenuData).toHaveBeenCalledWith(undefined, ELEMENT_TYPE.VARIABLE, expect.any(Function),
                true, false, Store.getStore(), true, undefined, undefined, false, false);
            });
        });
        it('passes along showGlobalVariables setting', () => {
            props.showGlobalVariables = true;
            setupComponentUnderTest(props);
            return Promise.resolve().then(() => {
                expect(getMenuData).toHaveBeenCalledWith(undefined, ELEMENT_TYPE.VARIABLE, expect.any(Function),
                true, false, Store.getStore(), true, undefined, undefined, true, true);
            });
        });
    });
});