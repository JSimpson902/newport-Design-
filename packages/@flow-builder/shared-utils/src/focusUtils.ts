/**
 * Finds the element that currently has focus, even when the element is part of a shadow root or iframe.
 * (copied from node_modules/lwc-components-lightning/src/lightning/focusUtils/focus.js)
 *
 * @returns Element that has focus.
 */
export function getElementWithFocus(): HTMLElement | undefined {
    let currentFocusedElement = document.activeElement as any;
    while (currentFocusedElement) {
        if (currentFocusedElement.shadowRoot) {
            const nextFocusedElement = currentFocusedElement.shadowRoot.activeElement;
            if (nextFocusedElement) {
                currentFocusedElement = nextFocusedElement;
            } else {
                return currentFocusedElement;
            }
        } else if (currentFocusedElement.contentDocument) {
            const nextFocusedElement = currentFocusedElement.contentDocument.activeElement;
            if (nextFocusedElement) {
                currentFocusedElement = nextFocusedElement;
            } else {
                return currentFocusedElement;
            }
        } else {
            return currentFocusedElement;
        }
    }

    return undefined;
}
