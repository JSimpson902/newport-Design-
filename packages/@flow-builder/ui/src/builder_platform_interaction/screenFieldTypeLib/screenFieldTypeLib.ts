import { logPerfTransactionStart, logPerfTransactionEnd } from 'builder_platform_interaction/loggingUtils';
import { SERVER_ACTION_TYPE, fetchOnce } from 'builder_platform_interaction/serverDataLib';
import { orgHasFlowScreenSections } from 'builder_platform_interaction/contextLib';
import { getSectionFieldType } from 'builder_platform_interaction/screenEditorUtils';

const SCREEN_FIELD_TYPES = 'SCREEN_FIELD_TYPES';

/**
 * Get the supported screen field types
 */
export function getSupportedScreenFieldTypes(flowProcessType: string, flowTriggerType: string): Promise<any> {
    logPerfTransactionStart(SCREEN_FIELD_TYPES, null, null);
    const param = { flowProcessType, flowTriggerType };
    return fetchOnce(SERVER_ACTION_TYPE.GET_SUPPORTED_SCREEN_FIELD_TYPES, param)
        .then(data => {
            logPerfTransactionEnd(
                SCREEN_FIELD_TYPES,
                {
                    numOfScreenFieldTypes: data.length
                },
                null
            );

            if (orgHasFlowScreenSections()) {
                return data;
            }

            // if flowSectionsAndColumns perm is off, remove section from supported screen field types
            // so that it will not show up in the screen left palette
            const sectionFieldType = getSectionFieldType().fieldType;
            return data.filter(type => type.name !== sectionFieldType);
        })
        .catch((/* error */) => {
            // Handle error case here if something is needed beyond our automatic generic error modal popup
        });
}
