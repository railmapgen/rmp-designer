import {
    addWidthStop,
    createSmoothPathModel,
    generateSmoothPathD,
    getNearestCenterlineT,
    insertControlPointAtNearestSegment,
    moveControlPoint,
    parseSmoothPathModel,
    removeControlPoint,
    resizeWidthStop,
    serializeSmoothPathModel,
} from './smooth-path';

const createId = (() => {
    let index = 0;
    return () => `id_${index++}`;
})();

describe('smooth path geometry', () => {
    it('generates finite path data for a curved variable-width path', () => {
        const result = createSmoothPathModel(
            [
                { x: 0, y: 0 },
                { x: 30, y: 20 },
                { x: 70, y: -10 },
                { x: 110, y: 0 },
            ],
            createId,
            { origin: { x: 0, y: 0 } }
        );

        expect(result).toBeDefined();
        const d = generateSmoothPathD(result!.model);

        expect(d).toContain('M');
        expect(d).toContain('Z');
        expect(d).not.toMatch(/NaN|Infinity/);
    });

    it('keeps inserted control points in path order', () => {
        const result = createSmoothPathModel(
            [
                { x: 0, y: 0 },
                { x: 100, y: 0 },
            ],
            createId,
            { origin: { x: 0, y: 0 } }
        );

        const next = insertControlPointAtNearestSegment(result!.model, { x: 50, y: 20 }, createId);

        expect(next.points).toHaveLength(3);
        expect(next.points[1]).toMatchObject({ x: 50, y: 20 });
    });

    it('updates the generated path after moving a point or resizing a width stop', () => {
        const result = createSmoothPathModel(
            [
                { x: 0, y: 0 },
                { x: 80, y: 0 },
                { x: 120, y: 40 },
            ],
            createId,
            { origin: { x: 0, y: 0 } }
        );
        const before = generateSmoothPathD(result!.model);
        const moved = moveControlPoint(result!.model, result!.model.points[1].id, { x: 80, y: 35 });
        const resized = resizeWidthStop(moved, moved.widthStops[1].id, 24);
        const after = generateSmoothPathD(resized);

        expect(after).not.toEqual(before);
        expect(after).not.toMatch(/NaN|Infinity/);
    });

    it('normalizes width stops and preserves serialized models', () => {
        const result = createSmoothPathModel(
            [
                { x: 0, y: 0 },
                { x: 100, y: 0 },
            ],
            createId,
            { origin: { x: 0, y: 0 } }
        );

        const withStop = addWidthStop(result!.model, createId, 0.25);
        const serialized = serializeSmoothPathModel(withStop);
        const parsed = parseSmoothPathModel(serialized);

        expect(parsed?.widthStops.map(stop => stop.t)).toEqual([...parsed!.widthStops.map(stop => stop.t)].sort());
    });

    it('safely rejects invalid or too-short paths', () => {
        expect(createSmoothPathModel([{ x: 0, y: 0 }], createId)).toBeUndefined();
        expect(parseSmoothPathModel('not json')).toBeUndefined();

        const result = createSmoothPathModel(
            [
                { x: 0, y: 0 },
                { x: 20, y: 0 },
            ],
            createId,
            { origin: { x: 0, y: 0 } }
        );
        const removed = removeControlPoint(result!.model, result!.model.points[0].id);

        expect(removed.points).toHaveLength(2);
        expect(getNearestCenterlineT(result!.model, { x: 10, y: 10 })).toBeGreaterThan(0);
    });
});
