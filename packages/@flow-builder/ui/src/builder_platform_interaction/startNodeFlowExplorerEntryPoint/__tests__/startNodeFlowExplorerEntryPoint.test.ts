// @ts-nocheck
import { setDocumentBodyChildren } from 'builder_platform_interaction/builderTestUtils';
import { ArrowKeyDownEvent } from 'builder_platform_interaction/events';
import { commands, keyboardInteractionUtils } from 'builder_platform_interaction/sharedUtils';
import StartNodeFlowExplorerEntryPoint from 'builder_platform_interaction/startNodeFlowExplorerEntryPoint';
import { createElement } from 'lwc';
import { startElement as recordTriggeredStartElement } from 'mock/storeDataRecordTriggered';

const { ArrowDown, ArrowUp, EnterCommand, SpaceCommand } = commands;
const { Keys } = keyboardInteractionUtils;

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

jest.mock('builder_platform_interaction/sharedUtils', () => require('builder_platform_interaction_mocks/sharedUtils'));
const selectors = {
    entryPointLabel: '.label',
    button: '.button'
};

const runQuerySelector = (context, selector) => {
    return context.shadowRoot.querySelector(selector);
};

const setupComponentUnderTest = (node) => {
    const element = createElement('builder_platform_interaction-start-node-flow-explorer-entry-point', {
        is: StartNodeFlowExplorerEntryPoint
    });
    element.node = node;

    setDocumentBodyChildren(element);
    return element;
};

describe('Flow Explorer Entry Point', () => {
    let startElement;
    beforeAll(() => {
        startElement = setupComponentUnderTest(recordTriggeredStartElement);
    });
    it('Should fire ArrowKeyDownEvent with the right key on pressing arrow down key', () => {
        const callback = jest.fn();
        startElement.addEventListener(ArrowKeyDownEvent.EVENT_NAME, callback);
        startElement.keyboardInteractions.execute(ArrowDown.COMMAND_NAME);
        expect(callback).toHaveBeenCalled();
        expect(callback.mock.calls[0][0].detail.key).toBe(Keys.ArrowDown);
    });

    it('Should fire ArrowKeyDownEvent with the right key on pressing arrow up key', () => {
        const callback = jest.fn();
        startElement.addEventListener(ArrowKeyDownEvent.EVENT_NAME, callback);
        startElement.keyboardInteractions.execute(ArrowUp.COMMAND_NAME);
        expect(callback).toHaveBeenCalled();
        expect(callback.mock.calls[0][0].detail.key).toBe(Keys.ArrowUp);
    });

    it('Checks if an window open is called when using the enter command on Flow Explorer Entry Point', () => {
        return Promise.resolve().then(() => {
            window.open = jest.fn();
            runQuerySelector(startElement, selectors.button).focus();
            startElement.keyboardInteractions.execute(EnterCommand.COMMAND_NAME);
            expect(window.open).toHaveBeenCalled();
        });
    });

    it('Checks if an window open is called when using the space command on Flow Explorer Entry Point', () => {
        return Promise.resolve().then(() => {
            window.open = jest.fn();
            runQuerySelector(startElement, selectors.button).focus();
            startElement.keyboardInteractions.execute(SpaceCommand.COMMAND_NAME);
            expect(window.open).toHaveBeenCalled();
        });
    });

    it('Checks if an window open is called when click on Flow Explorer Entry Point', () => {
        return Promise.resolve().then(() => {
            window.open = jest.fn();
            runQuerySelector(startElement, selectors.button).click();
            expect(window.open).toHaveBeenCalled();
        });
    });

    it('Check if the entryPointLabel contains the sObject api name', () => {
        expect(runQuerySelector(startElement, selectors.entryPointLabel).textContent).toBe(
            'FlowBuilderCanvasElement.startNodeExplorerWithObjectLabel(Account)'
        );
    });
});

describe('Flow Explorer without object set', () => {
    let startElement;
    beforeAll(() => {
        startElement = setupComponentUnderTest({});
    });

    it('Check if the entryPointLabel contains the sObject api name', () => {
        expect(runQuerySelector(startElement, selectors.entryPointLabel).textContent).toBe(
            'FlowBuilderCanvasElement.startNodeExplorerWithoutObjectLabel'
        );
    });
});
