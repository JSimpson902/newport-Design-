// @ts-nocheck
import { createElement } from 'lwc';
import WaitResumeConditions from '../waitResumeConditions';
import { WAIT_TIME_EVENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import {
    ticks,
    LIGHTNING_COMPONENTS_SELECTORS,
    INTERACTION_COMPONENTS_SELECTORS
} from 'builder_platform_interaction/builderTestUtils';
import { getEventTypes } from 'builder_platform_interaction/sobjectLib';

jest.mock('builder_platform_interaction/ferovResourcePicker', () =>
    require('builder_platform_interaction_mocks/ferovResourcePicker')
);
jest.mock('builder_platform_interaction/outputResourcePicker', () =>
    require('builder_platform_interaction_mocks/outputResourcePicker')
);

jest.mock('builder_platform_interaction/sobjectLib', () => {
    return {
        getEventTypes: jest.fn(),
        getInputParametersForEventType: jest.fn().mockName('getInputParametersForEventType')
    };
});

const createComponentUnderTest = props => {
    let el = createElement('builder_platform_interaction-wait-resume-conditions', {
        is: WaitResumeConditions
    });
    el = Object.assign(el, props);
    document.body.appendChild(el);
    return el;
};

const SELECTORS = {
    ...LIGHTNING_COMPONENTS_SELECTORS,
    ...INTERACTION_COMPONENTS_SELECTORS
};

const resumeEventType = {
    timeEventType: 'TIME_EVENT_TYPE',
    platformEventType: 'PLATFORM_EVENT_TYPE'
};

const verifyResumeEventType = (waitResumeConditions, shouldShowTimeEvent) => {
    const lightningRadioGroup = waitResumeConditions.shadowRoot.querySelector(SELECTORS.LIGHTNING_RADIO_GROUP);
    const waitTimeEvent = waitResumeConditions.shadowRoot.querySelector(SELECTORS.WAIT_TIME_EVENT);
    const waitPlatformEvent = waitResumeConditions.shadowRoot.querySelector(SELECTORS.WAIT_PLATFORM_EVENT);
    if (shouldShowTimeEvent) {
        expect(lightningRadioGroup.value).toBe(resumeEventType.timeEventType);
        expect(waitTimeEvent).toBeTruthy();
        expect(waitPlatformEvent).toBeNull();
    } else {
        expect(lightningRadioGroup.value).toBe(resumeEventType.platformEventType);
        expect(waitTimeEvent).toBeNull();
        expect(waitPlatformEvent).toBeTruthy();
    }
};

getEventTypes.mockReturnValue([]);

describe('waitResumeConditions', () => {
    describe('resume event type', () => {
        it('is time event if absolute alarm is the event type', () => {
            const props = {
                eventType: WAIT_TIME_EVENT_TYPE.ABSOLUTE_TIME,
                resumeTimeParameters: [],
                outputParameters: {}
            };
            verifyResumeEventType(createComponentUnderTest(props), true);
        });

        it('is time event if direct record alarm is the event type', () => {
            const props = {
                eventType: WAIT_TIME_EVENT_TYPE.DIRECT_RECORD_TIME,
                resumeTimeParameters: [],
                outputParameters: {}
            };
            verifyResumeEventType(createComponentUnderTest(props), true);
        });

        it('is platform event if the event type with suffix __e', () => {
            const props = {
                eventType: 'MyEvent__e',
                resumeTimeParameters: [],
                outputParameters: {}
            };
            verifyResumeEventType(createComponentUnderTest(props), false);
        });

        it('is platform event if the event type is any random string', () => {
            const props = {
                eventType: 'foo',
                resumeTimeParameters: [],
                outputParameters: {}
            };
            verifyResumeEventType(createComponentUnderTest(props), false);
        });
    });

    describe('toggle between resume event types', () => {
        const dispatchChangeEvent = (waitResumeConditions, newType) => {
            const lightningRadioGroup = waitResumeConditions.shadowRoot.querySelector(SELECTORS.LIGHTNING_RADIO_GROUP);
            lightningRadioGroup.dispatchEvent(new CustomEvent('change', { detail: { value: newType } }));
        };
        it('sets the resume event type as platform event when switching to that', async () => {
            const props = {
                eventType: WAIT_TIME_EVENT_TYPE.ABSOLUTE_TIME,
                resumeTimeParameters: [],
                outputParameters: {}
            };
            const waitResumeConditions = createComponentUnderTest(props);
            dispatchChangeEvent(waitResumeConditions, resumeEventType.platformEventType);
            await ticks(1);
            verifyResumeEventType(waitResumeConditions, false);
        });

        describe('switching from platform event type to time event type', () => {
            it('sets the resume event type as time event and resets to default event type', async () => {
                const props = {
                    eventType: WAIT_TIME_EVENT_TYPE.DIRECT_RECORD_TIME,
                    resumeTimeParameters: [],
                    outputParameters: {}
                };
                const waitResumeConditions = createComponentUnderTest(props);
                dispatchChangeEvent(waitResumeConditions, resumeEventType.platformEventType);
                await ticks(2);
                dispatchChangeEvent(waitResumeConditions, resumeEventType.timeEventType);
                await ticks(1);
                verifyResumeEventType(waitResumeConditions, true);
                const waitTimeEvent = waitResumeConditions.shadowRoot.querySelector(SELECTORS.WAIT_TIME_EVENT);
                expect(waitTimeEvent.eventType).toEqual(WAIT_TIME_EVENT_TYPE.ABSOLUTE_TIME);
            });

            it('clears params', async () => {
                const props = {
                    eventType: WAIT_TIME_EVENT_TYPE.ABSOLUTE_TIME,
                    resumeTimeParameters: [
                        {
                            name: {
                                value: 'value1',
                                error: 'error1'
                            },
                            value: {
                                value: 'value2',
                                error: 'error2'
                            },
                            valueDataType: {
                                value: 'value3',
                                error: 'error3'
                            },
                            rowIndex: 1
                        }
                    ],
                    outputParameters: {},
                    parameterName: jest.fn()
                };
                const waitResumeConditions = createComponentUnderTest(props);
                dispatchChangeEvent(waitResumeConditions, resumeEventType.platformEventType);
                await ticks(2);
                dispatchChangeEvent(waitResumeConditions, resumeEventType.timeEventType);
                await ticks(1);
                verifyResumeEventType(waitResumeConditions, true);
                const waitTimeEvent = waitResumeConditions.shadowRoot.querySelector(SELECTORS.WAIT_TIME_EVENT);
                expect(waitTimeEvent.eventType).toEqual(WAIT_TIME_EVENT_TYPE.ABSOLUTE_TIME);
                // TODO W-5395925: Update this test to check that the event gets fired
                // expect(waitTimeEvent.resumeTimeParameters).toEqual([]);
            });
        });
    });

    describe('wait time event', () => {
        let waitResumeConditions;
        let props;
        beforeEach(() => {
            const mockResumeTimeParameters = [{ name: { value: 'foo', error: null } }];
            const mockOutputParameters = {
                p1: { name: 'p1', value: '', error: null }
            };
            const mockEventType = WAIT_TIME_EVENT_TYPE.DIRECT_RECORD_TIME;
            props = {
                resumeTimeParameters: mockResumeTimeParameters,
                outputParameters: mockOutputParameters,
                eventType: mockEventType
            };
            waitResumeConditions = createComponentUnderTest(props);
        });

        it('passes eventType to the waitTimeEvent', () => {
            const waitTimeEvent = waitResumeConditions.shadowRoot.querySelector(SELECTORS.WAIT_TIME_EVENT);
            expect(waitTimeEvent.eventType).toEqual(props.eventType);
        });

        it('passes resumeTimeParameters to waitTimeEvent', () => {
            const waitTimeEvent = waitResumeConditions.shadowRoot.querySelector(SELECTORS.WAIT_TIME_EVENT);
            expect(waitTimeEvent.resumeTimeParameters).toEqual(props.resumeTimeParameters);
        });

        it('changing the event type is tracked', async () => {
            waitResumeConditions.eventType = WAIT_TIME_EVENT_TYPE.ABSOLUTE_TIME;
            await ticks(1);
            const waitTimeEvent = waitResumeConditions.shadowRoot.querySelector(SELECTORS.WAIT_TIME_EVENT);
            expect(waitTimeEvent.eventType).toEqual(WAIT_TIME_EVENT_TYPE.ABSOLUTE_TIME);
        });

        it('passes outputParameters to waitTimeEvent', () => {
            const waitTimeEvent = waitResumeConditions.shadowRoot.querySelector(SELECTORS.WAIT_TIME_EVENT);
            expect(waitTimeEvent.outputParameters).toEqual(props.outputParameters);
        });
    });
});
