// @ts-nocheck
import { autolaunchedFlowUIModel } from './autolaunchedFlowUIModel';
export * from './autolaunchedFlowUIModel';

export const getElementByName = name => {
    const elements = autolaunchedFlowUIModel.elements;
    for (const guid in elements) {
        if (elements.hasOwnProperty(guid)) {
            if (elements[guid].name === name) {
                return elements[guid];
            }
        }
    }
    return undefined;
};

export const waitEvent1 = getElementByName('waitEvent1');
export const actionPostToChatter = getElementByName('postToChatter');

export const accountVariable = getElementByName('accountVariable');
export const accountsCollectionVariable = getElementByName('accounts');
export const textCollection = getElementByName('textCollection');
export const textVariable = getElementByName('textVariable');
export const loopAccountAutomaticOutput = getElementByName('loopAccountAutomaticOutput');
export const loopOnTextCollectionManualOutput = getElementByName('loopOnTextCollection');
export const loopOnTextCollectionAutomaticOutput = getElementByName('loopOnTextAutomaticOutput');
export const loopOnApexTypeCollectionAutoOutput = getElementByName('loopOnApexTypeCollectionAutoOutput');
