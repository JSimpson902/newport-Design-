import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';

export const MAP_COMPATIBLE_TYPES = [FLOW_DATA_TYPE.SOBJECT.value];

export interface MapElement {
    collectionReference: { value: string | null; error: string | null };
    assignNextValueToReference: { value: string | null; error: string | null };
    outputSObjectType: { value: string | null; error: string | null };
    mapItems: [];
}

export const DEFAULT_OUTPUT_TYPE = 'Recommendation';
