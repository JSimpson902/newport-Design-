// @ts-nocheck
import { readonly } from 'lwc';
import { translateFlowToUIModel } from '../flowToUiTranslator';
import { translateUIModelToFlow } from '../uiToFlowTranslator';
import { deepCopy, Store } from 'builder_platform_interaction/storeLib';
import { reducer } from 'builder_platform_interaction/reducers';
import { updateFlow } from 'builder_platform_interaction/actions';
import { deepFindMatchers, goldObjectMatchers } from 'builder_platform_interaction/builderTestUtils';
import * as flowWithAllElements from 'mock/flows/flowWithAllElements.json';
import { flowWithAllElementsUIModel } from 'mock/storeData';
import * as scheduleTriggeredFlow from 'mock/flows/scheduleTriggeredFlow.json';
import { scheduleTriggeredFlowUIModel } from 'mock/storeDataScheduleTriggered';
import * as contactRequestFlow from 'mock/flows/contactRequestFlow.json';
import { contactRequestFlowUIModel } from 'mock/storeDataContactrequest';
import * as fieldServiceMobileFlow from 'mock/flows/fieldServiceMobileFlow.json';
import { fieldServiceMobileFlowUIModel } from 'mock/storeDataFieldServiceMobile';
import { setApexClasses } from 'builder_platform_interaction/apexTypeLib';
import { apexTypesForFlow } from 'serverData/GetApexTypes/apexTypesForFlow.json';
import * as recordTriggeredFlow from 'mock/flows/recordTriggeredFlow.json';
import { recordTriggeredFlowUIModel } from 'mock/storeDataRecordTriggered';
import * as orchestratorFlow from 'mock/flows/orchestratorFlow.json';
import { orchestratorFlowUIModel } from 'mock/storeDataOrchestrator';
import { FLOW_TRIGGER_TYPE } from 'builder_platform_interaction/flowMetadata';
import { flowWithVariables } from './flows/flowWithVariables';
import { flowWithAssignments } from './flows/flowWithAssignments';
import { flowLegalNameChange } from './flows/flowLegalNameChange';
import { flowCollectionServicesDemo } from './flows/flowCollectionServicesDemo';
import { getLocalizationService } from 'lightning/configProvider';

expect.extend(deepFindMatchers);
expect.extend(goldObjectMatchers);

const SAMPLE_FLOWS = [flowLegalNameChange, flowCollectionServicesDemo, flowWithVariables, flowWithAssignments];
const MOCK_TRIGGER_TYPE: string = FLOW_TRIGGER_TYPE.AFTER_SAVE;

// 1993 Park-Miller LCG
const lcg = (s) => () => {
    s = Math.imul(48271, s) | 0 % 2147483647;
    return (s & 2147483647) / 2147483648;
};

let pseudoRandom = lcg(123);

function mockGenerateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (pseudoRandom() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// reset the pseudo random function used by mockGenerateGuid
function resetMockGenerateGuidPseudoRandom() {
    pseudoRandom = lcg(123);
}

jest.mock('builder_platform_interaction/processTypeLib', () => {
    const actual = jest.requireActual('builder_platform_interaction/processTypeLib');
    return Object.assign({}, actual, {
        getProcessTypeAutomaticOutPutHandlingSupport: jest.fn().mockReturnValue('Supported'),
        isScheduledPathSupported: jest.fn().mockReturnValue(true)
    });
});

// we want to use the real implementation (and we cannot use unmock ...)
jest.mock('builder_platform_interaction/storeLib', () => {
    const actual = jest.requireActual('builder_platform_interaction/storeLib');
    return Object.assign({}, actual, {
        generateGuid: mockGenerateGuid
    });
});

jest.mock('builder_platform_interaction/storeUtils', () => {
    const actual = jest.requireActual('builder_platform_interaction/storeUtils');
    return Object.assign({}, actual, {
        getTriggerType: () => MOCK_TRIGGER_TYPE
    });
});

jest.mock('builder_platform_interaction/invocableActionLib', () =>
    require('builder_platform_interaction_mocks/invocableActionLib')
);
jest.mock('builder_platform_interaction/sobjectLib', () => {
    return {
        getEntity: (objectType) => {
            return { apiName: objectType.charAt(0).toUpperCase() + objectType.slice(1) };
        }
    };
});
jest.mock('builder_platform_interaction/flowExtensionLib', () =>
    require('builder_platform_interaction_mocks/flowExtensionLib')
);

/**
 * Modify the expected object. This can be used when we have an expected object that is not exactly what we want.
 *
 * @param {Object} given the given
 * @param {Object} expected the expected object we want to modify
 * @param {Function} callback the function called for each property. This function can modify the expected object.
 * @param path
 */
export const modifyExpected = (given, expected, callback, path = []) => {
    if (given == null || expected == null) {
        return expected;
    }
    given = readonly(given);
    if (Array.isArray(given) && Array.isArray(expected)) {
        const length = given.length >= expected.length ? given.length : expected.length;
        for (let i = 0; i < length; i++) {
            modifyExpected(
                i < given.length ? given[i] : undefined,
                i < expected.length ? expected[i] : undefined,
                callback,
                [...path, i]
            );
        }
    } else if (typeof given === 'object' && typeof expected === 'object') {
        for (const key in given) {
            if (Object.prototype.hasOwnProperty.call(given, key)) {
                const newPath = [...path, key];
                callback(given, expected, key, given[key], expected[key], newPath);
                modifyExpected(given[key], expected[key], callback, newPath);
            }
        }
        for (const key in expected) {
            if (Object.prototype.hasOwnProperty.call(expected, key)) {
                if (!Object.prototype.hasOwnProperty.call(given, key)) {
                    const newPath = [...path, key];
                    callback(given, expected, key, given[key], expected[key], newPath);
                    modifyExpected(given[key], expected[key], callback, newPath);
                }
            }
        }
    }
    return expected;
};

const isEmpty = (value) =>
    value === '' || value == null || value === undefined || (Array.isArray(value) && value.length === 0);

const all = (callbacks) => (givenElement, expectedElement, key, givenValue, expectedValue, path) => {
    for (const callback of callbacks) {
        callback(givenElement, expectedElement, key, givenValue, expectedValue, path);
    }
};

const ignoreEmptyFields = (givenElement, expectedElement, key, givenValue, expectedValue) => {
    if (expectedElement) {
        if (isEmpty(givenValue) && expectedValue === undefined) {
            expectedElement[key] = givenValue;
        } else if (isEmpty(expectedValue) && givenValue === undefined) {
            delete expectedElement[key];
        }
    }
};

/**
 * Test if path1 is the same path than path2
 *
 * @param {string[]} path1 first path
 * @param {string[]} path2 second path
 * @returns {boolean} true if path1 is same path than path2
 */
const isSamePath = (path1, path2) => {
    let i = path1.length;
    if (i !== path2.length) {
        return false;
    }
    while (i--) {
        if (path1[i] !== path2[i]) {
            return false;
        }
    }
    return true;
};

/**
 * Test if a path is included in a given array of paths
 *
 * @param {string[][]} paths array of paths
 * @param {string[]} path path
 * @returns {boolean} true if path is included in paths
 */
const isPathIncluded = (paths, path) => {
    return paths.find((pathFromArray) => isSamePath(pathFromArray, path)) !== undefined;
};

const ignoreIfNotInGiven = (paths) => (givenElement, expectedElement, key, givenValue, expectedValue, path) => {
    if (expectedElement) {
        if (isEmpty(givenValue) && isPathIncluded(paths, path)) {
            delete expectedElement[key];
        }
    }
};

const ignoreIfNotInExpected = (paths) => (givenElement, expectedElement, key, givenValue, expectedValue, path) => {
    if (expectedElement) {
        if (isEmpty(expectedValue) && isPathIncluded(paths, path)) {
            if (!Object.prototype.hasOwnProperty.call(expectedElement, key)) {
                delete expectedElement[key];
            } else {
                expectedElement[key] = givenValue;
            }
        }
    }
};

const stringifyExpectedNumberValue = (givenElement, expectedElement, key, givenValue, expectedValue) => {
    if (expectedElement && (key === 'numberValue' || key === 'limit') && typeof expectedValue == 'number') {
        expectedElement[key] = expectedValue.toString();
    }
};

const ignoreIfDefaultValue = (givenElement, expectedElement, key, givenValue, expectedValue, path) => {
    if (!isEmpty(givenValue)) {
        return;
    }
    // default value is 0 for limit
    if (key === 'limit' && expectedValue === 0 && path[path.length - 3] === 'dynamicChoiceSets') {
        delete expectedElement.limit;
    }
    // isVisible is "Reserved for future use"
    if (key === 'isVisible' && expectedValue === false && path[path.length - 3] === 'fields') {
        delete expectedElement.isVisible;
    }
};

const getExpectedFlowMetadata = (uiFlow, flowFromMetadataAPI) => {
    const ignoredIfNotInGiven = [
        ['createdById'],
        ['createdDate'],
        ['definitionId'],
        ['id'],
        ['lastModifiedById'],
        ['lastModifiedDate'],
        ['manageableState'],
        ['masterLabel'],
        ['processType'],
        ['status'],
        ['metadata', 'isTemplate']
    ];
    const ignoredIfNotInExpected = [['metadata', 'processMetadataValues']];
    // TODO W-5583918 stringifyExpectedNumberValue : it would be better to have a number instead of a string
    return modifyExpected(
        uiFlow,
        deepCopy(flowFromMetadataAPI),
        all([
            ignoreEmptyFields,
            ignoreIfNotInGiven(ignoredIfNotInGiven),
            ignoreIfNotInExpected(ignoredIfNotInExpected),
            stringifyExpectedNumberValue,
            ignoreIfDefaultValue
        ])
    );
};

describe('Flow Translator', () => {
    let store, uiFlow;
    const localizationService = getLocalizationService();

    beforeEach(() => {
        store = Store.getStore(reducer);
        resetMockGenerateGuidPseudoRandom();
    });
    describe('Getting flow metadata, calling flow-to-ui translation and calling ui-to-flow', () => {
        SAMPLE_FLOWS.forEach((metadataFlow) => {
            it(`returns the same metadata for sample flow ${metadataFlow.fullName}`, () => {
                localizationService.parseDateTimeUTC.mockReturnValue(new Date());
                uiFlow = translateFlowToUIModel(metadataFlow);
                expect(uiFlow).toHaveNoCommonMutableObjectWith(metadataFlow);
                store.dispatch(updateFlow(uiFlow));
                const newMetadataFlow = translateUIModelToFlow(uiFlow);
                const expected = getExpectedFlowMetadata(newMetadataFlow, metadataFlow);
                expect(newMetadataFlow).toEqual(expected);
            });
        });
    });
    describe('Screen flow with all elements', () => {
        beforeAll(() => {
            setApexClasses(apexTypesForFlow);
        });
        afterAll(() => {
            setApexClasses();
        });
        it('returns expected ui model', () => {
            uiFlow = translateFlowToUIModel(flowWithAllElements);
            expect(uiFlow).toEqualGoldObject(
                flowWithAllElementsUIModel,
                'flowWithAllElementsUIModel in mock_store_data/flowWithAllElementsUIModel'
            );
        });
        // before W-7364488, 2 calls were needed for some elements to get the final ui model (ex : loop in automatic output handling mode)
        it('needs only one translation to get final ui model', () => {
            uiFlow = translateFlowToUIModel(flowWithAllElements);
            store.dispatch(updateFlow(uiFlow));
            resetMockGenerateGuidPseudoRandom();
            const uiFlow2 = translateFlowToUIModel(flowWithAllElements);
            store.dispatch(updateFlow(uiFlow));
            expect(JSON.stringify(uiFlow2)).toEqual(JSON.stringify(uiFlow));
        });
    });
    it('returns expected ui model for an autolaunched flow', () => {
        uiFlow = translateFlowToUIModel(scheduleTriggeredFlow);
        store.dispatch(updateFlow(uiFlow));

        expect(uiFlow).toEqualGoldObject(
            scheduleTriggeredFlowUIModel,
            'scheduleTriggeredFlowUIModel in mock_store_data_scheduleTriggered/scheduleTriggeredFlowUIModel'
        );
    });
    it('returns expected ui model for a contact request flow', () => {
        uiFlow = translateFlowToUIModel(contactRequestFlow);
        store.dispatch(updateFlow(uiFlow));

        expect(uiFlow).toEqualGoldObject(
            contactRequestFlowUIModel,
            'contactRequestFlowUIModel in mock_store_data_contactrequest/contactRequestFlowUIModel'
        );
    });
    it('returns expected ui model for a field service mobile flow', () => {
        uiFlow = translateFlowToUIModel(fieldServiceMobileFlow);
        store.dispatch(updateFlow(uiFlow));

        expect(uiFlow).toEqualGoldObject(
            fieldServiceMobileFlowUIModel,
            'fieldServiceMobileFlowUIModel in mock_store_data_contactrequest/fieldServiceMobileFlowUIModel'
        );
    });
    it('returns expected ui model for a record triggered flow', () => {
        uiFlow = translateFlowToUIModel(recordTriggeredFlow);
        store.dispatch(updateFlow(uiFlow));

        expect(uiFlow).toEqualGoldObject(
            recordTriggeredFlowUIModel,
            'recordTriggeredFlowUIModel in mock_store_data_recordTriggered/recordTriggeredFlowUIModel'
        );
    });
    it('returns expected ui model for an orchestrator flow', () => {
        uiFlow = translateFlowToUIModel(orchestratorFlow);
        store.dispatch(updateFlow(uiFlow));

        expect(uiFlow).toEqualGoldObject(
            orchestratorFlowUIModel,
            'orchestratorFlowUIModel in mock_store_data_recordTriggered/orchestratorFlowUIModel'
        );
    });
});
