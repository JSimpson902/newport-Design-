import { createElement } from 'lwc';
import FlowPropertiesEditor from '../flowPropertiesEditor';
import { SaveType } from 'builder_platform_interaction/saveType';
import { LABELS } from '../flowPropertiesEditorLabels';
import normalizeDateTime from 'builder_platform_interaction/dateTimeUtils';
import format from 'builder_platform_interaction/commonUtils';
import { PropertyChangedEvent } from 'builder_platform_interaction/events';
import { MOCK_ALL_FLOW_ENTRIES } from 'mock/flowEntryData';
import { ticks } from 'builder_platform_interaction/builderTestUtils';

jest.mock('builder_platform_interaction/ferovResourcePicker', () =>
    require('builder_platform_interaction_mocks/ferovResourcePicker')
);

jest.mock('builder_platform_interaction/systemLib', () => {
    const actual = require.requireActual('builder_platform_interaction/systemLib');
    return {
        getBuilderType() {
            return 'abc';
        },

        SYSTEM_VARIABLES: actual.SYSTEM_VARIABLES,
        getGlobalConstantOrSystemVariable: actual.getGlobalConstantOrSystemVariable
    };
});

jest.mock('builder_platform_interaction/expressionUtils', () => {
    return {
        getRunInModesMenuData() {
            return [
                {
                    value: 'defaultMode',
                    label: 'defaultMode'
                },
                {
                    value: 'systemModeWithSharing',
                    label: 'systemModeWithSharing'
                },
                {
                    value: 'systemModeWithoutSharing',
                    lable: 'systemModeWithoutSharing'
                }
            ];
        }
    };
});

jest.mock('builder_platform_interaction/serverDataLib', () => {
    const actual = require.requireActual('builder_platform_interaction/serverDataLib');
    const SERVER_ACTION_TYPE = actual.SERVER_ACTION_TYPE;
    return {
        SERVER_ACTION_TYPE,
        fetchOnce: serverActionType => {
            switch (serverActionType) {
                case SERVER_ACTION_TYPE.GET_FLOW_ENTRIES:
                    return Promise.resolve(MOCK_ALL_FLOW_ENTRIES);
                default:
                    return Promise.reject(new Error('Unexpected server action ' + serverActionType));
            }
        }
    };
});

const mockDateTimeString = 'some date time string';
jest.mock('builder_platform_interaction/dateTimeUtils', () => {
    return {
        getFormat: require.requireActual('builder_platform_interaction/dateTimeUtils').getFormat,
        normalizeDateTime: jest.fn()
    };
});

normalizeDateTime.normalizeDateTime = jest.fn(() => {
    return mockDateTimeString;
});

const mockFormattedLabel = 'some user last saved at some date time string';
jest.mock('builder_platform_interaction/commonUtils', () => {
    return {
        format: jest.fn(),
        isUndefinedOrNull: jest.fn(),
        addCurlyBraces: require.requireActual('builder_platform_interaction/commonUtils').addCurlyBraces,
        removeCurlyBraces: jest.fn()
    };
});

jest.mock('builder_platform_interaction/storeUtils', () => {
    return {
        getTriggerType: jest.fn()
    };
});

format.format = jest.fn(() => {
    return mockFormattedLabel;
});

const createComponentUnderTest = node => {
    const el = createElement('builder_platform_interaction-flowPropertiesEditor', { is: FlowPropertiesEditor });
    el.node = node;
    document.body.appendChild(el);
    return el;
};

const SELECTORS = {
    LABEL_DESCRIPTION: 'builder_platform_interaction-label-description',
    FLOW_TYPE: 'lightning-combobox.process-type',
    SAVE_AS_TOGGLE: 'lightning-radio-group',
    SHOW_ADVANCED: '.show-advanced-button',
    HIDE_ADVANCED: '.hide-advanced-button',
    ADVANCED_PROPERTIES: 'div.advanced',
    LAST_PROCESS_TYPE: 'div.lastProcessType',
    LAST_MODIFIED: 'div.lastModified',
    VERSION_NUMBER: 'div.versionNumber',
    RESOURCE_TEXT_AREA: 'builder_platform_interaction-resourced-textarea',
    RICH_TEXT_PLAIN_TEXT_SWITCH: 'builder_platform_interaction-rich-text-plain-text-switch'
};

const getLabelDescription = flowPropertiesEditor => {
    return flowPropertiesEditor.shadowRoot.querySelector(SELECTORS.LABEL_DESCRIPTION);
};

const getProcessType = flowPropertiesEditor => {
    return flowPropertiesEditor.shadowRoot.querySelector(SELECTORS.FLOW_TYPE);
};

const getShowAdvancedButton = flowPropertiesEditor => {
    return flowPropertiesEditor.shadowRoot.querySelector(SELECTORS.SHOW_ADVANCED);
};

const getHideAdvancedButton = flowPropertiesEditor => {
    return flowPropertiesEditor.shadowRoot.querySelector(SELECTORS.HIDE_ADVANCED);
};

const getAdvancedProperties = flowPropertiesEditor => {
    return flowPropertiesEditor.shadowRoot.querySelector(SELECTORS.ADVANCED_PROPERTIES);
};

const getLastModifiedDetails = flowPropertiesEditor => {
    return flowPropertiesEditor.shadowRoot.querySelector(SELECTORS.LAST_MODIFIED);
};

const getResourceTextArea = flowPropertiesEditor => {
    return flowPropertiesEditor.shadowRoot.querySelector(SELECTORS.RESOURCE_TEXT_AREA);
};

const getLastProcessType = flowPropertiesEditor => {
    return flowPropertiesEditor.shadowRoot.querySelector(SELECTORS.LAST_PROCESS_TYPE);
};

const getSaveAsToggle = flowPropertiesEditor => {
    return flowPropertiesEditor.shadowRoot.querySelector(SELECTORS.SAVE_AS_TOGGLE);
};

const getRichTextPlainTextSwitch = rexourdedTextArea =>
    rexourdedTextArea.shadowRoot.querySelector(SELECTORS.RICH_TEXT_PLAIN_TEXT_SWITCH);

const dispatchLabelChangedEvent = (flowPropertiesEditor, newLabelValue, error) => {
    const event = new PropertyChangedEvent('label', newLabelValue, error);
    const labelDescription = getLabelDescription(flowPropertiesEditor);
    labelDescription.dispatchEvent(event);
};

describe('FlowPropertiesEditor', () => {
    let flowProperties;
    let flowPropertiesEditor;
    describe('Save As a New Flow (CREATE)', () => {
        beforeEach(() => {
            flowProperties = {
                label: { value: '', error: null },
                name: { value: '', error: null },
                description: { value: '', error: null },
                processType: { value: 'process type', error: null },
                interviewLabel: { value: '', error: null },
                runInMode: { value: null, error: null },
                saveType: SaveType.CREATE
            };
            flowPropertiesEditor = createComponentUnderTest(flowProperties);
        });
        describe('Label Description', () => {
            it('check default values', () => {
                const labelDescription = getLabelDescription(flowPropertiesEditor);
                expect(labelDescription).toBeDefined();
                expect(labelDescription.label.value).toBe('');
                expect(labelDescription.label.error).toBeNull();
                expect(labelDescription.devName.value).toBe('');
                expect(labelDescription.devName.error).toBeNull();
                expect(labelDescription.description.value).toBe('');
                expect(labelDescription.description.error).toBeNull();
            });
            it('handles the property changed event and updates the property', () => {
                const event = new PropertyChangedEvent('description', 'new desc', null);
                const labelDescription = getLabelDescription(flowPropertiesEditor);
                labelDescription.dispatchEvent(event);
                expect(flowPropertiesEditor.node.description.value).toBe('new desc');
            });
            describe('Updating the flow label', () => {
                it('should update the interview label if it is blank', () => {
                    dispatchLabelChangedEvent(flowPropertiesEditor, 'new label', null);
                    expect(flowPropertiesEditor.node.interviewLabel.value).toBe('new label {!$Flow.CurrentDateTime}');
                });
                it('should not update the interview label if the flow label has an error', () => {
                    dispatchLabelChangedEvent(flowPropertiesEditor, 'new label', 'error');
                    expect(flowPropertiesEditor.node.interviewLabel.value).toBe('');
                });
                it('should not update the interview label if it already has a value', () => {
                    flowProperties.interviewLabel.value = 'old interview label';
                    dispatchLabelChangedEvent(flowPropertiesEditor, 'new label', 'error');
                    expect(flowPropertiesEditor.node.interviewLabel.value).toBe('old interview label');
                });
            });
        });
        describe('Advanced Properties', () => {
            it('HIDE Advanced Properties', () => {
                const showAdvancedButton = getShowAdvancedButton(flowPropertiesEditor);
                expect(showAdvancedButton.label).toBe(LABELS.showAdvanced);
                expect(getHideAdvancedButton(flowPropertiesEditor)).toBeNull();
                expect(getAdvancedProperties(flowPropertiesEditor)).toBeNull();
                expect(getProcessType(flowPropertiesEditor)).toBeNull();
                expect(getResourceTextArea(flowPropertiesEditor)).toBeNull();
            });
            it('SHOW Advanced Properties', async () => {
                const showAdvancedButton = getShowAdvancedButton(flowPropertiesEditor);
                showAdvancedButton.click();
                await ticks(1);
                expect(getShowAdvancedButton(flowPropertiesEditor)).not.toBeNull();
                expect(getAdvancedProperties(flowPropertiesEditor)).not.toBeNull();
                expect(getProcessType(flowPropertiesEditor)).toBeDefined();
                expect(getProcessType(flowPropertiesEditor).value).toBe('process type None');
                const recourcedTextArea = getResourceTextArea(flowPropertiesEditor);
                expect(recourcedTextArea.value.value).toBe('');
                expect(recourcedTextArea.value.error).toBeNull();
                expect(getRichTextPlainTextSwitch(recourcedTextArea)).toBeNull();
            });
            it('Last Modified Information should NOT be shown for saveType CREATE', () => {
                expect(getLastModifiedDetails(flowPropertiesEditor)).toBeNull();
            });
        });
    });
    describe('Save As a New Version (UPDATE)', () => {
        beforeEach(() => {
            flowProperties = {
                label: { value: 'flow label' },
                name: { value: 'flow name' },
                description: { value: 'flow description' },
                processType: { value: 'process type' },
                status: { value: 'Active' },
                interviewLabel: { value: 'interviewLabel' },
                lastModifiedBy: { value: 'some user' },
                lastModifiedDate: { value: '2018-11-12T19:25:22.000+0000' },
                saveType: SaveType.UPDATE,
                runInMode: { value: null, error: null }
            };
            flowPropertiesEditor = createComponentUnderTest(flowProperties);
        });
        describe('Label Description', () => {
            it('check existing values', () => {
                const labelDescription = getLabelDescription(flowPropertiesEditor);
                expect(labelDescription).toBeDefined();
                expect(labelDescription.label.value).toBe(flowProperties.label.value);
                expect(labelDescription.devName.value).toBe(flowProperties.name.value);
                expect(labelDescription.description.value).toBe(flowProperties.description.value);
            });
        });
        describe('Advanced Properties', () => {
            it('SHOW Advanced Properties', async () => {
                expect(getShowAdvancedButton(flowPropertiesEditor)).toBeDefined();
                expect(getHideAdvancedButton(flowPropertiesEditor)).toBeNull();
                expect(getShowAdvancedButton(flowPropertiesEditor).label).toBe(LABELS.showAdvanced);
                getShowAdvancedButton(flowPropertiesEditor).click();
                await ticks(1);
                expect(getAdvancedProperties(flowPropertiesEditor)).not.toBeNull();
                const resourcedTextArea = getResourceTextArea(flowPropertiesEditor);
                expect(resourcedTextArea.value.value).toBe(flowProperties.interviewLabel.value);
                expect(getRichTextPlainTextSwitch(resourcedTextArea)).toBeNull();
            });
            describe('Last Modified Information', () => {
                it('returns the localized label with the correct user name and last modified date/time', async () => {
                    getShowAdvancedButton(flowPropertiesEditor).click();
                    await ticks(1);
                    expect(getLastModifiedDetails(flowPropertiesEditor).textContent).toEqual(mockFormattedLabel);
                });
                it('calls normalizeDateTime with the the last modified datetime', async () => {
                    getShowAdvancedButton(flowPropertiesEditor).click();
                    await ticks(1);
                    expect(normalizeDateTime.normalizeDateTime).toHaveBeenCalledWith(
                        flowPropertiesEditor.node.lastModifiedDate.value,
                        true
                    );
                });
                it('calls format with the label, user and datetime', async () => {
                    getShowAdvancedButton(flowPropertiesEditor).click();
                    await ticks(1);
                    expect(format.format).toHaveBeenCalledWith(
                        LABELS.lastModifiedText,
                        flowPropertiesEditor.node.lastModifiedBy.value,
                        mockDateTimeString
                    );
                });
            });
        });
    });
    describe('Process Type', () => {
        it('is empty if no process type found for the value', async () => {
            flowProperties = {
                label: { value: '', error: null },
                name: { value: '', error: null },
                description: { value: '', error: null },
                processType: { value: 'bad process type' },
                interviewLabel: { value: '', error: null },
                status: { value: 'Active' },
                lastModifiedBy: { value: 'some user' },
                lastModifiedDate: { value: '2018-11-12T19:25:22.000+0000' },
                saveType: SaveType.UPDATE,
                runInMode: { value: null, error: null }
            };
            flowPropertiesEditor = createComponentUnderTest(flowProperties);
            getShowAdvancedButton(flowPropertiesEditor).click();
            await ticks(1);
            expect(getLastProcessType(flowPropertiesEditor).textContent).toEqual('');
        });

        it('displays the label associated with the current process type', async () => {
            flowProperties = {
                label: { value: '', error: null },
                name: { value: '', error: null },
                description: { value: '', error: null },
                processType: { value: 'AutoLaunchedFlow' },
                interviewLabel: { value: '', error: null },
                status: { value: 'Active' },
                lastModifiedBy: { value: 'some user' },
                lastModifiedDate: { value: '2018-11-12T19:25:22.000+0000' },
                saveType: SaveType.UPDATE,
                runInMode: { value: null, error: null }
            };
            flowPropertiesEditor = createComponentUnderTest(flowProperties);
            getShowAdvancedButton(flowPropertiesEditor).click();
            await Promise.resolve();
            expect(getLastProcessType(flowPropertiesEditor).textContent).toEqual('Autolaunched Flow');
        });

        it('displays the label associated with the current process and trigger type', async () => {
            flowProperties = {
                label: { value: '', error: null },
                name: { value: '', error: null },
                description: { value: '', error: null },
                processType: { value: 'AutoLaunchedFlow' },
                triggerType: { value: 'RecordBeforeSave' },
                interviewLabel: { value: '', error: null },
                status: { value: 'Active' },
                lastModifiedBy: { value: 'some user' },
                lastModifiedDate: { value: '2018-11-12T19:25:22.000+0000' },
                saveType: SaveType.UPDATE,
                runInMode: { value: null, error: null }
            };
            flowPropertiesEditor = createComponentUnderTest(flowProperties);
            getShowAdvancedButton(flowPropertiesEditor).click();
            await Promise.resolve();
            expect(getLastProcessType(flowPropertiesEditor).textContent).toEqual('Before Save');
        });

        it('changes process type and trigger type', async () => {});

        describe('versionNumber', () => {
            let defaultNode;
            beforeEach(() => {
                defaultNode = {
                    label: { value: 'flow label' },
                    name: { value: 'flow name' },
                    description: { value: 'flow description' },
                    processType: { value: 'process type' },
                    status: { value: 'Active' },
                    interviewLabel: { value: 'interviewLabel' },
                    lastModifiedBy: { value: 'some user' },
                    lastModifiedDate: { value: '2018-11-12T19:25:22.000+0000' },
                    versionNumber: 1,
                    saveType: SaveType.UPDATE,
                    runInMode: { value: null, error: null }
                };
            });

            it('is shown when save type is UPDATE', async () => {
                const component = createComponentUnderTest(defaultNode);
                getShowAdvancedButton(component).click();
                await ticks(1);
                expect(component.shadowRoot.querySelector(SELECTORS.VERSION_NUMBER)).not.toBeNull();
            });

            it('is shown when save type is NEW_VERSION', async () => {
                defaultNode.saveType = SaveType.NEW_VERSION;
                const component = createComponentUnderTest(defaultNode);
                getShowAdvancedButton(component).click();
                await ticks(1);
                expect(component.shadowRoot.querySelector(SELECTORS.VERSION_NUMBER)).not.toBeNull();
            });
        });

        describe('Toggle between save as types', () => {
            let defaultNode;
            beforeEach(() => {
                defaultNode = {
                    label: { value: 'flow label' },
                    name: { value: 'flow name' },
                    description: { value: 'flow description' },
                    processType: { value: 'process type' },
                    status: { value: 'Active' },
                    interviewLabel: { value: 'interviewLabel' },
                    versionNumber: 1,
                    saveType: SaveType.NEW_DEFINITION,
                    runInMode: { value: null, error: null }
                };
            });

            it('restores the original flow property values when toggling back to New Version', () => {
                flowPropertiesEditor = createComponentUnderTest(defaultNode);
                const event = new PropertyChangedEvent('interviewLabel', 'new label', null);
                const labelDescription = getLabelDescription(flowPropertiesEditor);
                labelDescription.dispatchEvent(event);
                // This first expect is to ensure the test is not a false positive
                expect(flowPropertiesEditor.node.interviewLabel.value).toBe('new label');
                getSaveAsToggle(flowPropertiesEditor).dispatchEvent(
                    new CustomEvent('change', {
                        detail: { value: SaveType.NEW_VERSION }
                    })
                );
                expect(flowPropertiesEditor.node.interviewLabel.value).toBe('interviewLabel');
            });

            it('clears the label, name, description, interview label flow properties when toggling to New Flow', () => {
                defaultNode.saveType = SaveType.NEW_VERSION;
                flowPropertiesEditor = createComponentUnderTest(defaultNode);
                getSaveAsToggle(flowPropertiesEditor).dispatchEvent(
                    new CustomEvent('change', {
                        detail: { value: SaveType.NEW_DEFINITION }
                    })
                );
                expect(flowPropertiesEditor.node.label.value).toBe('');
                expect(flowPropertiesEditor.node.name.value).toBe('');
                expect(flowPropertiesEditor.node.description.value).toBe('');
                expect(flowPropertiesEditor.node.interviewLabel.value).toBe('');
            });
        });
    });
});
