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

    it('2 -> 3', () => {
        const oldParam =
            '{"id":"new","label":"new","transform":{"translateX":0,"translateY":0,"scale":1,"rotate":0},"type":"MiscNode","svgs":[{"id":"id_parent","type":"g","label":"group","attrs":{"x":"1\\"0\\""},"children":[{"id":"id_child","type":"rect","label":"rect","attrs":{"width":"2size","fill":"2color[2]","height":"3size + 1"}}]}],"components":[{"id":"component_size","label":"size","type":"number","defaultValue":"10"}],"color":{"id":"color","label":"color","type":"color","defaultValue":["beijing","bj1","#c23a30","white"]},"version":2}';
        const upgraded = JSON.parse(UPGRADE_COLLECTION[2](oldParam));

        expect(upgraded.version).toEqual(3);
        expect(upgraded.components[0].name).toEqual('size');
        expect(upgraded.components[0].constraints.step).toEqual(1);
        expect(upgraded.svgs[0].attrs.x).toEqual('1"0"');
        expect(upgraded.svgs[0].attrBindings.x).toEqual({ kind: 'literal', value: '0' });
        expect(upgraded.svgs[0].children[0].attrBindings.width).toEqual({
            kind: 'variable',
            componentId: 'component_size',
        });
        expect(upgraded.svgs[0].children[0].attrBindings.fill).toEqual({
            kind: 'variable',
            componentId: 'color',
            path: 'hex',
        });
        expect(upgraded.svgs[0].children[0].attrBindings.height).toEqual({
            kind: 'legacy',
            expression: 'size + 1',
        });
    });
});
