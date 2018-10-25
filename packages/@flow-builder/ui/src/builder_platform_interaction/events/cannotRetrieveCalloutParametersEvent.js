const eventName = 'cannotretrievecalloutparameters';


export class CannotRetrieveCalloutParametersEvent {
    constructor() {
        return new CustomEvent(eventName, {
            cancelable: false,
            composed: true,
            bubbles: true
        });
    }

    static EVENT_NAME = eventName;
}