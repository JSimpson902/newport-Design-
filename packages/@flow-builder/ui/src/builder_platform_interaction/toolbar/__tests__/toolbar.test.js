import { createElement } from 'engine';
import { RunFlowEvent, DebugFlowEvent } from 'builder_platform_interaction-events';
import Toolbar from 'builder_platform_interaction-toolbar';
import { getShadowRoot } from 'lwc-test-utils';

const createComponentUnderTest = () => {
    const el = createElement('builder_platform_interaction-toolbar', {
        is: Toolbar
    });
    document.body.appendChild(el);
    return el;
};

const selectors = {
    root: '.toolbar',
    run: '.test-toolbar-run',
    debug: '.test-toolbar-debug',
    save: '.test-toolbar-save'
};

describe('toolbar', () => {
    it('fires run event when run button is clicked', () => {
        const toolbarComponent = createComponentUnderTest();

        return Promise.resolve().then(() => {
            const eventCallback = jest.fn();
            toolbarComponent.addEventListener(RunFlowEvent.EVENT_NAME, eventCallback);
            toolbarComponent.querySelector(selectors.run).click();
            expect(eventCallback).toHaveBeenCalled();
        });
    });

    it('fires debug event when debug button is clicked', () => {
        const toolbarComponent = createComponentUnderTest();

        return Promise.resolve().then(() => {
            const eventCallback = jest.fn();
            toolbarComponent.addEventListener(DebugFlowEvent.EVENT_NAME, eventCallback);
            toolbarComponent.querySelector(selectors.debug).click();
            expect(eventCallback).toHaveBeenCalled();
        });
    });

    it('fires save event when save button is clicked', () => {
        const toolbarComponent = createComponentUnderTest();

        return Promise.resolve().then(() => {
            const eventCallback = jest.fn();
            toolbarComponent.addEventListener('save', eventCallback);
            getShadowRoot(toolbarComponent).querySelector(selectors.save).click();
            expect(eventCallback).toHaveBeenCalled();
        });
    });
});
