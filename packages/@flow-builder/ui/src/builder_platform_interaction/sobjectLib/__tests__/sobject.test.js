import { mockEntities } from 'mock/serverEntityData';
import { accountFields as mockAccountFields } from 'serverData/GetFieldsForEntity/accountFields.json';
import {
    setEntities,
    getAllEntities,
    getQueryableEntities,
    getCreateableEntities,
    getDeletableEntities,
    getUpdateableEntities,
    getFieldsForEntity,
    fetchFieldsForEntity,
    getEntity
} from 'builder_platform_interaction/sobjectLib';

// Mocking out the fetch function to return Account fields
jest.mock('builder_platform_interaction/serverDataLib', () => {
    return {
        fetchOnce: jest
            .fn()
            .mockImplementation(() => Promise.resolve(mockAccountFields)),
        SERVER_ACTION_TYPE: require.requireActual(
            '../../serverDataLib/serverDataLib.js'
        ).SERVER_ACTION_TYPE
    };
});

describe('SObject Lib Tests', () => {
    describe('Set Entities Tests', () => {
        it('Set Null Entities', () => {
            expect(() => {
                setEntities();
            }).not.toThrow();
        });

        it('Set Entities', () => {
            setEntities(JSON.stringify(mockEntities));
        });
    });

    describe('Get Entity Types Tests', () => {
        it('Get All Entities', () => {
            expect(getAllEntities()).toHaveLength(
                Object.keys(mockEntities).length
            );
        });

        it('Get Queryable Entities', () => {
            const queryableEntities = getQueryableEntities();
            expect(queryableEntities).toContainEqual(
                expect.objectContaining({ apiName: 'AcceptedEventRelation' })
            );
            expect(queryableEntities).toContainEqual(
                expect.objectContaining({ apiName: 'Account' })
            );
            expect(queryableEntities).not.toContainEqual(
                expect.objectContaining({ apiName: 'AccountChangeEvent' })
            );
        });

        it('Get Creatable Entities', () => {
            const createableEntities = getCreateableEntities();
            expect(createableEntities).toContainEqual(
                expect.objectContaining({ apiName: 'Account' })
            );
            expect(createableEntities).not.toContainEqual(
                expect.objectContaining({ apiName: 'AcceptedEventRelation' })
            );
        });

        it('Get Deletable Entities', () => {
            const deletableEntities = getDeletableEntities();
            expect(deletableEntities).toContainEqual(
                expect.objectContaining({ apiName: 'Account' })
            );
            expect(deletableEntities).not.toContainEqual(
                expect.objectContaining({ apiName: 'AcceptedEventRelation' })
            );
        });

        it('Get Updatable Entities', () => {
            const updateableEntities = getUpdateableEntities();
            expect(updateableEntities).toContainEqual(
                expect.objectContaining({ apiName: 'Account' })
            );
            expect(updateableEntities).not.toContainEqual(
                expect.objectContaining({ apiName: 'AcceptedEventRelation' })
            );
        });
        it('Get existing entity description', () => {
            const entity = getEntity('Account');
            expect(entity).toBeDefined();
            expect(entity.apiName).toEqual('Account');
        });
        it('Get unexisting entity description', () => {
            const entity = getEntity('UnknownEntity');
            expect(entity).toBeUndefined();
        });
    });

    describe('fetchFieldsForEntity', () => {
        it('Returns fields for the entity', async () => {
            const fields = await fetchFieldsForEntity('Account');
            expect(Object.keys(fields)).toHaveLength(
                Object.keys(mockAccountFields).length
            );
        });
    });

    describe('getFieldsForEntity', () => {
        it('Verify Fields Returned', () => {
            const fields = getFieldsForEntity('Account');
            expect(Object.keys(fields)).toHaveLength(
                Object.keys(mockAccountFields).length
            );
        });
    });
});
