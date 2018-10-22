import systemVariableCategory from '@salesforce/label/FlowBuilderSystemVariables.systemVariableCategory';

export const SYSTEM_VARIABLE_PREFIX = '$Flow';

let systemVariables = {};

/**
 * Converts serialized FlowSystemVariablesEnums to a form usable by menus.
 *
 * @param {Array}
 *            data raw variable data from the server
 */
const convertData = (data) => data.reduce((acc, obj) => {
    const name = `${SYSTEM_VARIABLE_PREFIX}.${obj.devName}`;
    const variable = Object.assign(obj, {
        category: systemVariableCategory,
        apiName: obj.devName,
        dataType: obj.dataType,
        guid: name,
        label: obj.devName,
        name
    });
    delete variable.devName;

    acc[name] = variable;
    return acc;
}, {});

/**
 * Sets the system variables. This should be done during app initialization.
 *
 * @param {Object}
 *            data the data returned by the service
 */
export const setSystemVariables = (data) => {
    const parsedVariables = JSON.parse(data);
    if (Array.isArray(parsedVariables)) {
        systemVariables = convertData(parsedVariables);
    }
};

/**
 * Gets all available system variables. Should be used after
 * fetchAllSystemVariables completes.
 *
 * @returns {Object} system variables usable in menus
 */
export const getSystemVariables = () => {
    return systemVariables;
};