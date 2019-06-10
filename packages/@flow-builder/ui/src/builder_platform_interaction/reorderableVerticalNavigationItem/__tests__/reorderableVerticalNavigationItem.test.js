import { createElement } from 'lwc';
import ReorderableVerticalNavigationItem from 'builder_platform_interaction/reorderableVerticalNavigationItem';

const SELECTORS = {
    DRAGGABLE: 'builder_platform_interaction-draggable',
    FRONT_ICON: 'div[slot="front-icon"]',
    END_ICON: 'div[slot="end-icon"]',
    LINK: 'a',
    MAIN_DIV: 'div'
};

const createComponentUnderTest = () => {
    const el = createElement('builder_platform_interaction-vertical-nav-item', {
        is: ReorderableVerticalNavigationItem
    });
    document.body.appendChild(el);
    return el;
};

describe('ReorderableVerticalNavigationItem', () => {
    it('does not have front or end icon by default', () => {
        const element = createComponentUnderTest();
        return Promise.resolve().then(() => {
            const frontIcon = element.shadowRoot.querySelectorAll(
                SELECTORS.FRONT_ICON
            );
            const endIcon = element.shadowRoot.querySelectorAll(
                SELECTORS.END_ICON
            );

            expect(frontIcon).toHaveLength(0);
            expect(endIcon).toHaveLength(0);
        });
    });
    it('has correct text', () => {
        const testItemTitle = 'Test Item Title';
        const element = createComponentUnderTest();
        element.label = testItemTitle;
        return Promise.resolve().then(() => {
            const link = element.shadowRoot.querySelectorAll(SELECTORS.LINK);
            expect(link).toHaveLength(1);
            expect(link[0].text).toContain(testItemTitle);
        });
    });
    it('fires itemclicked that includes itemId when an item is clicked', () => {
        const element = createComponentUnderTest();
        const testNavItemId = '1';
        element.navItemId = testNavItemId;
        return Promise.resolve().then(() => {
            const link = element.shadowRoot.querySelector(SELECTORS.LINK);

            const eventCallback = jest.fn();
            element.addEventListener('itemclicked', eventCallback);
            link.click();
            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0].detail).toMatchObject({
                itemId: testNavItemId
            });
        });
    });
    it('calls the dragstart handle from draggable component when dragstart happens', () => {
        const element = createComponentUnderTest();
        element.isDraggable = true;
        return Promise.resolve().then(() => {
            const draggableElement = element.shadowRoot.querySelector(
                SELECTORS.DRAGGABLE
            );
            draggableElement.handleDragStart = jest.fn();

            const anchorElement = element.shadowRoot.querySelector(
                SELECTORS.LINK
            );
            const dragstartEvent = new CustomEvent('dragstart');
            anchorElement.dispatchEvent(dragstartEvent);

            expect(draggableElement.handleDragStart).toHaveBeenCalled();
        });
    });

    describe('isDraggable', () => {
        it('is wrapped in a draggable if isDraggable', () => {
            const element = createComponentUnderTest();
            element.isDraggable = true;

            return Promise.resolve().then(() => {
                const draggables = element.shadowRoot.querySelectorAll(
                    SELECTORS.DRAGGABLE
                );
                expect(draggables).toHaveLength(1);
            });
        });

        it('is not wrapped in a draggable if not isDraggable', () => {
            const element = createComponentUnderTest();
            element.isDraggable = false;

            return Promise.resolve().then(() => {
                const draggables = element.shadowRoot.querySelectorAll(
                    SELECTORS.DRAGGABLE
                );
                expect(draggables).toHaveLength(0);
            });
        });
    });

    describe('class', () => {
        it('has slds-is-active applied to the base div when selected', () => {
            const element = createComponentUnderTest();
            element.navItemId = 'item1';
            element.activeId = 'item1';

            return Promise.resolve().then(() => {
                const listItem = element.shadowRoot.querySelector(
                    SELECTORS.MAIN_DIV
                );
                expect(listItem.getAttribute('class')).toContain(
                    'slds-is-active'
                );
            });
        });
        it('does not have slds-is-active applied to the base div when not selected', () => {
            const element = createComponentUnderTest();
            element.navItemId = 'item1';
            element.activeId = 'item2';

            return Promise.resolve().then(() => {
                const listItem = element.shadowRoot.querySelector(
                    SELECTORS.MAIN_DIV
                );
                expect(listItem.getAttribute('class')).not.toContain(
                    'slds-is-active'
                );
            });
        });
    });
});
