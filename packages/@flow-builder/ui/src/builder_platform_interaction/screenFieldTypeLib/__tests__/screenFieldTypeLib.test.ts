// @ts-nocheck
import * as contextLibMock from 'builder_platform_interaction/contextLib';
import { FLOW_ENVIRONMENT } from 'builder_platform_interaction/flowMetadata';
import {
    getSupportedScreenFieldTypes,
    isAutomaticFieldsSupported
} from 'builder_platform_interaction/screenFieldTypeLib';
import { Store } from 'builder_platform_interaction/storeLib';
import { supportedScreenFieldsForFlow as mockSupportedScreenFieldsForFlow } from 'serverData/GetSupportedScreenFields/supportedScreenFieldsForFlow.json';
import { supportedScreenFieldsForFlowOnSlack as mockSupportedScreenFieldsForSlack } from 'serverData/GetSupportedScreenFields/supportedScreenFieldsForFlowOnSlack.json';

jest.mock('builder_platform_interaction/contextLib', () => {
    return Object.assign({}, require('builder_platform_interaction_mocks/contextLib'), {
        orgHasFlowScreenSections: jest.fn()
    });
});

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

jest.mock('builder_platform_interaction/serverDataLib', () => {
    const actual = jest.requireActual('builder_platform_interaction/serverDataLib');
    const actualMetadata = jest.requireActual('builder_platform_interaction/flowMetadata');
    const SERVER_ACTION_TYPE = actual.SERVER_ACTION_TYPE;
    return {
        SERVER_ACTION_TYPE,
        fetchOnce: (serverActionType, params) => {
            if (
                params.flowEnvironmentKey &&
                params.flowEnvironments.indexOf(actualMetadata.FLOW_ENVIRONMENT.SLACK) > -1
            ) {
                return Promise.resolve(mockSupportedScreenFieldsForSlack);
            }
            return Promise.resolve(mockSupportedScreenFieldsForFlow);
        }
    };
});

describe('getAllScreenFieldTypes function', () => {
    let processType, triggerType;

    beforeEach(() => {
        processType = 'dummyProcessType';
        triggerType = 'dummyTriggerType';
        Store.setMockState({
            canvasElements: ['element1', 'element2'],
            connectors: ['connector1', 'connector2'],
            properties: { processType: 'autolaunched' }
        });
    });

    it('when sections perm is disabled, section field type is not in supported screen types', async () => {
        contextLibMock.orgHasFlowScreenSections.mockReturnValue(false);
        const supportedTypes = await getSupportedScreenFieldTypes(processType, triggerType, null);
        expect(supportedTypes).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    isElementSubtype: false,
                    name: 'RegionContainer',
                    classification: 'Child',
                    elementType: 'ScreenField'
                })
            ])
        );
    });

    it('when section perm is enabled, section field type is in supported screen types', async () => {
        contextLibMock.orgHasFlowScreenSections.mockReturnValue(true);
        const supportedTypes = await getSupportedScreenFieldTypes(processType, triggerType, null);
        expect(supportedTypes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    classification: 'Child',
                    elementType: 'ScreenField',
                    isElementSubtype: false,
                    name: 'RegionContainer'
                })
            ])
        );
    });

    describe('getAllScreenFieldTypes function with environment', () => {
        it('returns supported screen fields for Slack', async () => {
            const supportedTypes = await getSupportedScreenFieldTypes(processType, triggerType, [
                FLOW_ENVIRONMENT.SLACK
            ]);
            expect(supportedTypes).toMatchObject(mockSupportedScreenFieldsForSlack);
        });
    });
});

describe('isAutomaticFieldsSupported function', () => {
    it('returns true in non-Slack environment', async () => {
        const supportedTypes = await getSupportedScreenFieldTypes('someProcessType', 'someTriggerType', null);
        expect(isAutomaticFieldsSupported(supportedTypes)).toBe(true);
    });
    it('returns false in Slack environment', async () => {
        const supportedTypes = await getSupportedScreenFieldTypes('someProcessType', 'someTriggerType', [
            FLOW_ENVIRONMENT.SLACK
        ]);
        expect(isAutomaticFieldsSupported(supportedTypes)).toBe(false);
    });
});
