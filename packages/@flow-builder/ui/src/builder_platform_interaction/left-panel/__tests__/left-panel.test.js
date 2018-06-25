import { createElement } from 'engine';
import { EditElementEvent, DeleteElementEvent, DeleteResourceEvent, PaletteItemClickedEvent, PaletteItemChevronClickedEvent } from 'builder_platform_interaction-events';
import LeftPanel from 'builder_platform_interaction-left-panel';

import backButtonAltText from '@label/FlowBuilderResourceDetailsPanel.backButtonAltText';
import { getShadowRoot } from 'lwc-test-utils';

const createComponentUnderTest = () => {
    const el = createElement('builder_platform_interaction-left-panel', {
        is: LeftPanel
    });
    document.body.appendChild(el);
    return el;
};

const selectors = {
    panel: '.slds-panel',
    panelHeader: '.slds-panel__header',
    panelHeaderBackButton: 'lightning-button-icon',
    panelBody: '.slds-panel__body',
    resourceDetailsBody: 'builder_platform_interaction-resource-details',
    tabSetContentsBody: 'builder_platform_interaction-tabset',
    tabItems: 'builder_platform_interaction-tabitem',
    footer: '.panel-footer',
    footerButtons: 'lightning-button',
};

const constants = {
    defaultActiveTabId: 'left-panel-tabitem-elements'
};

describe('left-panel', () => {
    describe('element classes', () => {
        it('when in Flow Resource List view - the panel should match the transition layout classes.', () => {
            const element = createComponentUnderTest();
            return Promise.resolve().then(() => {
                const panel = getShadowRoot(element).querySelector(selectors.panel);
                expect(panel.classList).toContain('slds-is-open');
                expect(panel.classList).not.toContain('show-details');
            });
        });

        it('when in Flow Resource Details view - the panel header should match the transition layout classes.', () => {
            const element = createComponentUnderTest();
            const guid = "guid1";
            const paletteItemClickedEvent = new PaletteItemChevronClickedEvent('VARIABLE', guid);
            getShadowRoot(element).querySelector('builder_platform_interaction-left-panel-resources').dispatchEvent(paletteItemClickedEvent);
            return Promise.resolve().then(() => {
                const panel = getShadowRoot(element).querySelector(selectors.panel);
                expect(panel.classList).toContain('slds-is-open');
                expect(panel.classList).toContain('show-details');
            });
        });
    });

    describe('header section', () => {
        describe('element classes', () => {
            it('when in Flow Resource List view - the panel header should match the layout classes.', () => {
                const element = createComponentUnderTest();
                return Promise.resolve().then(() => {
                    const header = getShadowRoot(element).querySelector(selectors.panelHeader);
                    expect(header.classList).toContain('slds-m-bottom_medium');
                    expect(header.classList).toContain('slds-p-left_medium');
                });
            });

            it('when in Flow Resource Details view - the panel header should match the layout classes.', () => {
                const element = createComponentUnderTest();
                const guid = "guid1";
                const paletteItemClickedEvent = new PaletteItemChevronClickedEvent('VARIABLE', guid);
                getShadowRoot(element).querySelector('builder_platform_interaction-left-panel-resources').dispatchEvent(paletteItemClickedEvent);
                return Promise.resolve().then(() => {
                    const header = getShadowRoot(element).querySelector(selectors.panelHeader);
                    expect(header.classList).toContain('slds-m-bottom_medium');
                    expect(header.classList).not.toContain('slds-p-left_medium');
                });
            });
        });

        it('when in Flow Resource List view - should NOT have Back Button Utility Icon.', () => {
            const element = createComponentUnderTest();
            return Promise.resolve().then(() => {
                const backButton = getShadowRoot(element).querySelector(selectors.panelHeaderBackButton);
                expect(backButton).toBeNull();
            });
        });

        it('when in Flow Resource Details view - should have Back Button Utility Icon.', () => {
            const element = createComponentUnderTest();
            const guid = "guid1";
            const paletteItemClickedEvent = new PaletteItemChevronClickedEvent('VARIABLE', guid);
            getShadowRoot(element).querySelector('builder_platform_interaction-left-panel-resources').dispatchEvent(paletteItemClickedEvent);
            return Promise.resolve().then(() => {
                const backButton = getShadowRoot(element).querySelector(selectors.panelHeaderBackButton);
                expect(backButton.iconName).toBe('utility:back');
                expect(backButton.alternativeText).toBe(backButtonAltText);
            });
        });

        it('when in Flow Resource Details view - should handle back-button click.', () => {
            const element = createComponentUnderTest();
            const guid = "guid1";
            const paletteItemClickedEvent = new PaletteItemChevronClickedEvent('VARIABLE', guid);
            getShadowRoot(element).querySelector('builder_platform_interaction-left-panel-resources').dispatchEvent(paletteItemClickedEvent);
            return Promise.resolve().then(() => {
                const backButton = getShadowRoot(element).querySelector(selectors.panelHeaderBackButton);
                backButton.click();
                return Promise.resolve().then(() => {
                    const button = getShadowRoot(element).querySelector(selectors.panelHeaderBackButton);
                    expect(button).toBeNull();
                });
            });
        });
    });

    describe('body section', () => {
        it('when in Flow Resource List view - should NOT add show-details class.', () => {
            const element = createComponentUnderTest();
            return Promise.resolve().then(() => {
                const leftPanel = getShadowRoot(element).querySelector('.slds-panel');
                expect(leftPanel.classList).not.toContain('show-details');
            });
        });

        it('when in Flow Resource Details view - should add show-details class.', () => {
            const element = createComponentUnderTest();
            const guid = "guid1";
            const paletteItemClickedEvent = new PaletteItemChevronClickedEvent('VARIABLE', guid);
            getShadowRoot(element).querySelector('builder_platform_interaction-left-panel-resources').dispatchEvent(paletteItemClickedEvent);
            return Promise.resolve().then(() => {
                const leftPanel = getShadowRoot(element).querySelector('.slds-panel');
                expect(leftPanel.classList).toContain('show-details');
            });
        });

        it('should set the active id to tab item-elements attributes by default.', () => {
            const element = createComponentUnderTest();
            const tabItemsContent = getShadowRoot(element).querySelectorAll(selectors.tabItems);
            return Promise.resolve().then(() => {
                expect(tabItemsContent[0].activeid).toEqual(constants.defaultActiveTabId);
            });
        });
        describe('resource manager tab', () => {
            it('handle Pallete Item Chevron Click Event ', () => {
                const leftPanelComponent = createComponentUnderTest();
                const eventCallback = jest.fn();
                leftPanelComponent.addEventListener(PaletteItemChevronClickedEvent.EVENT_NAME, eventCallback);
                const type = "VARIABLE";
                const guid = "guid1";
                const name = "guid_1";
                const desc = '';
                const paletteItemChevronClickedEvent = new PaletteItemChevronClickedEvent(type, guid, name, name, desc);
                getShadowRoot(leftPanelComponent).querySelector('builder_platform_interaction-left-panel-resources').dispatchEvent(paletteItemChevronClickedEvent);
                return Promise.resolve().then(() => {
                    expect(eventCallback).toHaveBeenCalled();
                    expect(eventCallback.mock.calls[0][0]).toMatchObject({
                        detail: {
                            elementType: type,
                            elementGUID: guid,
                            label: name,
                            iconName: name,
                            description: ''
                        }
                    });
                });
            });

            it('handle Pallete Item Click Event ', () => {
                const leftPanelComponent = createComponentUnderTest();
                const eventCallback = jest.fn();
                leftPanelComponent.addEventListener(EditElementEvent.EVENT_NAME, eventCallback);
                const type = "VARIABLE";
                const guid = "guid1";
                const paletteItemClickedEvent = new PaletteItemClickedEvent(type, guid);
                getShadowRoot(leftPanelComponent).querySelector('builder_platform_interaction-left-panel-resources').dispatchEvent(paletteItemClickedEvent);
                return Promise.resolve().then(() => {
                    expect(eventCallback).toHaveBeenCalled();
                    expect(eventCallback.mock.calls[0][0]).toMatchObject({
                        detail: {
                            canvasElementGUID: guid
                        }
                    });
                });
            });

            it('handle delete resource action SHOULD fire DeleteElementEvent with outcome selectedElementGUID and selectedElementType', () => {
                const eventCallback = jest.fn();
                const guid = "guid1";
                const element = createComponentUnderTest();
                element.addEventListener(DeleteElementEvent.EVENT_NAME, eventCallback);

                const paletteItemClickedEvent = new PaletteItemChevronClickedEvent('VARIABLE', guid);
                getShadowRoot(element).querySelector('builder_platform_interaction-left-panel-resources').dispatchEvent(paletteItemClickedEvent);

                return Promise.resolve().then(() => {
                    const deleteResourceEvent = new DeleteResourceEvent([guid], 'VARIABLE');
                    getShadowRoot(element).querySelector('builder_platform_interaction-resource-details').dispatchEvent(deleteResourceEvent);
                    return Promise.resolve().then(() => {
                        expect(eventCallback).toHaveBeenCalled();
                        expect(eventCallback.mock.calls[0][0]).toMatchObject({
                            detail: {
                                selectedElementGUID: [guid],
                                selectedElementType: "VARIABLE"
                            }
                        });
                    });
                });
            });
        });
    });
});