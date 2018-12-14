/**
 * Used by components to indicate that a property of the business element they represent
 * has changed
 */
const eventName = 'propertychanged';


export class PropertyChangedEvent {
    constructor(propertyName, value, error = null, guid = null, oldValue = undefined, listIndex = undefined, dataType) {
        return new CustomEvent(eventName, {
            cancelable: false,
            composed: true,
            bubbles: true,
            detail: {
                propertyName,
                value,
                error,
                guid,
                oldValue,
                listIndex,
                dataType,
            }
        });
    }

    static EVENT_NAME = eventName;
}