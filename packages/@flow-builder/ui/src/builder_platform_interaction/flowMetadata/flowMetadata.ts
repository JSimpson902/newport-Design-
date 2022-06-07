export const START_ELEMENT_LOCATION = {
    x: 50,
    y: 50
};

export const DECORATION_TYPE = {
    ERROR: 'ERROR'
};

export const RECORD_TIGGER_EVENT = 'RecordTriggerEvent';

export const FLOW_PROCESS_TYPE = {
    ACTION_CADENCE_FLOW: 'ActionCadenceFlow',
    ACTION_PLAN: 'ActionPlan',
    APPOINTMENTS: 'Appointments',
    AUTO_LAUNCHED_FLOW: 'AutoLaunchedFlow',
    ORCHESTRATOR: 'Orchestrator',
    CHECKOUT_FLOW: 'CheckoutFlow',
    CONTACT_REQUEST_FLOW: 'ContactRequestFlow',
    CUSTOM_EVENT: 'CustomEvent',
    DIGITAL_FORM: 'DigitalForm',
    FIELD_SERVICE_MOBILE: 'FieldServiceMobile',
    FIELD_SERVICE_WEB: 'FieldServiceWeb',
    FLOW: 'Flow',
    FORM: 'Form',
    INVOCABLE_PROCESS: 'InvocableProcess',
    LOGIN_FLOW: 'LoginFlow',
    JOURNEY_BUILDER_INTEGRATION: 'JourneyBuilderIntegration',
    JOURNEY: 'Journey',
    MANAGED_CONTENT_FLOW: 'ManagedContentFlow',
    ORCHESTRATION_FLOW: 'OrchestrationFlow',
    SURVEY: 'Survey',
    TRANSACTION_SECURITY_FLOW: 'TransactionSecurityFlow',
    USER_PROVISIONING_FLOW: 'UserProvisioningFlow',
    WORKFLOW: 'Workflow',
    SALES_ENTRY_EXPERIENCE_FLOW: 'SalesEntryExperienceFlow',
    FSCLENDING: 'FSCLending',
    ROUTING_FLOW: 'RoutingFlow',
    RECOMMENDATION_STRATEGY: 'RecommendationStrategy',
    EVALUATION_FLOW: 'EvaluationFlow',
    CMS_ORCHESTRATOR: 'CMSOrchestrator'
};

export enum ELEMENT_TYPE {
    EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
    ACTION_CALL = 'ActionCall',
    ASSIGNMENT = 'Assignment',
    VARIABLE = 'Variable',
    DECISION = 'Decision',
    DECISION_WITH_MODIFIED_AND_DELETED_OUTCOMES = 'DECISION_WITH_MODIFIED_AND_DELETED_OUTCOMES',
    APEX_PLUGIN_CALL = 'ApexPlugin',
    APEX_CALL = 'APEX_CALL',
    EMAIL_ALERT = 'EMAIL_ALERT',
    CHOICE = 'Choice',
    CONSTANT = 'Constant',
    RECORD_CHOICE_SET = 'DynamicChoice',
    COLLECTION_CHOICE_SET = 'CollectionChoiceSet',
    PICKLIST_CHOICE_SET = 'PicklistChoice',
    FORMULA = 'Formula',
    STAGE = 'Stage',
    TEXT_TEMPLATE = 'TextTemplate',
    LOOP = 'Loop',
    COLLECTION_PROCESSOR = 'CollectionProcessor',
    OUTCOME = 'OUTCOME',
    SCHEDULED_PATH = 'ScheduledPath',
    START_WITH_MODIFIED_AND_DELETED_SCHEDULED_PATHS = 'START_WITH_MODIFIED_AND_DELETED_SCHEDULED_PATHS',
    RECORD_CREATE = 'RecordCreate',
    RECORD_DELETE = 'RecordDelete',
    RECORD_LOOKUP = 'RecordQuery',
    RECORD_UPDATE = 'RecordUpdate',
    SCREEN = 'Screen',
    STEP = 'Step',
    SUBFLOW = 'Subflow',
    START_ELEMENT = 'START_ELEMENT',
    START_ON_DML = 'START_ON_DML',
    ROOT_ELEMENT = 'root',
    END_ELEMENT = 'END_ELEMENT',
    WAIT = 'Wait',
    WAIT_WITH_MODIFIED_AND_DELETED_WAIT_EVENTS = 'WAIT_WITH_MODIFIED_AND_DELETED_WAIT_EVENTS',
    WAIT_EVENT = 'WAIT_EVENT',
    FLOW_PROPERTIES = 'FLOW_PROPERTIES',
    SCREEN_FIELD = 'SCREEN_FIELD',
    SCREEN_WITH_MODIFIED_AND_DELETED_SCREEN_FIELDS = 'SCREEN_WITH_MODIFIED_AND_DELETED_SCREEN_FIELDS',
    ORCHESTRATED_STAGE = 'OrchestratedStage',
    ORCHESTRATED_STAGE_WITH_MODIFIED_AND_DELETED_STEPS = 'ORCHESTRATED_STAGE_WITH_MODIFIED_AND_DELETED_STEPS',
    STAGE_STEP = 'STAGE_STEP',
    ROLLBACK = 'RecordRollback',
    DEFAULT = 'defaultElement',
    FLOW_TEST_EDITOR = 'FLOW_TEST_EDITOR'
}

export const FOOTER_LABEL_TYPE = {
    STANDARD: 'standard',
    CUSTOM: 'custom',
    HIDE: 'hide'
};

export const PAUSE_MESSAGE_TYPE = {
    STANDARD: 'standard',
    CUSTOM: 'custom'
};

export const CONNECTOR_TYPE = {
    REGULAR: 'REGULAR',
    FAULT: 'FAULT',
    DEFAULT: 'DEFAULT',
    LOOP_NEXT: 'LOOP_NEXT',
    LOOP_END: 'LOOP_END',
    IMMEDIATE: 'IMMEDIATE'
};

export const SUB_ELEMENT_TYPE = {
    ASSIGNMENT_ITEM: 'ASSIGNMENT_ITEM',
    CONDITION: 'CONDITION',
    RECORD_LOOKUP_FILTER_ITEM: 'RECORD_LOOKUP_FILTER_ITEM',
    RECORD_LOOKUP_FIELD: 'RECORD_LOOKUP_FIELD'
};

export enum ACTION_TYPE {
    APEX = 'apex',
    EMAIL_ALERT = 'emailAlert',
    QUICK_ACTION = 'quickAction',
    FLOW = 'flow',
    COMPONENT = 'component',
    EXTERNAL_SERVICE = 'externalService',
    STEP_INTERACTIVE = 'stepInteractive',
    STEP_BACKGROUND = 'stepBackground',
    OUTBOUND_MESSAGE = 'outboundMessage',
    EVALUATION_FLOW = 'evaluationFlow'
}

export const ICONS = {
    interactiveStep: 'standard:marketing_actions',
    backgroundStep: 'standard:flow',
    closeStepMenu: 'utility:close',
    openStepMenu: 'utility:add'
};

export const METADATA_KEY = {
    START: 'start',
    ACTION_CALLS: 'actionCalls',
    APEX_PLUGIN_CALLS: 'apexPluginCalls',
    ASSIGNMENTS: 'assignments',
    DECISIONS: 'decisions',
    WAITS: 'waits',
    FORMULAS: 'formulas',
    VARIABLES: 'variables',
    CONSTANTS: 'constants',
    TEXT_TEMPLATES: 'textTemplates',
    SUBFLOWS: 'subflows',
    RECORD_CREATES: 'recordCreates',
    RECORD_LOOKUPS: 'recordLookups',
    RECORD_DELETES: 'recordDeletes',
    RECORD_UPDATES: 'recordUpdates',
    LOOPS: 'loops',
    COLLECTION_PROCESSORS: 'collectionProcessors',
    SCREENS: 'screens',
    STAGES: 'stages',
    CHOICES: 'choices',
    STEPS: 'steps',
    DYNAMIC_CHOICE_SETS: 'dynamicChoiceSets',
    ORCHESTRATED_STAGES: 'orchestratedStages',
    ROLLBACKS: 'recordRollbacks'
};

export const UI_ELEMENT_TYPE_TO_RULE_ELEMENT_TYPE = {
    [ELEMENT_TYPE.ACTION_CALL]: 'ACTIONCALL',
    [ELEMENT_TYPE.ASSIGNMENT]: 'ASSIGNMENT',
    [ELEMENT_TYPE.VARIABLE]: 'VARIABLE',
    [ELEMENT_TYPE.DECISION]: 'DECISION',
    [ELEMENT_TYPE.APEX_PLUGIN_CALL]: 'APEXPLUGIN',
    [ELEMENT_TYPE.APEX_CALL]: 'ACTIONCALL',
    [ELEMENT_TYPE.EMAIL_ALERT]: 'ACTIONCALL',
    [ELEMENT_TYPE.CHOICE]: 'CHOICE',
    [ELEMENT_TYPE.CONSTANT]: 'CONSTANT',
    [ELEMENT_TYPE.RECORD_CHOICE_SET]: 'CHOICELOOKUP',
    [ELEMENT_TYPE.COLLECTION_CHOICE_SET]: 'CHOICELOOKUP',
    [ELEMENT_TYPE.PICKLIST_CHOICE_SET]: 'CHOICELOOKUP',
    [ELEMENT_TYPE.FORMULA]: 'FORMULA',
    [ELEMENT_TYPE.STAGE]: 'STAGE',
    [ELEMENT_TYPE.TEXT_TEMPLATE]: 'TEXTTEMPLATE',
    [ELEMENT_TYPE.LOOP]: 'LOOP',
    [ELEMENT_TYPE.COLLECTION_PROCESSOR]: 'COLLECTIONPROCESSOR',
    [ELEMENT_TYPE.RECORD_CREATE]: 'RECORDCREATE',
    [ELEMENT_TYPE.RECORD_DELETE]: 'RECORDDELETE',
    [ELEMENT_TYPE.RECORD_LOOKUP]: 'RECORDQUERY',
    [ELEMENT_TYPE.RECORD_UPDATE]: 'RECORDUPDATE',
    [ELEMENT_TYPE.SCREEN]: 'SCREEN',
    [ELEMENT_TYPE.SCREEN_FIELD]: 'SCREENFIELD',
    [ELEMENT_TYPE.STEP]: 'STEP',
    [ELEMENT_TYPE.SUBFLOW]: 'SUBFLOW',
    [ELEMENT_TYPE.WAIT]: 'WAIT',
    [ELEMENT_TYPE.START_ELEMENT]: 'START',
    [ELEMENT_TYPE.START_ON_DML]: 'START',
    [ELEMENT_TYPE.ROLLBACK]: 'RECORDROLLBACK'
};

/**
 * AND and OR are flow values which are used by the backend as well as being as used
 * on the frontend (combobox values).  CUSTOM_LOGIC is used only by the frontend as a
 * combobox value
 *
 * @type {{AND: string, OR: string, ALWAYS: string, CUSTOM_LOGIC: string, FORMULA: string}}
 */
export const CONDITION_LOGIC = {
    AND: 'and',
    OR: 'or',
    CUSTOM_LOGIC: 'custom_logic',
    NO_CONDITIONS: 'no_conditions',
    FORMULA: 'formula_evaluates_to_true'
};

// Property names in wait event
export const WAIT_EVENT_FIELDS = {
    INPUT_PARAMETERS: 'inputParameters',
    OUTPUT_PARAMETERS: 'outputParameters'
};

/**
 * The time event types of wait events. For time events, these can be either absolute (alarmEvent)
 * or direct record time (dateRefAlarmEvent)
 *
 * @typedef {string} WaitTimeEventType
 */
export const WAIT_TIME_EVENT_TYPE = {
    ABSOLUTE_TIME: 'AlarmEvent',
    DIRECT_RECORD_TIME: 'DateRefAlarmEvent'
};

/**
 * Acceptable values for wait time offset units
 *
 * @type {{hours, days}}
 */
export const WAIT_TIME_EVENT_OFFSET_UNIT = {
    HOURS: 'Hours',
    DAYS: 'Days'
};

export const TIME_OPTION = {
    DAYS_AFTER: 'DaysAfter',
    DAYS_BEFORE: 'DaysBefore',
    HOURS_AFTER: 'HoursAfter',
    HOURS_BEFORE: 'HoursBefore',
    MINUTES_AFTER: 'MinutesAfter',
    MINUTES_BEFORE: 'MinutesBefore',
    MONTHS_AFTER: 'MonthsAfter',
    MONTHS_BEFORE: 'MonthsBefore'
};

/**
 * Acceptable values for Schedule Path offset units
 *
 * @type {{hours, days}}
 */
export const SCHEDULED_PATH_OFFSET_UNIT = {
    DAYS: 'Days',
    HOURS: 'Hours',
    MINUTES: 'Minutes',
    MONTHS: 'Months'
};

export const SCHEDULED_PATH_TIME_SOURCE_TYPE = {
    RECORD_FIELD: 'RecordField',
    RECORD_TRIGGER_EVENT: 'RecordTriggerEvent'
};

/**
 * All the input and output parameter names for various event types.
 * Note: We might need additional parameters for standard event.
 * TODO: W-5531948 once we fetch the event parameters from service we might not need it.
 */
export const WAIT_TIME_EVENT_PARAMETER_NAMES = {
    ABSOLUTE_BASE_TIME: 'AlarmTime',
    SALESFORCE_OBJECT: 'TimeTableColumnEnumOrId',
    DIRECT_RECORD_BASE_TIME: 'TimeFieldColumnEnumOrId',
    RECORD_ID: 'EntityObjectId',
    EVENT_DELIVERY_STATUS: 'Status',
    RESUME_TIME: 'AlarmTime',
    OFFSET_NUMBER: 'TimeOffset',
    OFFSET_UNIT: 'TimeOffsetUnit'
};

/**
 * Map of input and output parameter names for an event type.
 * Note: We might need additional info for standard event type.
 * TODO: W-5531948 once we fetch the event parameters from service we might not need it.
 */
export const WAIT_TIME_EVENT_FIELDS = {
    [WAIT_TIME_EVENT_TYPE.ABSOLUTE_TIME]: {
        [WAIT_EVENT_FIELDS.INPUT_PARAMETERS]: [
            WAIT_TIME_EVENT_PARAMETER_NAMES.ABSOLUTE_BASE_TIME,
            WAIT_TIME_EVENT_PARAMETER_NAMES.OFFSET_NUMBER,
            WAIT_TIME_EVENT_PARAMETER_NAMES.OFFSET_UNIT
        ],
        [WAIT_EVENT_FIELDS.OUTPUT_PARAMETERS]: [
            WAIT_TIME_EVENT_PARAMETER_NAMES.RESUME_TIME,
            WAIT_TIME_EVENT_PARAMETER_NAMES.EVENT_DELIVERY_STATUS
        ]
    },
    [WAIT_TIME_EVENT_TYPE.DIRECT_RECORD_TIME]: {
        [WAIT_EVENT_FIELDS.INPUT_PARAMETERS]: [
            WAIT_TIME_EVENT_PARAMETER_NAMES.SALESFORCE_OBJECT,
            WAIT_TIME_EVENT_PARAMETER_NAMES.DIRECT_RECORD_BASE_TIME,
            WAIT_TIME_EVENT_PARAMETER_NAMES.RECORD_ID,
            WAIT_TIME_EVENT_PARAMETER_NAMES.OFFSET_NUMBER,
            WAIT_TIME_EVENT_PARAMETER_NAMES.OFFSET_UNIT
        ],
        [WAIT_EVENT_FIELDS.OUTPUT_PARAMETERS]: [
            WAIT_TIME_EVENT_PARAMETER_NAMES.RESUME_TIME,
            WAIT_TIME_EVENT_PARAMETER_NAMES.EVENT_DELIVERY_STATUS
        ]
    }
};

/**
 * List of Flow metadata fields that can be references to other Flow elements
 * i.e. fields whose values need to be converted from dev names to GUIDs when loading the flow into the UI client and vice versa.
 */
export const REFERENCE_FIELDS = new Set([
    'elementReference',
    'targetReference',
    'assignToReference',
    'assignRecordIdToReference',
    'leftValueReference',
    'childReference',
    'source',
    'target',
    'leftHandSide',
    'rightHandSide', // rightHandSide is a reference when used in output assignments, like in Get Records
    'assignNextValueToReference',
    'collectionReference',
    'outputReference',
    'inputReference',
    'choiceReference',
    'defaultSelectedChoiceReference',
    'objectFieldReference',
    'assignee'
]);

/**
 * List of Flow metadata fields that can contain {!reference} tags referencing flow elements
 * These would also need to be replaced
 */
export const TEMPLATE_FIELDS = new Set([
    'stringValue', // field of a ferov
    'expression', // represents body of a formula
    'text', // represents body of a text template
    'fieldText', // body of screen field of type Display Text
    'helpText', // help text for a screen or screen field
    'pausedText', // Paused text for screens
    'interviewLabel', // interview label for the flow properties
    'errorMessage', // errorMessage field in validationRule Object for choice editor and screenField
    'formulaExpression', // used in validation Rule Object for choice editor and screenField
    'choiceText', // used in Choice Editor
    'promptText', // used in Choice Editor
    'formula' // represents body of a formula in collection processor filter node
]);

export const EXPRESSION_RE = /\{!([^}]+)\}/g;

export const FLOW_STATUS = {
    ACTIVE: 'Active',
    ACTIVATING: 'Activating',
    DEACTIVATING: 'Deactivating',
    DRAFT: 'Draft',
    INVALID_DRAFT: 'InvalidDraft',
    OBSOLETE: 'Obsolete',
    SAVED: 'Saved',
    SAVING: 'Saving'
};

export const FLOW_SUPPORTED_FEATURES = {
    CONDITIONAL_FIELD_VISIBILITY: 'ConditionalFieldVisibility',
    CONFIGURABLE_START: 'ConfigurableStart'
};

export enum FLOW_TRIGGER_TYPE {
    SCHEDULED = 'Scheduled',
    SCHEDULED_JOURNEY = 'ScheduledJourney',
    BEFORE_SAVE = 'RecordBeforeSave',
    BEFORE_DELETE = 'RecordBeforeDelete',
    AFTER_SAVE = 'RecordAfterSave',
    PLATFORM_EVENT = 'PlatformEvent',
    NONE = 'None'
}

export const FORMULA_TYPE = {
    FLOW_ENTRY_CRITERIA: 'flowEntryCriteria',
    FLOW_FORMULA: 'flowFormula'
};

export const FLOW_TRIGGER_SAVE_TYPE = {
    UPDATE: 'Update',
    CREATE: 'Create',
    CREATE_AND_UPDATE: 'CreateAndUpdate',
    DELETE: 'Delete'
};

export const FLOW_TRIGGER_FREQUENCY = {
    ONCE: 'Once',
    DAILY: 'Daily',
    WEEKLY: 'Weekly'
};

export enum FLOW_TRANSACTION_MODEL {
    AUTOMATIC = 'Automatic',
    NEW_TRANSACTION = 'NewTransaction',
    CURRENT_TRANSACTION = 'CurrentTransaction'
}

export const EXECUTE_OUTCOME_WHEN_OPTION_VALUES = {
    EVERY_TIME_CONDITION_MET: 'trueEveryTime',
    ONLY_WHEN_CHANGES_MEET_CONDITIONS: 'trueOnChangeOnly'
};

export const START_ELEMENT_FIELDS = {
    TRIGGER_TYPE: 'triggerType',
    TRIGGER_SAVE_TYPE: 'recordTriggerType',
    FREQUENCY: 'frequency',
    START_DATE: 'startDate',
    START_TIME: 'startTime',
    FILTER_LOGIC: 'filterLogic',
    FILTER_FORMULA: 'filterFormula',
    IS_RUN_ASYNC_PATH_ENABLED: 'runAsync',
    REQUIRE_RECORD_CHANGE: 'doesRequireRecordChangedToMeetCriteria'
};

export const FLOW_ENVIRONMENT = {
    SLACK: 'Slack',
    DEFAULT: 'Default'
};

export enum COLLECTION_PROCESSOR_SUB_TYPE {
    SORT = 'SortCollectionProcessor',
    MAP = 'RecommendationMapCollectionProcessor',
    FILTER = 'FilterCollectionProcessor'
}

export const SCHEDULED_PATH_TYPE = {
    RUN_ASYNC: 'AsyncAfterCommit',
    IMMEDIATE_SCHEDULED_PATH: 'RunImmediately'
};

export const RECOMMENDATION_STRATEGY = {
    OBJECT_NAME: 'Recommendation',
    OUTPUT_RECOMMENDATIONS_VARIABLE: 'outputRecommendations',
    RECORD_ID_VARIABLE: 'recordId'
};

export enum FlowScreenFieldType {
    InputField = 'InputField',
    LargeTextArea = 'LargeTextArea',
    PasswordField = 'PasswordField',
    DropdownBox = 'DropdownBox',
    RadioButtons = 'RadioButtons',
    MultiSelectCheckboxes = 'MultiSelectCheckboxes',
    MultiSelectPicklist = 'MultiSelectPicklist',
    DisplayText = 'DisplayText',
    RegionContainer = 'RegionContainer',
    Region = 'Region',
    ObjectProvided = 'ObjectProvided',
    ComponentInstance = 'ComponentInstance'
}

export enum RECORD_UPDATE_WAY_TO_FIND_RECORDS {
    TRIGGERING_RECORD = 'triggeringRecord',
    SOBJECT_REFERENCE = 'sObjectReference',
    RECORD_LOOKUP = 'recordLookup'
}

export enum FlowComparisonOperator {
    Equals = 'EqualTo',
    DoesNotEqual = 'NotEqualTo',
    GreaterThan = 'GreaterThan',
    LessThan = 'LessThan',
    GreaterThanOrEqualTo = 'GreaterThanOrEqualTo',
    LessThanOrEqualTo = 'LessThanOrEqualTo',
    StartsWith = 'StartsWith',
    EndsWith = 'EndsWith',
    Contains = 'Contains',
    IsNull = 'IsNull',
    WasSet = 'WasSet',
    WasSelected = 'WasSelected',
    WasVisited = 'WasVisited',
    IsChanged = 'IsChanged',
    In = 'In',
    NotIn = 'NotIn'
}

export enum EntryCriteria {
    ON_STAGE_START = 'on_stage_start',
    ON_STEP_COMPLETE = 'on_step_complete',
    ON_DETERMINATION_COMPLETE = 'on_determination_complete'
}

export enum ExitCriteria {
    ON_STEP_COMPLETE = 'on_step_complete',
    ON_DETERMINATION_COMPLETE = 'on_determination_complete'
}

export enum StageExitCriteria {
    ON_STEP_COMPLETE = 'on_step_complete',
    ON_DETERMINATION_COMPLETE = 'on_determination_complete'
}

/**
 * @param elementType
 */
export function isSystemElement(elementType) {
    switch (elementType) {
        case ELEMENT_TYPE.ROOT_ELEMENT:
        case ELEMENT_TYPE.START_ELEMENT:
        case ELEMENT_TYPE.END_ELEMENT:
            return true;
        default:
            return false;
    }
}

/**
 * @param element
 */
export function isSectionOrColumn(element) {
    return (
        element.elementType === ELEMENT_TYPE.SCREEN_FIELD &&
        (element.fieldType === FlowScreenFieldType.RegionContainer || element.fieldType === FlowScreenFieldType.Region)
    );
}

/**
 * @param element
 */
export function isScheduledPath(element) {
    return element.elementType === ELEMENT_TYPE.SCHEDULED_PATH;
}

/**
 * @param metadata
 * @param startElementReference
 * @param callback
 */
export function forEachMetadataFlowElement(metadata, startElementReference, callback) {
    const metadataKeys = Object.values(METADATA_KEY);
    for (let i = 0, metadataKeysLen = metadataKeys.length; i < metadataKeysLen; i++) {
        const metadataKey = metadataKeys[i];

        let metadataElements;
        // Checking if we have a startElementReference. If we do then create a dummy start element so the overlap code will work
        if (metadataKey === METADATA_KEY.START) {
            metadataElements = [getStartElementFromMetadata(metadata, startElementReference)];
        } else {
            metadataElements = metadata[metadataKey];
        }
        const metadataElementsLen = metadataElements ? metadataElements.length : 0;
        for (let j = 0; j < metadataElementsLen; j++) {
            const metadataElement = metadataElements[j];
            callback(metadataElement, metadataKey);
        }
    }
}

/**
 * gets start element from metadata. handles old flows where the start Element did not exist, it was just a reference.
 *
 * @param metadata retrieved from the backedn
 * @param startElementReference reference to the start node. in older flows there was no start element.
 */
export function getStartElementFromMetadata(metadata, startElementReference) {
    if (startElementReference) {
        return dummyStartElement(startElementReference);
    }
    return metadata[METADATA_KEY.START];
}

/**
 * @param startElementReference
 */
function dummyStartElement(startElementReference: string): object {
    return {
        connector: { targetReference: startElementReference },
        locationX: START_ELEMENT_LOCATION.x,
        locationY: START_ELEMENT_LOCATION.y
    };
}

/**
 * Map of action type to element type conversion.
 */
export const ACTION_TYPE_TO_ELEMENT_TYPE = {
    [ACTION_TYPE.APEX]: ELEMENT_TYPE.APEX_CALL,
    [ACTION_TYPE.EMAIL_ALERT]: ELEMENT_TYPE.EMAIL_ALERT
};
