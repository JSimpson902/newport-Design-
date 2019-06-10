const eventName = 'deleterecordfilter';

export class DeleteRecordFilterEvent {
    constructor(index) {
        return new CustomEvent(eventName, {
            cancelable: false,
            composed: true,
            bubbles: true,
            detail: {
                index
            }
        });
    }

    static EVENT_NAME = eventName;
}
