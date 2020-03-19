const chalk = require('chalk');
const {
    checkP4Env,
    getPomProperty,
    getProjectPomProperties,
    getCorePomProperties,
    POM_PROPERTIES_TO_CHECK
} = require('./utils');

/**
 * Check if pom.xml's dependencies are in sync with whats in core
 *
 * Usage: node ./scrits/checkPom.js
 */

function checkProperty(property, projectPomProperties, corePomProperties) {
    const projectValue = getPomProperty(property, projectPomProperties);
    const coreValue = getPomProperty(property, corePomProperties);
    if (projectValue !== coreValue) {
        console.log(chalk.red(`Warning: ${property} is out of sync with core: ${coreValue} vs ${projectValue}`));
        return false;
    }
    return true;
}

async function checkProjectPomProperties() {
    try {
        const projectPomProperties = await getProjectPomProperties();
        const corePomProperties = await getCorePomProperties();

        const hasErrors = !POM_PROPERTIES_TO_CHECK.every(property =>
            checkProperty(property, projectPomProperties, corePomProperties)
        );

        if (hasErrors) {
            console.log(chalk.red('\nRun `yarn update:syncPomToCore` to update.'));
        } else {
            console.log(chalk.green('pom.xml in sync with core'));
        }
        process.exit(hasErrors ? 1 : 0);
    } catch (e) {
        console.log(chalk.red(`Error while checking pom properties : ${e.message}`));
        process.exit(1);
    }
}

console.log('Checking pom.xml ...');
checkProjectPomProperties();
