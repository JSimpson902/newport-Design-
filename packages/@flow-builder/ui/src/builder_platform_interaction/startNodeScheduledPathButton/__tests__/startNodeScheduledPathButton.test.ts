// @ts-nocheck
import { createElement } from 'lwc';
import StartNodeScheduledPathButton from '../startNodeScheduledPathButton';
import { FLOW_TRIGGER_TYPE } from 'builder_platform_interaction/flowMetadata';
import { EditElementEvent, ArrowKeyDownEvent } from 'builder_platform_interaction/events';
import { startElementWithAccountAndNoCondition } from 'mock/storeDataScheduleTriggered';
import { startElement } from 'mock/storeDataRecordTriggered';
import { EDIT_START_SCHEDULED_PATHS } from 'builder_platform_interaction/elementConfig';
import { setDocumentBodyChildren, ticks } from 'builder_platform_interaction/builderTestUtils';
import { commands } from 'builder_platform_interaction/sharedUtils';

const { ArrowDown, ArrowUp, EnterCommand, SpaceCommand } = commands;

jest.mock('builder_platform_interaction/sharedUtils', () => {
    const sharedUtils = jest.requireActual('builder_platform_interaction_mocks/sharedUtils');
    const sharedCommands = jest.requireActual('builder_platform_interaction/sharedUtils/commands');
    const sharedLwcUtils = jest.requireActual('builder_platform_interaction/sharedUtils/lwcUtils');
    const keyboardInteractionUtils = jest.requireActual(
        'builder_platform_interaction/sharedUtils/keyboardInteractionUtils'
    );
    const mockKeyboardInteractionUtils = jest.requireActual(
        'builder_platform_interaction_mocks/sharedUtils/keyboardInteractionUtils'
    );

    return Object.assign({}, sharedUtils, {
        commands: sharedCommands,
        lwcUtils: sharedLwcUtils,
        keyboardInteractionUtils: Object.assign({}, keyboardInteractionUtils, mockKeyboardInteractionUtils)
    });
});
jest.mock(
    '@salesforce/label/FlowBuilderCanvasElement.startElementAddScheduledPathsLabel',
    () => ({ default: 'Add Scheduled Paths (Optional)' }),
    {
        virtual: true
    }
);

jest.mock(
    '@salesforce/label/FlowBuilderCanvasElement.startElementScheduledPaths',
    () => ({ default: 'Scheduled Paths: ' }),
    {
        virtual: true
    }
);

const setupComponentUnderTest = (startElementObject, flowTriggerType) => {
    const element = createElement('builder_platform_interaction-start-node-scheduled-path-button', {
        is: StartNodeScheduledPathButton
    });
    if (startElementObject) {
        element.node = startElementObject;
    } else if (flowTriggerType) {
        element.node = { triggerType: flowTriggerType };
    }

    setDocumentBodyChildren(element);
    return element;
};

const selectors = {
    startScheduledPath: '.start-scheduled-path',
    scheduledPathButtonText: '.start-scheduled-path span'
};

const runQuerySelector = (context, selector) => {
    return context.shadowRoot.querySelector(selector);
};

describe('Focus Management', () => {
    it('Should fire ArrowKeyDownEvent with the right key on pressing arrow down key', () => {
        const startNodeScheduledPathButtonEditor = setupComponentUnderTest(null, FLOW_TRIGGER_TYPE.BEFORE_SAVE);
        const callback = jest.fn();
        startNodeScheduledPathButtonEditor.addEventListener(ArrowKeyDownEvent.EVENT_NAME, callback);
        startNodeScheduledPathButtonEditor.keyboardInteractions.execute(ArrowDown.COMMAND_NAME);
        expect(callback).toHaveBeenCalled();
        expect(callback.mock.calls[0][0].detail.key).toBe(ArrowDown.COMMAND_NAME);
    });

    it('Should fire ArrowKeyDownEvent with the right key on pressing arrow up key', () => {
        const startNodeScheduledPathButtonEditor = setupComponentUnderTest(null, FLOW_TRIGGER_TYPE.BEFORE_SAVE);
        const callback = jest.fn();
        startNodeScheduledPathButtonEditor.addEventListener(ArrowKeyDownEvent.EVENT_NAME, callback);
        startNodeScheduledPathButtonEditor.keyboardInteractions.execute(ArrowUp.COMMAND_NAME);
        expect(callback).toHaveBeenCalled();
        expect(callback.mock.calls[0][0].detail.key).toBe(ArrowUp.COMMAND_NAME);
    });
});

describe('When flow trigger Type is RECORD_CHANGED', () => {
    let startNodeScheduledPathButtonEditor;
    describe(' AFTER_SAVE', () => {
        describe(' non configured scheduled path for AFTER_SAVE', () => {
            beforeEach(() => {
                startNodeScheduledPathButtonEditor = setupComponentUnderTest(null, FLOW_TRIGGER_TYPE.AFTER_SAVE);
            });
            it('Checks if non configured scheduled path button rendered text correctly', () => {
                expect.assertions(1);
                expect(
                    runQuerySelector(startNodeScheduledPathButtonEditor, selectors.scheduledPathButtonText).textContent
                ).toBe('Add Scheduled Paths (Optional)');
            });
        });
        describe(' configured scheduled path for AFTER_SAVE', () => {
            beforeEach(() => {
                startNodeScheduledPathButtonEditor = setupComponentUnderTest(
                    startElement,
                    FLOW_TRIGGER_TYPE.AFTER_SAVE
                );
            });
            describe(' with 2 childReferences', () => {
                it('Checks if configured scheduled path button rendered text correctly', () => {
                    expect.assertions(1);
                    expect(
                        runQuerySelector(startNodeScheduledPathButtonEditor, selectors.scheduledPathButtonText)
                            .textContent
                    ).toBe('Scheduled Paths: 3');
                });
            });
        });
    });

    it('Checks if an EditElementEvent is dispatched with editStartScheduledPaths mode when Set Scheduled Path button is clicked', async () => {
        expect.assertions(2);
        startNodeScheduledPathButtonEditor = setupComponentUnderTest(startElementWithAccountAndNoCondition);
        const callback = jest.fn();
        startNodeScheduledPathButtonEditor.addEventListener(EditElementEvent.EVENT_NAME, callback);
        startNodeScheduledPathButtonEditor.shadowRoot.querySelector(selectors.startScheduledPath).click();
        await ticks(1);
        expect(callback).toHaveBeenCalled();
        expect(callback.mock.calls[0][0]).toMatchObject({
            detail: {
                canvasElementGUID: startNodeScheduledPathButtonEditor.node.guid,
                mode: EDIT_START_SCHEDULED_PATHS
            }
        });
    });

    it('Checks if an EditElementEvent is dispatched with editStartScheduledPaths mode when the enter command is used', async () => {
        expect.assertions(2);
        startNodeScheduledPathButtonEditor = setupComponentUnderTest(startElementWithAccountAndNoCondition);
        const callback = jest.fn();
        startNodeScheduledPathButtonEditor.addEventListener(EditElementEvent.EVENT_NAME, callback);
        startNodeScheduledPathButtonEditor.shadowRoot.querySelector(selectors.startScheduledPath).focus();
        startNodeScheduledPathButtonEditor.keyboardInteractions.execute(EnterCommand.COMMAND_NAME);
        await ticks(1);
        expect(callback).toHaveBeenCalled();
        expect(callback.mock.calls[0][0]).toMatchObject({
            detail: {
                canvasElementGUID: startNodeScheduledPathButtonEditor.node.guid,
                mode: EDIT_START_SCHEDULED_PATHS
            }
        });
    });

    it('Checks if an EditElementEvent is dispatched with editStartScheduledPaths mode when the space command is used', async () => {
        expect.assertions(2);
        startNodeScheduledPathButtonEditor = setupComponentUnderTest(startElementWithAccountAndNoCondition);
        const callback = jest.fn();
        startNodeScheduledPathButtonEditor.addEventListener(EditElementEvent.EVENT_NAME, callback);
        startNodeScheduledPathButtonEditor.shadowRoot.querySelector(selectors.startScheduledPath).focus();
        startNodeScheduledPathButtonEditor.keyboardInteractions.execute(SpaceCommand.COMMAND_NAME);
        await ticks(1);
        expect(callback).toHaveBeenCalled();
        expect(callback.mock.calls[0][0]).toMatchObject({
            detail: {
                canvasElementGUID: startNodeScheduledPathButtonEditor.node.guid,
                mode: EDIT_START_SCHEDULED_PATHS
            }
        });
    });
});
