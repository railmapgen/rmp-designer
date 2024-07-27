import { upgrade, UPGRADE_COLLECTION } from './save';

describe('Unit tests for param upgrade function', () => {
    it('upgrade will return the default tutorial if originalParam is null', async () => {
        const save = await upgrade(null);
        expect(save).toContain('new');
        expect(save).toContain('MiscNode');
    });

    it('0 -> 1', () => {
        const oldParam =
            '{"id":"new","type":"MiscNode","svgs":[{"id":"id_qdVhLyVvhS","type":"rect","label":"uKNYt","attrs":{"x":"18","y":"-32","fill":"\\"black\\""}}],"components":[]}';
        const newParam = UPGRADE_COLLECTION[0](oldParam);
        const expectParam =
            '{"id":"new","type":"MiscNode","svgs":[{"id":"id_qdVhLyVvhS","type":"rect","label":"uKNYt","attrs":{"x":"1\\"18\\"","y":"1\\"-32\\"","fill":"1\\"black\\""}}],"components":[],"version":1}';
        expect(newParam).toEqual(expectParam);
    });

    it('1 -> 2', () => {
        // Add label
        const oldParam = '{"id":"new","type":"MiscNode","svgs":[],"components":[],"version":1}';
        const newParam = UPGRADE_COLLECTION[1](oldParam);
        const expectParam =
            '{"id":"new","type":"MiscNode","svgs":[],"components":[],"version":2,"label":"new","transform":{"translateX":0,"translateY":0,"scale":1,"rotate":0}}';
        expect(newParam).toEqual(expectParam);
    });
});
