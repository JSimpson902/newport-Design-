// @ts-nocheck
import { createElement } from 'lwc';
import { PaletteItemClickedEvent } from 'builder_platform_interaction/events';
import PaletteItem from 'builder_platform_interaction/paletteItem';
import { ticks } from 'builder_platform_interaction/builderTestUtils';

const ELEMENT_TYPE = 'myElementType';
const GUID = 'myGuid';
const LABEL = 'myLabel';
const ICON_SIZE = 'myIconSize';

const createComponentUnderTest = (iconName, dragImageSrc) => {
    const el = createElement('builder_platform_interaction-palette-item', {
        is: PaletteItem
    });
    el.dragImageSrc = dragImageSrc;
    el.elementType = ELEMENT_TYPE;
    el.guid = GUID;
    el.iconName = iconName;
    el.label = LABEL;
    el.iconSize = ICON_SIZE;
    document.body.appendChild(el);
    return el;
};

const selectors = {
    elementIcon: 'builder_platform_interaction-element-icon',
    link: 'a'
};

describe('PaletteItem', () => {
    describe('details button', () => {
        it('checks that there is no details button when detailsButton is false', async () => {
            const paletteItem = createComponentUnderTest();
            await ticks(1);
            const rightChevron = paletteItem.shadowRoot.querySelector(selectors.lightningButtonIcon);
            expect(rightChevron).toBeNull();
        });
    });

    describe('link', () => {
        it('clicks the link to dispatch a PaletteItemClickedEvent with the elementType and guid', async () => {
            const paletteItem = createComponentUnderTest();
            await ticks(1);
            const eventCallback = jest.fn();
            paletteItem.addEventListener(PaletteItemClickedEvent.EVENT_NAME, eventCallback);
            const link = paletteItem.shadowRoot.querySelector(selectors.link);
            link.click();

            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0]).toMatchObject({
                detail: {
                    elementType: ELEMENT_TYPE,
                    guid: GUID
                }
            });
        });
    });

    describe('elementIcon', () => {
        it('does not render elementIcon when the iconName is undefined', async () => {
            const paletteItem = createComponentUnderTest(undefined);
            await ticks(1);
            const elementIcon = paletteItem.shadowRoot.querySelector(selectors.elementIcon);
            expect(elementIcon).toBeNull();
        });

        it('does not render elementIcon when the iconName is null', async () => {
            const paletteItem = createComponentUnderTest(null);
            await ticks(1);
            const elementIcon = paletteItem.shadowRoot.querySelector(selectors.elementIcon);
            expect(elementIcon).toBeNull();
        });

        it('does not render elementIcon when the iconName is empty', async () => {
            const paletteItem = createComponentUnderTest('');
            await ticks(1);
            const elementIcon = paletteItem.shadowRoot.querySelector(selectors.elementIcon);
            expect(elementIcon).toBeNull();
        });

        it('renders elementIcon when the iconName is non-empty', async () => {
            const paletteItem = createComponentUnderTest('iconName');
            await ticks(1);
            const elementIcon = paletteItem.shadowRoot.querySelector(selectors.elementIcon);
            expect(elementIcon).not.toBeNull();
        });
    });

    describe('dragImage', () => {
        it('returns undefined when dragImageSrc is undefined', async () => {
            const paletteItem = createComponentUnderTest(undefined, undefined);
            await ticks(1);
            expect(paletteItem.dragImage).toBeUndefined();
        });

        it('returns undefined when dragImageSrc is null', async () => {
            const paletteItem = createComponentUnderTest(undefined, null);
            await ticks(1);
            expect(paletteItem.dragImage).toBeUndefined();
        });

        it('returns undefined when dragImageSrc is empty', async () => {
            const paletteItem = createComponentUnderTest(undefined, '');
            await ticks(1);
            expect(paletteItem.dragImage).toBeUndefined();
        });

        it('returns an img element when dragImageSrc is non-empty', async () => {
            const dragImageSrc = '/flow/icons/large/assignment.png';
            const expected = expect.stringMatching(new RegExp(dragImageSrc + '$'));
            const paletteItem = createComponentUnderTest(undefined, dragImageSrc);
            await ticks(1);
            const dragImage = paletteItem.dragImage;
            expect(dragImage).not.toBeUndefined();
            expect(dragImage.tagName).toEqual('IMG');
            expect(dragImage.src).toEqual(expected);
        });
    });
});
