import { LightningElement, api } from 'lwc';

import { getStyleFromGeometry } from 'builder_platform_interaction/flowUtils';
import { ReorderConnectorsEvent } from 'builder_platform_interaction/events';

/**
 * Auto layout Canvas Connector Component.
 */
export default class FlcConnector extends LightningElement {
    @api
    connectorInfo;

    @api
    isSelectionMode;

    // Variable to track if the connector has been rendered yet once or not
    _isRendered = false;

    /**
     * Checks if add element button should be visible or not
     */
    get showAddElementButton() {
        return this.connectorInfo.addInfo && !this.isSelectionMode;
    }

    /**
     * Gets the location for the add element button
     */
    get buttonMenuStyle() {
        return getStyleFromGeometry(this.connectorInfo.addInfo.geometry);
    }

    /**
     * Add the inverse variant to the button when the contextual menu is open
     */
    get addIconVariant() {
        const { addInfo } = this.connectorInfo;
        return addInfo && addInfo.menuOpened ? 'inverse' : '';
    }

    /**
     * Gets the info needed to render the connector svg
     */
    get svgInfo() {
        const { svgInfo } = this.connectorInfo;

        const { path, geometry } = svgInfo;
        return {
            width: geometry.w,
            height: geometry.h,
            style: getStyleFromGeometry(geometry),
            path
        };
    }

    hasConditions() {
        return this.connectorInfo.conditionOptions;
    }

    isDefaultBranchConnector() {
        return this.hasConditions() && this.connectorInfo.conditionValue == null;
    }

    get isLabelPickerDisabled() {
        return this.hasOneOption || this.isSelectionMode;
    }

    get hasOneOption() {
        return this.hasConditions() && this.connectorInfo.conditionOptions.length === 1;
    }

    get isConnectorDefaultOrFault() {
        return this.isDefaultBranchConnector() || this.connectorInfo.isFault;
    }

    get connectorBadgeClass() {
        let classes = 'connector-badge slds-align_absolute-center slds-badge';

        if (this.isDefaultBranchConnector()) {
            classes = `default-badge ${classes}`;
        } else {
            classes = `fault-badge ${classes}`;
        }

        return classes;
    }

    get connectorBadgeLabel() {
        return this.isDefaultBranchConnector() ? 'Default' : 'Fault';
    }

    /**
     * Gets the class for the svg
     */
    get svgClassName() {
        return this.connectorInfo.isFault ? 'fault' : '';
    }

    get connectorLabelStyle() {
        return getStyleFromGeometry(this.connectorInfo.branchLabelGeometry);
    }

    /**
     * Helper function to return the input component present in the base combobox used for connector labels
     */
    _getComboboxInputComponent = combobox => {
        // Grabbing the baseCombobox's input component
        const baseCombobox = combobox && combobox.shadowRoot.querySelector('lightning-base-combobox');
        const baseComboboxInput = baseCombobox && baseCombobox.shadowRoot.querySelector('input');

        return baseComboboxInput;
    };

    /**
     * Helper function to set the background color for the base combobox's input component.
     * This is currently being used to set the background color on hover in and out.
     */
    _setComboboxInputBackgroundColor = color => {
        const combobox = this.template.querySelector('lightning-combobox');
        const baseComboboxInput = this._getComboboxInputComponent(combobox);
        if (baseComboboxInput) {
            baseComboboxInput.style.background = color;
        }
    };

    handleComboboxChange = event => {
        const reorderConnectorsEvent = new ReorderConnectorsEvent(
            this.connectorInfo.addInfo.parent,
            this.connectorInfo.conditionValue,
            event.detail.value
        );
        this.dispatchEvent(reorderConnectorsEvent);
    };

    /**
     * Sets the background color of the combobox on hover.
     * @param {object} event - Mouse over event on the combobox used for connector labels
     */
    handleComboboxMouseOver = event => {
        event.stopPropagation();
        if (!this.hasOneOption) {
            this._setComboboxInputBackgroundColor('#f4f6f9');
        }
    };

    /**
     * Resets the background color of the combobox to white on hover out.
     * @param {object} event - Mouse out event on the combobox used for connector labels
     */
    handleComboboxMouseOut = event => {
        event.stopPropagation();
        if (!this.hasOneOption) {
            this._setComboboxInputBackgroundColor('#fff');
        }
    };
}
