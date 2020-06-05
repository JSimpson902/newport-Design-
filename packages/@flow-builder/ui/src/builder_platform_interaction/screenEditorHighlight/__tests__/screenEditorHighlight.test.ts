// @ts-nocheck
import { createElement } from 'lwc';
import ScreenEditorHighlight from 'builder_platform_interaction/screenEditorHighlight';
import { SCREEN_EDITOR_EVENT_NAME } from 'builder_platform_interaction/events';
import {
    DRAGGING_CLASS,
    HOVERING_CLASS,
    HIGHLIGHT_FRAME_PREVENT_EVENTS_CLASS,
    HIGHLIGHT_FRAME_ALLOW_EVENTS_CLASS,
    FRAME_DIV_SELECTOR,
    CONTAINER_DIV_SELECTOR
} from 'builder_platform_interaction/screenEditorUtils';
import {
    createTestScreenField,
    ticks,
    mouseoverEvent,
    mouseoutEvent
} from 'builder_platform_interaction/builderTestUtils';

jest.mock('builder_platform_interaction/screenEditorUtils', () => {
    const actual = jest.requireActual('builder_platform_interaction/screenEditorUtils');
    return Object.assign({}, actual, {
        setDragFieldValue: () => {}
    });
});

function createComponentForTest(props) {
    const el = createElement('builder_platform_interaction-screen-editor-highlight', { is: ScreenEditorHighlight });
    Object.assign(el, props);
    document.body.appendChild(el);
    return el;
}

function clickHighlight(highlight, callback) {
    const hightlightDiv = highlight.shadowRoot.querySelector(CONTAINER_DIV_SELECTOR);
    highlight.addEventListener(SCREEN_EDITOR_EVENT_NAME.SCREEN_ELEMENT_SELECTED, callback);
    hightlightDiv.click();
}

describe('Click highlight', () => {
    let highlight;
    beforeEach(() => {
        highlight = createComponentForTest({
            screenElement: createTestScreenField('Name', 'TextBox')
        });
    });
    it('clicking on highlight component fires correct event', async () => {
        await ticks(1);
        const callback = jest.fn();
        clickHighlight(highlight, callback);
        expect(callback).toHaveBeenCalled();
    });
    it('should not fire an event when already selected', () => {
        highlight.selected = true;
        const callback = jest.fn();
        clickHighlight(highlight, callback);
        expect(callback).not.toHaveBeenCalled();
    });
});

describe('onDragStart', () => {
    let highlight;
    beforeEach(() => {
        highlight = createComponentForTest({
            screenElement: createTestScreenField('Name', 'TextBox')
        });
    });
    it('dragging an element sets correct dataTransfer', async () => {
        await ticks(1);
        const dragStartEvent = new CustomEvent('dragstart');
        dragStartEvent.dataTransfer = {
            data: {},
            setData(type, val) {
                this.data[type] = val;
            },
            getData(type) {
                return this.data[type];
            }
        };
        const hightlightDiv = highlight.shadowRoot.querySelector(CONTAINER_DIV_SELECTOR);
        hightlightDiv.dispatchEvent(dragStartEvent);
        expect(dragStartEvent.dataTransfer.effectAllowed).toBe('move');
        expect(dragStartEvent.dataTransfer.getData('text')).toBe(highlight.screenElement.guid);
        expect(hightlightDiv.classList).toContain(DRAGGING_CLASS);
    });
});

describe('onDragEnd', () => {
    let highlight;
    beforeEach(() => {
        highlight = createComponentForTest({
            screenElement: createTestScreenField('Name', 'TextBox')
        });
    });
    it('The end of dragging an element sets the correct styling', async () => {
        await ticks(1);
        const dragStartEvent = new CustomEvent('dragstart');
        dragStartEvent.dataTransfer = {
            data: {},
            setData(type, val) {
                this.data[type] = val;
            },
            getData(type) {
                return this.data[type];
            }
        };
        const dragEndEvent = new CustomEvent('dragend');

        const hightlightDiv = highlight.shadowRoot.querySelector(CONTAINER_DIV_SELECTOR);
        hightlightDiv.dispatchEvent(dragStartEvent);
        hightlightDiv.dispatchEvent(dragEndEvent);
        expect(hightlightDiv.classList).not.toContain(DRAGGING_CLASS);
    });
});

describe('highlight behavior on hover', () => {
    let highlight;
    beforeEach(() => {
        highlight = createComponentForTest({
            screenElement: createTestScreenField('Name', 'TextBox')
        });
    });

    it('mouse over sets the correct styling', async () => {
        await ticks(1);

        const highlightDiv = highlight.shadowRoot.querySelector(CONTAINER_DIV_SELECTOR);
        expect(highlightDiv.classList).not.toContain(HOVERING_CLASS);

        highlightDiv.dispatchEvent(mouseoverEvent());
        await ticks(1);
        expect(highlightDiv.classList).toContain(HOVERING_CLASS);
    });

    it('mouse out sets the correct styling', async () => {
        await ticks(1);

        const highlightDiv = highlight.shadowRoot.querySelector(CONTAINER_DIV_SELECTOR);

        highlightDiv.dispatchEvent(mouseoverEvent());
        await ticks(1);

        highlightDiv.dispatchEvent(mouseoutEvent());
        await ticks(1);
        expect(highlightDiv.classList).not.toContain(HOVERING_CLASS);
    });
});

describe('setting preventEvents to true', () => {
    let highlight;
    beforeEach(() => {
        highlight = createComponentForTest({
            screenElement: createTestScreenField('Name', 'TextBox'),
            preventEvents: true
        });
    });

    it('results in correct styling', async () => {
        await ticks(1);

        const frameDiv = highlight.shadowRoot.querySelector(FRAME_DIV_SELECTOR);
        expect(frameDiv).toBeDefined();
        expect(frameDiv.classList).toContain(HIGHLIGHT_FRAME_PREVENT_EVENTS_CLASS);
        expect(frameDiv.classList).not.toContain(HIGHLIGHT_FRAME_ALLOW_EVENTS_CLASS);
    });
});

describe('setting preventEvents to false', () => {
    let highlight;
    beforeEach(() => {
        highlight = createComponentForTest({
            screenElement: createTestScreenField('Name', 'TextBox'),
            preventEvents: false
        });
    });

    it('results in correct styling', async () => {
        await ticks(1);

        const frameDiv = highlight.shadowRoot.querySelector(FRAME_DIV_SELECTOR);
        expect(frameDiv).toBeDefined();
        expect(frameDiv.classList).toContain(HIGHLIGHT_FRAME_ALLOW_EVENTS_CLASS);
        expect(frameDiv.classList).not.toContain(HIGHLIGHT_FRAME_PREVENT_EVENTS_CLASS);
    });
});
