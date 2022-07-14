import actionSectionLabel from '@salesforce/label/AlcConnectorContextualMenu.actionSectionLabel';
import deleteGoToPathItemLabel from '@salesforce/label/AlcConnectorContextualMenu.deleteGoToPathItemLabel';
import goToPathItemLabel from '@salesforce/label/AlcConnectorContextualMenu.goToPathItemLabel';
import loadingResultsText from '@salesforce/label/AlcConnectorContextualMenu.loadingResultsText';
import menuHeader from '@salesforce/label/AlcConnectorContextualMenu.menuHeader';
import noResultsFoundText from '@salesforce/label/AlcConnectorContextualMenu.noResultsFoundText';
import pasteMultiItemLabel from '@salesforce/label/AlcConnectorContextualMenu.pasteMultiItemLabel';
import pasteOneItemLabel from '@salesforce/label/AlcConnectorContextualMenu.pasteOneItemLabel';
import reRouteGoToPathItemLabel from '@salesforce/label/AlcConnectorContextualMenu.reRouteGoToPathItemLabel';
import searchInputLabel from '@salesforce/label/AlcConnectorContextualMenu.searchInputLabel';
import searchInputPlaceholder from '@salesforce/label/AlcConnectorContextualMenu.searchInputPlaceholder';

export const labelsMap = {
    menuHeader,
    actionSectionLabel,
    pasteMultiItemLabel,
    pasteOneItemLabel,
    goToPathItemLabel,
    reRouteGoToPathItemLabel,
    deleteGoToPathItemLabel,
    searchInputLabel,
    searchInputPlaceholder,
    loadingResultsText,
    noResultsFoundText
};

export const LABELS: Labels<typeof labelsMap> = labelsMap;
