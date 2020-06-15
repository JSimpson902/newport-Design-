// @ts-nocheck
export const BUILDER_MODE = {
    EDIT_MODE: 'editMode',
    DEBUG_MODE: 'debugMode'
};

let builderType;

export function setBuilderType(value) {
    builderType = value;
}

export const getBuilderType = () => builderType;
