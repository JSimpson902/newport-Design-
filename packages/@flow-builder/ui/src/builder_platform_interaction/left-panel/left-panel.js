import { Element, api, track } from 'engine';
import { EditElementEvent, DeleteElementEvent, NewResourceEvent } from 'builder_platform_interaction-events';
import { resourceSectionsSelector } from 'builder_platform_interaction-selectors';
import { Store } from 'builder_platform_interaction-store-lib';
import { isChildElement } from 'builder_platform_interaction-element-config';

import headerText from '@label/FlowBuilderLeftPanel.headerText';
import elementTabText from '@label/FlowBuilderLeftPanel.elementTabText';
import resourceTabText from '@label/FlowBuilderLeftPanel.resourceTabText';
import backButtonAltText from '@label/FlowBuilderResourceDetailsPanel.backButtonAltText';
import newResourceButtonText from '@label/FlowBuilderLeftPanel.newResourceButtonText';

const LABELS = {
    LEFT_PANEL_HEADER_TEXT: headerText,
    LEFT_PANEL_ELEMENT_TAB_TEXT: elementTabText,
    LEFT_PANEL_RESOURCE_TAB_TEXT: resourceTabText,
    RESOURCE_DETAILS_BACK_BUTTON_ATL_TEXT: backButtonAltText,
    LEFT_PANEL_RESOURCE_TAB_NEUTRAL_BUTTON: newResourceButtonText
};

const ACTIVETABID_DEFAULT = 'left-panel-tabitem-elements';

let storeInstance;
let unsubscribeStore;


export default class LeftPanel extends Element {
    @track activetabid = ACTIVETABID_DEFAULT;

    @track showResourceDetailsPanel = false;

    @track resources = [];

    @track resourceDetails;

    constructor() {
        super();
        storeInstance = Store.getStore();
        unsubscribeStore = storeInstance.subscribe(this.mapAppStateToStore);
    }

    mapAppStateToStore = () => {
        const currentState = storeInstance.getCurrentState();
        this.resources = resourceSectionsSelector(currentState);
    };

    @api
    get activeTabId() {
        return this.activetabid;
    }

    get labels() {
        return LABELS;
    }

    get getPanelTitle() {
        return this.showResourceDetailsPanel ? this.resourceDetails.NAME : LABELS.LEFT_PANEL_HEADER_TEXT;
    }

    get panelClasses() {
        let classes = 'left-panel slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-is-directional slds-is-open';
        if (this.showResourceDetailsPanel) {
            classes = `${classes} show-details`;
        }
        return classes;
    }
    get panelHeaderClasses() {
        let classes = 'left-panel-header slds-panel__header slds-m-bottom_medium';
        if (!this.showResourceDetailsPanel) {
            classes = `${classes} slds-p-left_medium`;
        }
        return classes;
    }

    handleTabChange(event) {
        this.activetabid = event.detail.tabId;
    }

    handleAddNewResourceButtonClick = (event) => {
        event.stopPropagation();
        const handleOnClickEvent = new NewResourceEvent();
        this.dispatchEvent(handleOnClickEvent);
    };

    handleResourceClicked(event) {
        const canvasElementGUID = event.detail.guid;
        const editElementEvent = new EditElementEvent(canvasElementGUID);
        this.dispatchEvent(editElementEvent);
    }

    handlePaletteItemChevronClicked(event) {
        const elementType = storeInstance.getCurrentState().elements[event.detail.elementGUID].elementType;
        this.resourceDetails = {
            TYPE: elementType,
            GUID: storeInstance.getCurrentState().elements[event.detail.elementGUID].guid,
            LABEL: storeInstance.getCurrentState().elements[event.detail.elementGUID].label,
            ICON_NAME: event.detail.iconName,
            DESCRIPTION: storeInstance.getCurrentState().elements[event.detail.elementGUID].description,
            NAME: storeInstance.getCurrentState().elements[event.detail.elementGUID].name,
            IS_CHILD_ELEMENT: isChildElement(elementType)
        };
        this.showResourceDetailsPanel = true;
    }

    handleResourceDetailsBackLinkClicked() {
        this.showResourceDetailsPanel = false;
    }

    handleDeleteButtonClicked() {
        this.showResourceDetailsPanel = false;
        const deleteEvent = new DeleteElementEvent([this.resourceDetails.GUID], this.resourceDetails.TYPE);
        this.dispatchEvent(deleteEvent);
    }

    disconnectedCallback() {
        unsubscribeStore();
    }
}
