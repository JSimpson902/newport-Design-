import { generateInternalName, isUndefinedOrNull } from 'builder_platform_interaction/commonUtils';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import { formatDateTimeUTC, getDayOfTheWeek } from 'builder_platform_interaction/dateTimeUtils';
import {
    CONDITION_LOGIC,
    CONNECTOR_TYPE,
    ELEMENT_TYPE,
    FLOW_PROCESS_TYPE,
    FLOW_TRIGGER_FREQUENCY,
    FLOW_TRIGGER_SAVE_TYPE,
    FLOW_TRIGGER_TYPE,
    SCHEDULED_PATH_OFFSET_UNIT,
    SCHEDULED_PATH_TIME_SOURCE_TYPE,
    SCHEDULED_PATH_TYPE,
    START_ELEMENT_LOCATION,
    TIME_OPTION
} from 'builder_platform_interaction/flowMetadata';
import { isOrchestrator, isScheduledPathSupported } from 'builder_platform_interaction/processTypeLib';
import { generateGuid } from 'builder_platform_interaction/storeLib';
import { getElementByGuid, getProcessType } from 'builder_platform_interaction/storeUtils';
import { SYSTEM_VARIABLE_RECORD_PREFIX } from 'builder_platform_interaction/systemVariableConstantsLib';
import { isRecordChangeTriggerType, isScheduledTriggerType } from 'builder_platform_interaction/triggerTypeLib';
import {
    baseCanvasElement,
    baseCanvasElementsArrayToMap,
    baseChildElement,
    getDeletedCanvasElementChildren,
    updateChildReferences
} from './base/baseElement';
import { baseCanvasElementMetadataObject, baseChildElementMetadataObject } from './base/baseMetadata';
import { createFilterMetadataObject, createRecordFilters } from './base/baseRecordElement';
import {
    addRegularConnectorToAvailableConnections,
    getConnectionProperties
} from './commonFactoryUtils/connectionPropertiesUtils';
import { createConnectorObjects, createStartElementConnector } from './connector';
import { LABELS } from './elementFactoryLabels';

const elementType = ELEMENT_TYPE.START_ELEMENT;

const { BEFORE_SAVE, AFTER_SAVE, SCHEDULED, PLATFORM_EVENT, BEFORE_DELETE } = FLOW_TRIGGER_TYPE;
const BEFORE_AFTER_SAVE_Y_OFFSET = 216;
const BEFORE_AFTER_SAVE_FILTER_Y_OFFSET = 239;
const SCHEDULED_Y_OFFSET = 181;
const SCHEDULED_FILTER_Y_OFFSET = 204;
const PLATFORM_Y_OFFSET = 122;
const DEFAULT_Y_OFFSET = 86;

const DEFAULT_ORCHESTRATION_OBJECT = 'Account';

/**
 * Helper function to determine how big the start element is in the Y direction.
 *
 * @param startElement start element metadata structure
 * @returns Y offset
 */
export function findStartYOffset(startElement: UI.Start): number {
    switch (startElement.triggerType) {
        case AFTER_SAVE:
        case BEFORE_SAVE:
        case BEFORE_DELETE:
            if (startElement.filters && startElement.filters.length > 0) {
                return BEFORE_AFTER_SAVE_FILTER_Y_OFFSET;
            }
            return BEFORE_AFTER_SAVE_Y_OFFSET;
        case SCHEDULED:
            if (startElement.filters && startElement.filters.length > 0) {
                return SCHEDULED_FILTER_Y_OFFSET;
            }
            return SCHEDULED_Y_OFFSET;
        case PLATFORM_EVENT:
            return PLATFORM_Y_OFFSET;
        default:
            return DEFAULT_Y_OFFSET;
    }
}

/**
 * Helper function to figure out if scheduled paths are supported or not.
 * Scheduled Paths are only supported in the following scenarios when an object is defined:
 * 1) For After_Save trigger type:
 *      a) Create - Scheduled Paths are always available
 *      b) Update/CreateAndUpdate - Scheduled Paths are only available when
 *          doesRequireRecordChangedToMeetCriteria is true and filters are defined
 * 2) Process type is autolaunched
 *
 * @param startElement - the start element
 * @param processType - the process type
 * @returns true iff the start element can support scheduled paths
 */
export function shouldSupportScheduledPaths(startElement: UI.Start, processType?: string | null): boolean {
    // A cleaner way to perform this check is to update process type utils method
    // to use the feature-processType check.
    // Refer W-8931057 [Scheduled Paths] Scheduled Path errors are not linked on the builder

    // process type is not always passed; in which case, fetch it from storeUtils
    if (!processType) {
        processType = getProcessType();
    }
    const schedulePathSupported = processType === null ? true : isScheduledPathSupported(processType);
    return !!(
        schedulePathSupported &&
        startElement.triggerType === FLOW_TRIGGER_TYPE.AFTER_SAVE &&
        startElement.object
    );
}

/**
 * Creates a start element object
 *
 * @param {Object} startElement start element object used to construct the new object
 * @param processType
 * @param timeZoneSidKey the time zone of the start element. W-11287604 timeZoneSidKey is edited at the start node level but the field exists at the flow properties level
 * @returns {Object} startElement the new start element object
 */
export function createStartElement(
    startElement: UI.Start | Metadata.Start,
    processType?: string | null | undefined,
    timeZoneSidKey?: string | null | undefined
) {
    const newStartElement: UI.Start = <UI.Start>baseCanvasElement(startElement);
    const {
        locationX = START_ELEMENT_LOCATION.x,
        locationY = START_ELEMENT_LOCATION.y,
        filters = [],
        filterFormula
    } = startElement;
    const { objectIndex = generateGuid(), objectContainer, segment } = <UI.Start>startElement;
    const maxConnections = calculateMaxConnections(startElement);
    const triggerType = startElement.triggerType || FLOW_TRIGGER_TYPE.NONE;
    const { startDate, startTime } = (startElement as Metadata.Start).schedule || startElement;
    let { recordTriggerType, frequency } = (startElement as Metadata.Start).schedule || startElement;
    let { filterLogic = getDefaultFilterLogic(triggerType, processType) } = startElement;

    let { object = '' } = startElement;

    object = getDefaultObjectForOrchestration(object, triggerType, newStartElement, processType);

    // TODO: W-10476015 to move the logic to recordChangeTriggerReducer
    if (object && filters.length === 0) {
        if (filterLogic === CONDITION_LOGIC.AND) {
            // For the existing element if no filters has been set we need to assign No Conditions to the filterLogic.
            filterLogic = CONDITION_LOGIC.NO_CONDITIONS;
        }
        // If filterFormula is set, set the filterLogic to Formula Evaluates to True
        if (filterFormula) {
            filterLogic = CONDITION_LOGIC.FORMULA;
        }
    }

    const isoStartTime = getIsoStartTime(startTime);

    let label;
    if (isScheduledTriggerType(triggerType)) {
        label = getscheduledLabel(startDate, isoStartTime, frequency);
        if (!frequency) {
            frequency = FLOW_TRIGGER_FREQUENCY.ONCE;
        }
    }

    if (isRecordChangeTriggerType(triggerType)) {
        if (recordTriggerType === undefined) {
            if (triggerType === FLOW_TRIGGER_TYPE.BEFORE_DELETE) {
                recordTriggerType = FLOW_TRIGGER_SAVE_TYPE.DELETE;
            } else {
                recordTriggerType = FLOW_TRIGGER_SAVE_TYPE.CREATE;
            }
        }
    }

    const requireChangedValues = startElement.doesRequireRecordChangedToMeetCriteria;
    const recordFilters = createRecordFilters(filters, object);

    Object.assign(newStartElement, {
        elementType,
        locationX,
        locationY,
        maxConnections,
        triggerType,
        filterLogic,
        startDate,
        startTime: isoStartTime,
        recordTriggerType,
        frequency,
        object,
        objectIndex,
        filters: recordFilters,
        label,
        filterFormula,
        objectContainer,
        segment,
        // If the start element is linked to an sobject, then make the element look like a data element.
        name: object ? SYSTEM_VARIABLE_RECORD_PREFIX : undefined,
        // used to mark $Record.field as system variable
        haveSystemVariableFields: object ? true : undefined,
        dataType: object ? FLOW_DATA_TYPE.SOBJECT.value : undefined,
        subtype: object ? object : undefined,
        isCollection: object ? false : undefined,
        isAssignable: object ? true : undefined,
        doesRequireRecordChangedToMeetCriteria: requireChangedValues,
        childReferences: (<UI.Start>startElement).childReferences || [],
        availableConnections: (<UI.Start>startElement).availableConnections || [{ type: CONNECTOR_TYPE.REGULAR }],
        // NOTE: W-11287604 timeZoneSidKey is edited at the start node level but the field exists at the flow properties level
        timeZoneSidKey: timeZoneSidKey || startElement.timeZoneSidKey
    });

    newStartElement.shouldSupportScheduledPaths = shouldSupportScheduledPaths(newStartElement, processType);

    return newStartElement;
}

/**
 * @param startTime startTime
 * @returns ISOStartTime instance of Metadata.StartTime
 */
export function getIsoStartTime(startTime: Metadata.StartTime) {
    return startTime && !isUndefinedOrNull(startTime.timeInMillis)
        ? getISOTimeFromMillis(startTime.timeInMillis)
        : startTime;
}

/**
 * Creates a start element object on opening any start element property editor
 *
 * @param {Object} startElement start element object used to construct the new object
 * @returns {Object} startElement the new start element object
 */
export function createStartElementForPropertyEditor(startElement: UI.Start = {} as UI.Start) {
    const newStartElement = createStartElement(startElement);

    const triggerType = startElement.triggerType || FLOW_TRIGGER_TYPE.NONE;
    const { childReferences } = startElement;
    let scheduledPaths: UI.ScheduledPath[] = [];

    if (isRecordChangeTriggerType(triggerType)) {
        if (childReferences && childReferences.length > 0) {
            scheduledPaths = childReferences.map((childReference) => {
                const scheduledPath = createScheduledPath(
                    getElementByGuid(childReference.childReference) as UI.ScheduledPath
                );
                return scheduledPath;
            });
        } else {
            // new trigger case
            const newScheduledPath = createScheduledPath(<UI.ScheduledPath>{});
            scheduledPaths = [newScheduledPath];
        }
        return Object.assign(newStartElement, {
            scheduledPaths
        });
    }
    return newStartElement;
}

/**
 * Create the start element object with connectors using either the startElement metadata object or the startElementReference metadata property
 * This is used during translation from metadata to the client side UI model.
 *
 * @param {Object} startElement start element metadata object
 * @param {string} startElementReference guid/name of the first element in the flow
 * @param processType
 * @param timeZoneSidKey
 * @returns {Object} startElement the start element object
 */
export function createStartElementWithConnectors(
    startElement: Metadata.Start = {} as Metadata.Start,
    startElementReference,
    processType: string | null | undefined,
    timeZoneSidKey: string | null | undefined
) {
    const newStartElement = createStartElement(startElement, processType, timeZoneSidKey);

    let connectorCount, connectors;
    let availableConnections: UI.AvailableConnection[] = [];
    if (!newStartElement.shouldSupportScheduledPaths) {
        // Creates a REGULAR connector or pushes one into the availableConnections if needed
        connectors = startElementReference
            ? createStartElementConnector(newStartElement.guid, startElementReference)
            : createConnectorObjects(startElement, newStartElement.guid, undefined, false);
        availableConnections = addStartElementConnectorToAvailableConnections(
            availableConnections,
            startElement,
            CONNECTOR_TYPE.REGULAR
        );
    } else {
        // Creates an IMMEDIATE connector (Therefore,immediateConnector is passed as true here)
        connectors = createConnectorObjects(startElement, newStartElement.guid, undefined, true);
        let childReferences: UI.ChildReference[] = [],
            updatedScheduledPaths: UI.ScheduledPath[] = [];
        const { scheduledPaths = [] } = startElement;

        for (let i = 0; i < scheduledPaths.length; i++) {
            let currentScheduledPath = scheduledPaths[i];
            if (currentScheduledPath.pathType === SCHEDULED_PATH_TYPE.RUN_ASYNC) {
                currentScheduledPath = {
                    ...currentScheduledPath,
                    label: LABELS.runAsyncScheduledPathLabel,
                    name: generateInternalName(SCHEDULED_PATH_TYPE.RUN_ASYNC)
                };
            }
            const scheduledPath = createScheduledPath(currentScheduledPath);
            const connector = createConnectorObjects(currentScheduledPath, scheduledPath.guid, newStartElement.guid);
            updatedScheduledPaths = [...updatedScheduledPaths, scheduledPath];
            // updating child references
            childReferences = updateChildReferences(childReferences, scheduledPath);
            availableConnections = addRegularConnectorToAvailableConnections(
                availableConnections,
                currentScheduledPath
            );
            // connector is an array. FIX it.
            connectors = [...connectors, ...connector];
        }

        // Pushes an Immediate connector into availableConnections if needed
        availableConnections = addStartElementConnectorToAvailableConnections(
            availableConnections,
            startElement,
            CONNECTOR_TYPE.IMMEDIATE
        );
        connectorCount = connectors ? connectors.length : 0;

        Object.assign(newStartElement, {
            childReferences,
            elementType,
            connectorCount,
            availableConnections,
            defaultConnectorLabel: LABELS.immediateConnectorLabel
        });
        return baseCanvasElementsArrayToMap([newStartElement, ...updatedScheduledPaths], connectors);
    }

    connectorCount = connectors ? connectors.length : 0;
    Object.assign(newStartElement, { connectorCount, availableConnections });
    return baseCanvasElementsArrayToMap([newStartElement], connectors);
}

/**
 * Create a start element Flow metadata object
 *
 * @param {Object} startElement the start element client side object used to construct the metadata object
 * @param {Object} config configuration used to translate to the metadata object
 * @returns {Object} startElementMetadata the start element metadata object
 */
export function createStartElementMetadataObject(startElement: UI.Start, config = {}) {
    /* Commented code in this function will be checked in with this story:
    W-8188232: https://gus.lightning.force.com/lightning/r/ADM_Work__c/a07B0000008ge9PIAQ/view
    */
    if (!startElement) {
        throw new Error('startElement is not defined');
    }

    const startElementMetadata = baseCanvasElementMetadataObject(startElement, config);

    const {
        object,
        objectContainer,
        segment,
        triggerType,
        startDate,
        recordTriggerType,
        startTime,
        frequency,
        filters = [],
        childReferences,
        filterFormula
    } = startElement;
    let { doesRequireRecordChangedToMeetCriteria, filterLogic } = startElement;
    let recordFilters;

    recordFilters = filters.filter((filter) => filter.leftHandSide);

    if (recordFilters.length > 0 && filterLogic !== CONDITION_LOGIC.NO_CONDITIONS) {
        recordFilters = recordFilters.map((filter) => createFilterMetadataObject(filter));
    } else {
        doesRequireRecordChangedToMeetCriteria =
            filterLogic === CONDITION_LOGIC.NO_CONDITIONS ? false : doesRequireRecordChangedToMeetCriteria;
        recordFilters = [];
        filterLogic = undefined;
    }

    let scheduledPaths;

    if (childReferences && childReferences.length > 0) {
        scheduledPaths = childReferences.map(({ childReference }) => {
            const scheduledPath: UI.ScheduledPath = getElementByGuid(childReference) as UI.ScheduledPath;
            const metadataScheduledPath = baseChildElementMetadataObject(scheduledPath, config);

            let recordField;
            const { offsetNumber, pathType } = scheduledPath;
            let { timeSource, offsetUnit } = scheduledPath;
            timeSource = timeSource === '' ? undefined : timeSource;
            offsetUnit = offsetUnit === '' ? undefined : offsetUnit;

            let offsetNumberAsNumber = Number(offsetNumber);

            if (offsetUnit === TIME_OPTION.HOURS_BEFORE) {
                offsetUnit = SCHEDULED_PATH_OFFSET_UNIT.HOURS;
                offsetNumberAsNumber *= -1;
            } else if (offsetUnit === TIME_OPTION.HOURS_AFTER) {
                offsetUnit = SCHEDULED_PATH_OFFSET_UNIT.HOURS;
            } else if (offsetUnit === TIME_OPTION.DAYS_BEFORE) {
                offsetUnit = SCHEDULED_PATH_OFFSET_UNIT.DAYS;
                offsetNumberAsNumber *= -1;
            } else if (offsetUnit === TIME_OPTION.DAYS_AFTER) {
                offsetUnit = SCHEDULED_PATH_OFFSET_UNIT.DAYS;
            } else if (offsetUnit === TIME_OPTION.MINUTES_BEFORE) {
                offsetUnit = SCHEDULED_PATH_OFFSET_UNIT.MINUTES;
                offsetNumberAsNumber *= -1;
            } else if (offsetUnit === TIME_OPTION.MINUTES_AFTER) {
                offsetUnit = SCHEDULED_PATH_OFFSET_UNIT.MINUTES;
            } else if (offsetUnit === TIME_OPTION.MONTHS_BEFORE) {
                offsetUnit = SCHEDULED_PATH_OFFSET_UNIT.MONTHS;
                offsetNumberAsNumber *= -1;
            } else if (offsetUnit === TIME_OPTION.MONTHS_AFTER) {
                offsetUnit = SCHEDULED_PATH_OFFSET_UNIT.MONTHS;
            }

            if (timeSource !== SCHEDULED_PATH_TIME_SOURCE_TYPE.RECORD_TRIGGER_EVENT) {
                recordField = timeSource;
                timeSource = SCHEDULED_PATH_TIME_SOURCE_TYPE.RECORD_FIELD;
            }

            if (pathType === SCHEDULED_PATH_TYPE.RUN_ASYNC) {
                delete metadataScheduledPath.label;
                return Object.assign(metadataScheduledPath, {
                    pathType
                });
            }

            const maxBatchSize = scheduledPath.maxBatchSize ? Number(scheduledPath.maxBatchSize) : undefined;

            return Object.assign(metadataScheduledPath, {
                timeSource,
                offsetUnit,
                offsetNumber: offsetNumberAsNumber,
                recordField,
                maxBatchSize
            });
        });
    }

    const schedule = startDate && startTime && frequency ? { startDate, startTime, frequency } : undefined;

    return Object.assign(startElementMetadata, {
        label: undefined,
        name: undefined,
        description: undefined,
        triggerType: triggerType === FLOW_TRIGGER_TYPE.NONE ? undefined : triggerType,
        schedule,
        object: object === '' ? undefined : object,
        objectContainer,
        segment,
        recordTriggerType: recordTriggerType === '' ? undefined : recordTriggerType,
        doesRequireRecordChangedToMeetCriteria,
        filterLogic,
        filters: recordFilters,
        scheduledPaths,
        filterFormula
    });
}

/**
 * @param timeinMillis
 */
function getISOTimeFromMillis(timeinMillis) {
    const date = new Date(timeinMillis);
    // ISO Time is in this format: 2008-09-15T15:53:00Z, and we just care about the latter time portion minus the Z
    return date.toISOString().slice(0, -1).split('T')[1];
}

/**
 * @param startDate
 * @param startTime
 * @param frequency
 */
function getscheduledLabel(startDate, startTime, frequency) {
    let label;
    if (startDate && startTime) {
        const startDateTime = new Date(startDate);
        const parts = startTime.split(':');
        if (parts.length > 1) {
            startDateTime.setUTCHours(parts[0]);
            startDateTime.setUTCMinutes(parts[1]);
        }
        label =
            getDayOfTheWeek(startDateTime) +
            ', ' +
            formatDateTimeUTC(startDateTime) +
            ', ' +
            getFrequencyLabel(frequency);
    }

    return label;
}

/**
 * Get corresponding frequency label
 *
 * @param {string} frequency of start element schedule
 * @returns {string} label of start element frequency
 */
export function getFrequencyLabel(frequency: UI.FlowTriggerFrequency): string {
    switch (frequency) {
        case FLOW_TRIGGER_FREQUENCY.ONCE:
            return LABELS.triggerFrequencyOnce;
        case FLOW_TRIGGER_FREQUENCY.DAILY:
            return LABELS.triggerFrequencyDaily;
        case FLOW_TRIGGER_FREQUENCY.WEEKLY:
            return LABELS.triggerFrequencyWeekly;
        default:
            return '';
    }
}

/**
 * Get corresponding schedule type label
 *
 * @param {UI.FlowTriggerFrequency} frequency of start element schedule
 * @returns {string} label of start element schedule type
 */
export function getScheduleTypeLabel(frequency: UI.FlowTriggerFrequency): string {
    switch (frequency) {
        case FLOW_TRIGGER_FREQUENCY.ONCE:
            return LABELS.scheduleTypeOnce;
        case FLOW_TRIGGER_FREQUENCY.DAILY:
        case FLOW_TRIGGER_FREQUENCY.WEEKLY:
            return LABELS.scheduleTypeRecurring;
        default:
            return '';
    }
}

/**
 * creates UI.ScheduledPath of type SCHEDULED_PATH_TYPE.RUN_ASYNC
 *
 * @param scheduledPath passed in from recordChanegTriggerReducer, always empty, could be removed.
 * @returns instance of UI.ScheduledPath.
 */
export function createRunAsyncScheduledPath(scheduledPath: UI.ScheduledPath): UI.ScheduledPath {
    const newScheduledPath: UI.ChildElement = baseChildElement(scheduledPath, ELEMENT_TYPE.SCHEDULED_PATH);
    const label = LABELS.runAsyncScheduledPathLabel;
    const pathType = SCHEDULED_PATH_TYPE.RUN_ASYNC;
    const name = generateInternalName(pathType);
    return Object.assign(newScheduledPath, {
        name,
        label,
        pathType
    });
}

/**
 * @param scheduledPath
 */
export function createScheduledPath(scheduledPath: UI.ScheduledPath | Metadata.ScheduledPath): UI.ScheduledPath {
    const newScheduledPath: UI.ChildElement = baseChildElement(scheduledPath, ELEMENT_TYPE.SCHEDULED_PATH);

    const { recordField, pathType, maxBatchSize } = <Metadata.ScheduledPath>scheduledPath;

    let { timeSource = '', offsetUnit = '', offsetNumber = '' } = scheduledPath;

    // When converting from scheduledPath to scheduledPath
    if (offsetNumber !== '') {
        let offsetNumberAsNumber = Number(offsetNumber);
        if (offsetUnit === SCHEDULED_PATH_OFFSET_UNIT.HOURS) {
            if (offsetNumberAsNumber >= 0) {
                offsetUnit = TIME_OPTION.HOURS_AFTER;
            } else {
                offsetUnit = TIME_OPTION.HOURS_BEFORE;
                offsetNumberAsNumber *= -1;
            }
        } else if (offsetUnit === SCHEDULED_PATH_OFFSET_UNIT.DAYS) {
            if (offsetNumberAsNumber >= 0) {
                offsetUnit = TIME_OPTION.DAYS_AFTER;
            } else {
                offsetUnit = TIME_OPTION.DAYS_BEFORE;
                offsetNumberAsNumber *= -1;
            }
        } else if (offsetUnit === SCHEDULED_PATH_OFFSET_UNIT.MINUTES) {
            if (offsetNumberAsNumber >= 0) {
                offsetUnit = TIME_OPTION.MINUTES_AFTER;
            } else {
                offsetUnit = TIME_OPTION.MINUTES_BEFORE;
                offsetNumberAsNumber *= -1;
            }
        } else if (offsetUnit === SCHEDULED_PATH_OFFSET_UNIT.MONTHS) {
            if (offsetNumberAsNumber >= 0) {
                offsetUnit = TIME_OPTION.MONTHS_AFTER;
            } else {
                offsetUnit = TIME_OPTION.MONTHS_BEFORE;
                offsetNumberAsNumber *= -1;
            }
        }
        offsetNumber = offsetNumberAsNumber.toString();
    }

    if (timeSource === SCHEDULED_PATH_TIME_SOURCE_TYPE.RECORD_FIELD) {
        timeSource = recordField!;
    }

    return Object.assign(newScheduledPath, {
        timeSource,
        offsetUnit,
        offsetNumber,
        pathType,
        maxBatchSize
    });
}

/**
 * Creates a start element object on closing of any start property editor / when a new flow is opened for the first time which goes to store
 *
 * @param {Object} startElement start element object used to construct the new object
 * @returns {Object} which contains startElement, children and ALC params
 */
export function createStartElementWhenUpdatingFromPropertyEditor(startElement) {
    let newStartElement = createStartElement(startElement);

    if (!shouldSupportScheduledPaths(newStartElement)) {
        // When updating to a start element that doesn't support scheduled paths, replacing the Immediate available connector
        // with a Regular one
        const updatedAvailableConnections = newStartElement.availableConnections.map((availableConnection) => {
            return availableConnection.type === CONNECTOR_TYPE.IMMEDIATE
                ? { type: CONNECTOR_TYPE.REGULAR }
                : availableConnection;
        });

        newStartElement = Object.assign(newStartElement, {
            availableConnections: updatedAvailableConnections
        });

        return {
            canvasElement: newStartElement,
            elementType: ELEMENT_TYPE.START_WITH_MODIFIED_AND_DELETED_SCHEDULED_PATHS,
            shouldSupportScheduledPaths: newStartElement.shouldSupportScheduledPaths,
            startElementGuid: newStartElement.guid
        };
    }

    const { scheduledPaths = [] } = startElement;
    let childReferences: UI.ChildReference[] = [];
    let newScheduledPaths: UI.ScheduledPath[] = [];

    for (let i = 0; i < scheduledPaths.length; i++) {
        const scheduledPath = scheduledPaths[i];
        if (scheduledPath.name) {
            const newScheduledPath = createScheduledPath(scheduledPath);
            childReferences = updateChildReferences(childReferences, newScheduledPath);
            newScheduledPaths = [...newScheduledPaths, newScheduledPath];
        }
    }

    const deletedCanvasElementChildren = getDeletedCanvasElementChildren(startElement, newScheduledPaths);

    const deletedScheduledPathGuids = deletedCanvasElementChildren.map((scheduledPath) => scheduledPath.guid);

    const { defaultConnectorLabel = LABELS.immediateConnectorLabel } = startElement;

    const originalStartElement = getElementByGuid(startElement.guid);

    const { connectorCount, availableConnections } = getConnectionProperties(
        originalStartElement,
        childReferences,
        deletedScheduledPathGuids
    );

    const elementSubtype = startElement.elementSubtype;
    Object.assign(newStartElement, {
        childReferences,
        elementType,
        connectorCount,
        availableConnections,
        defaultConnectorLabel
    });

    return {
        canvasElement: newStartElement,
        deletedChildElementGuids: deletedScheduledPathGuids,
        childElements: newScheduledPaths,
        elementType: ELEMENT_TYPE.START_WITH_MODIFIED_AND_DELETED_SCHEDULED_PATHS,
        elementSubtype,
        shouldSupportScheduledPaths: newStartElement.shouldSupportScheduledPaths,
        startElementGuid: newStartElement.guid
    };
}

/**
 * @param startElement
 */
function calculateMaxConnections(startElement) {
    if (!startElement) {
        throw new Error('Max connection cannot be calculated because startElement is not defined');
    }
    let length = 1;
    if (startElement.scheduledPaths) {
        for (let i = 0; i < startElement.scheduledPaths.length; i++) {
            if (startElement.scheduledPaths[i].name || startElement.scheduledPaths[i].pathType) {
                length++;
            }
        }
    } else if (startElement.childReferences) {
        length = startElement.childReferences.length + 1;
    }
    return length;
}

/**
 * @param availableConnections
 * @param startElement
 * @param type
 */
function addStartElementConnectorToAvailableConnections(
    availableConnections: UI.AvailableConnection[] = [],
    startElement: Metadata.Start,
    type: UI.ConnectorType
) {
    if (!availableConnections || !startElement) {
        throw new Error('Either availableConnections or start Element is not defined');
    }
    const { connector } = startElement;
    if (!connector) {
        return [
            ...availableConnections,
            {
                type
            }
        ];
    }
    return availableConnections;
}

/**
 * @param triggerType
 * @param processType
 */
function getDefaultFilterLogic(triggerType, processType) {
    if (!processType) {
        processType = getProcessType();
    }
    if (
        (processType === FLOW_PROCESS_TYPE.AUTO_LAUNCHED_FLOW || isOrchestrator(processType)) &&
        isRecordChangeTriggerType(triggerType)
    ) {
        return CONDITION_LOGIC.NO_CONDITIONS;
    }
    return CONDITION_LOGIC.AND;
}

/**
 * @param object - The start element object
 * @param triggerType - The triggerType
 * @param newStartElement - The start element
 * @param processType
 */
function getDefaultObjectForOrchestration(
    object: string,
    triggerType: UI.FlowTriggerType,
    newStartElement: UI.Start,
    processType: string | null | undefined
) {
    if (!processType) {
        processType = getProcessType();
    }
    // Only default object to account for a record-triggered orchestration
    // Make sure object is not already set, and confirm that it is new
    if (
        isOrchestrator(processType) &&
        isRecordChangeTriggerType(triggerType) &&
        !object &&
        newStartElement.isNew !== false
    ) {
        object = DEFAULT_ORCHESTRATION_OBJECT;
    }
    return object;
}
