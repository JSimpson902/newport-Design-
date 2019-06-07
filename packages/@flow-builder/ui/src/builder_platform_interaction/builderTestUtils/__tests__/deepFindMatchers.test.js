import { deepFind, deepFindCommonElement } from '../deepFindMatchers';

describe('deepFindMatchers', () => {
    describe('deepFind', () => {
        it('returns undefined if element is not found', () => {
            expect(deepFind({ a : 1, b : 2, c : 3}, 4)).toBeUndefined();
        });
        it('can find value in an object', () => {
            expect(deepFind({ a : 1, b : 2, c : 3}, 3)).toBe('object.c');
        });
        it('can find undefined value in an object', () => {
            expect(deepFind({ a : 1, b : 2, c : 3, d: undefined }, undefined)).toBe('object.d');
        });
        it('can find null value in an object', () => {
            expect(deepFind({ a : 1, b : 2, c : 3, d: null }, null)).toBe('object.d');
        });
        it('can find key in an object', () => {
            expect(deepFind({ a : 1, b : 2, c : 3}, 'c')).toBe('object.c');
        });
        it('can find element in an array', () => {
            expect(deepFind(['a', 'b', 'c'], 'c')).toBe('object[2]');
        });
        it('can find an object nested in another object', () => {
            const object = { a : 1, b : 2, c : 3};
            expect(deepFind({ prop1 : object.a, prop2 : object }, object)).toBe('object.prop2');
        });
        it('can find an element deeply nested in another object', () => {
            expect(deepFind({ prop1 : { prop2 : [{ prop3 : 'value' }]} }, 'value')).toBe('object.prop1.prop2[0].prop3');
        });
    });
    describe('deepFindCommonElement', () => {
        it('returns undefined if there is no common element', () => {
           const object1 = { a : 1, b : 2, c : 3, g : undefined, h: null };
           const object2 = { d : 4, e : 5, f : 6};
           expect(deepFindCommonElement(object1, object2)).toBeUndefined();
        });
        it('returns the path of the first common element if any', () => {
           const object1 = {a : {b : [{ c : [1, 2, 3, 4, 5]}]}};
           const object2 = {f : [{ e : 5}]};
           expect(deepFindCommonElement(object1, object2)).toEqual(['object1.a.b[0].c[4]', 'object2.f[0].e']);
        });
        it('returns the path of first common undefined element if any', () => {
            const object1 = {a : {b : [{ c : [1, 2, 3, 4, undefined]}]}};
            const object2 = {f : [{ e : undefined}]};
            expect(deepFindCommonElement(object1, object2)).toEqual(['object1.a.b[0].c[4]', 'object2.f[0].e']);
         });
        it('returns the path of first common null element if any', () => {
            const object1 = {a : {b : [{ c : [1, 2, 3, 4, null]}]}};
            const object2 = {f : [{ e : null}]};
            expect(deepFindCommonElement(object1, object2)).toEqual(['object1.a.b[0].c[4]', 'object2.f[0].e']);
         });
    });
});