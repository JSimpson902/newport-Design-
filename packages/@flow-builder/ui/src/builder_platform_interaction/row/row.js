import {Element, api} from 'engine';
import {DeleteListItemEvent, UpdateListItemEvent} from 'builder_platform_interaction-events';

/**
 * Assignment Item List Row component for flow builder.
 *
 * @ScrumTeam Process UI
 * @author hcockburn
 * @since 214
 */
export default class Row extends Element {
    @api itemIndex;
    @api itemPrefix;
    @api showPrefix;
    @api showDelete;

    get disableDelete() {
        return !this.showDelete;
    }

    get rowContentsClass() {
        let contentsClass = 'slds-grid slds-grid_horizontal slds-grid_vertical-align-end slds-gutters slds-gutters_xx-small';
        if (this.showPrefix) {
            contentsClass = 'slds-m-left_x-large ' + contentsClass;
        }
        return contentsClass;
    }

    handleRowContentsChanged(event) {
        const index = this.itemIndex;
        const value = event.detail.newValue;
        // TODO plz change the error from null to appropriate value coming from lower level component
        const itemUpdatedEvent = new UpdateListItemEvent(index, value);
        this.dispatchEvent(itemUpdatedEvent);
    }

    handleDelete(event) {
        event.stopPropagation();
        const itemDeletedEvent = new DeleteListItemEvent(this.itemIndex);
        this.dispatchEvent(itemDeletedEvent);
    }
}
