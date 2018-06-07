const eventName = 'updaterecordlookupfilter';


export class UpdateRecordLookupFilterEvent {
    constructor(index, value) {
        return new CustomEvent(eventName, {
            cancelable: false,
            composed: true,
            bubbles: true,
            detail: {
                index,
                value
            }
        });
    }

    static EVENT_NAME = eventName;
}