// @ts-nocheck
/**
 * Used to open an empty property editor for the given element type.
 */
const eventName = 'addelement';
export class AddElementEvent extends CustomEvent {
    constructor(
        elementType,
        elementSubtype,
        locationX = 0,
        locationY = 0,
        actionType,
        actionName,
        prev,
        next,
        parent,
        childIndex
    ) {
        super(eventName, {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: {
                elementType,
                elementSubtype,
                locationX,
                locationY,
                actionType,
                actionName,
                prev,
                next,
                parent,
                childIndex
            }
        });
    }

    static EVENT_NAME = eventName;
}
