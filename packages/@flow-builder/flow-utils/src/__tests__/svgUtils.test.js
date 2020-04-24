import { createSvgPath, createSvgInfo } from '../svgUtils';

describe('svgUtils', () => {
    it('staight line', () => {
        const pathParams = {
            start: { x: 0, y: 0 },
            offsets: [[0, 100]]
        };

        const expectedPath = `M 0, 0\nL 0, 100`;
        expect(createSvgPath(pathParams)).toEqual(expectedPath);
    });

    it('staight line with offset', () => {
        const pathParams = {
            start: { x: 0, y: 0 },
            offsets: [[100, 0]]
        };
        const offset = [0, 3];

        const expectedPath = `M 0, 3\nL 100, 3`;

        expect(createSvgPath(pathParams, offset)).toEqual(expectedPath);

        const svgInfo = createSvgInfo(pathParams, [0, 3]);

        expect(svgInfo).toEqual({
            geometry: {
                x: 0,
                y: -3,
                w: 100,
                h: 6
            },
            path: expectedPath
        });
    });

    it('right branch curve', () => {
        const pathParams = {
            start: { x: 0, y: 0 },
            offsets: [
                [84, 0],
                [16, 16],
                [0, 12]
            ]
        };

        const expectedPath = 'M 0, 0\nL 84, 0\nA 16 16 0 0 1, 100, 16\nL 100, 28';

        expect(createSvgPath(pathParams)).toEqual(expectedPath);

        const svgInfo = createSvgInfo(pathParams);

        expect(svgInfo).toEqual({
            geometry: {
                x: 0,
                y: 0,
                w: 100,
                h: 28
            },
            path: expectedPath
        });
    });

    it('left merge curve', () => {
        const pathParams = {
            start: { x: 0, y: 0 },
            offsets: [
                [0, 12],
                [16, 16],
                [68, 0],
                [16, 16],
                [0, 12]
            ]
        };

        const expectedPath = 'M 0, 0\nL 0, 12\nA 16 16 0 0 0, 16, 28\nL 84, 28\nA 16 16 0 0 1, 100, 44\nL 100, 56';

        expect(createSvgPath(pathParams)).toEqual(expectedPath);

        const svgInfo = createSvgInfo(pathParams);

        expect(svgInfo).toEqual({
            geometry: {
                x: 0,
                y: 0,
                w: 100,
                h: 56
            },
            path: expectedPath
        });
    });
});
