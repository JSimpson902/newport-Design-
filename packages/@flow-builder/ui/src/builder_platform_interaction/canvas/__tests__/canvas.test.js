import { createElement } from 'lwc';
import Canvas from 'builder_platform_interaction/canvas';
import { KEYS } from '../keyConstants';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { DeleteElementEvent } from 'builder_platform_interaction/events';

jest.mock('builder_platform_interaction/drawingLib', () =>
    require('builder_platform_interaction_mocks/drawingLib')
);

const SELECTORS = {
    CANVAS_DIV: '.canvas',
    OVERLAY: '.overlay',
    INNER_CANVAS_DIV: '.inner-canvas',
    NODE: 'builder_platform_interaction-node'
};

describe('Canvas', () => {
    const defaultNodes = [
        {
            elementType: ELEMENT_TYPE.ASSIGNMENT,
            config: {
                isSelected: false,
                isHighlighted: false
            },
            guid: 'node1'
        },
        {
            elementType: ELEMENT_TYPE.ASSIGNMENT,
            config: {
                isSelected: true,
                isHighlighted: false
            },
            guid: 'node2'
        },
        {
            elementType: ELEMENT_TYPE.ASSIGNMENT,
            config: {
                isSelected: false,
                isHighlighted: false
            },
            guid: 'node3'
        }
    ];
    const defaultConnectors = [
        {
            config: {
                isSelected: false,
                isHighlighted: false
            },
            guid: 'connector1',
            source: 'node1',
            target: 'node2'
        },
        {
            config: {
                isSelected: true,
                isHighlighted: false
            },
            guid: 'connector2',
            source: 'node2',
            target: 'node3'
        }
    ];

    const createComponentForTest = (nodes, connectors) => {
        const el = createElement('builder_platform_interaction-canvas', {
            is: Canvas
        });

        el.nodes = nodes;
        el.connectors = connectors;

        document.body.appendChild(el);

        return el;
    };

    describe('handleKeyDown', () => {
        describe('BACKSPACE KEY', () => {
            it('DeleteElementEvent is fired on backspace', () => {
                const canvas = createComponentForTest(
                    defaultNodes,
                    defaultConnectors
                );

                const eventCallback = jest.fn();
                canvas.addEventListener(
                    DeleteElementEvent.EVENT_NAME,
                    eventCallback
                );

                const backspaceEvent = new KeyboardEvent('keydown', {
                    key: KEYS.BACKSPACE
                });

                const canvasDiv = canvas.shadowRoot.querySelector(
                    SELECTORS.CANVAS_DIV
                );
                canvasDiv.dispatchEvent(backspaceEvent);

                expect(eventCallback).toHaveBeenCalled();
            });

            it('DeleteElementEvent is fired on backspace with empty detail', () => {
                const canvas = createComponentForTest(
                    defaultNodes,
                    defaultConnectors
                );

                const eventCallback = jest.fn();
                canvas.addEventListener(
                    DeleteElementEvent.EVENT_NAME,
                    eventCallback
                );

                const backspaceEvent = new KeyboardEvent('keydown', {
                    key: KEYS.BACKSPACE
                });

                const canvasDiv = canvas.shadowRoot.querySelector(
                    SELECTORS.CANVAS_DIV
                );
                canvasDiv.dispatchEvent(backspaceEvent);

                expect(eventCallback.mock.calls[0][0].detail).toEqual({});
            });
        });

        describe('DELETE KEY', () => {
            it('DeleteElementEvent is fired on delete', () => {
                const canvas = createComponentForTest(
                    defaultNodes,
                    defaultConnectors
                );

                const eventCallback = jest.fn();
                canvas.addEventListener(
                    DeleteElementEvent.EVENT_NAME,
                    eventCallback
                );

                const backspaceEvent = new KeyboardEvent('keydown', {
                    key: KEYS.DELETE
                });

                const canvasDiv = canvas.shadowRoot.querySelector(
                    SELECTORS.CANVAS_DIV
                );
                canvasDiv.dispatchEvent(backspaceEvent);

                expect(eventCallback).toHaveBeenCalled();
            });

            it('DeleteElementEvent is fired on delete with empty detail', () => {
                const canvas = createComponentForTest(
                    defaultNodes,
                    defaultConnectors
                );

                const eventCallback = jest.fn();
                canvas.addEventListener(
                    DeleteElementEvent.EVENT_NAME,
                    eventCallback
                );

                const backspaceEvent = new KeyboardEvent('keydown', {
                    key: KEYS.DELETE
                });

                const canvasDiv = canvas.shadowRoot.querySelector(
                    SELECTORS.CANVAS_DIV
                );
                canvasDiv.dispatchEvent(backspaceEvent);

                expect(eventCallback.mock.calls[0][0].detail).toEqual({});
            });
        });

        describe('META KEY', () => {
            it('Canvas zooms out when meta key is pressed down along with "-" key', () => {
                const canvas = createComponentForTest(
                    defaultNodes,
                    defaultConnectors
                );
                const canvasDiv = canvas.shadowRoot.querySelector(
                    SELECTORS.CANVAS_DIV
                );
                const innerCanvasDiv = canvas.shadowRoot.querySelector(
                    SELECTORS.INNER_CANVAS_DIV
                );

                const negativeKeyEvent = new KeyboardEvent('keydown', {
                    metaKey: true,
                    key: KEYS.NEGATIVE
                });

                canvasDiv.dispatchEvent(negativeKeyEvent);
                expect(innerCanvasDiv.style.transform).toEqual('scale(0.8)');
            });
        });
    });
});
