import {Element, api} from "engine";
import {AddListItemEvent} from 'builder_platform_interaction-events';


/**
 * Assignment Item List component for flow builder.
 * @ScrumTeam Process UI
 * @author hcockburn
 * @since 214
 */
export default class List extends Element {
    @api items = [];
    @api showDelete;

    handleAddClicked(event) {
        event.preventDefault();
        const index = this.items.length;
        const itemAddedEvent = new AddListItemEvent(index);
        this.dispatchEvent(itemAddedEvent);
    }
}