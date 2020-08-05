// @ts-nocheck
/**
 * @enum {string} SOBJECT_OR_SOBJECT_COLLECTION_FILTER
 */
export const SOBJECT_OR_SOBJECT_COLLECTION_FILTER = {
    SOBJECT: 'SOBJECT',
    SOBJECT_COLLECTION: 'SOBJECT_COLLECTION',
    SOBJECT_OR_SOBJECT_COLLECTION: 'SOBJECT_OR_SOBJECT_COLLECTION'
};

export const getSObjectOrSObjectCollectionFilter = (isCollection) => {
    return isCollection
        ? SOBJECT_OR_SOBJECT_COLLECTION_FILTER.SOBJECT_COLLECTION
        : SOBJECT_OR_SOBJECT_COLLECTION_FILTER.SOBJECT;
};
