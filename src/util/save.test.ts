import { stringifyParam, upgrade, UPGRADE_COLLECTION } from './save';

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

    it('3 -> 4 moves color into components', () => {
        const oldParam =
            '{"id":"new","label":"new","transform":{"translateX":0,"translateY":0,"scale":1,"rotate":0},"type":"MiscNode","svgs":[],"components":[],"color":{"id":"color","label":"color","type":"color","defaultValue":["beijing","bj1","#c23a30","white"]},"version":3}';
        const upgraded = JSON.parse(UPGRADE_COLLECTION[3](oldParam));

        expect(upgraded.version).toEqual(4);
        expect(upgraded.color).toBeUndefined();
        expect(upgraded.components).toHaveLength(1);
        expect(upgraded.components[0]).toMatchObject({
            id: 'color',
            label: 'color',
            name: 'Color',
            type: 'color',
            defaultValue: ['beijing', 'bj1', '#c23a30', '#fff'],
        });
    });

    it('v4 export omits legacy attrs and root color', () => {
        const exported = JSON.parse(
            stringifyParam({
                id: 'new',
                label: 'new',
                transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 },
                version: 4,
                type: 'MiscNode',
                components: [
                    {
                        id: 'component_width',
                        label: 'widthValue',
                        name: 'Width Label',
                        type: 'number',
                        defaultValue: 10,
                    },
                ],
                color: {
                    id: 'color',
                    label: 'color',
                    type: 'color',
                    defaultValue: ['other', 'other', '#000000', '#fff'],
                },
                svgs: [
                    {
                        id: 'id_rect',
                        type: 'rect',
                        label: 'rect',
                        attrs: { fill: '1"#ffffff"' },
                        attrBindings: {
                            fill: { kind: 'literal', value: '#ffffff' },
                            width: { kind: 'formula', expression: '{Width Label} + 1' },
                        },
                    },
                ],
            } as any)
        );

        expect(exported.version).toEqual(4);
        expect(exported.color).toBeUndefined();
        expect(exported.components).toHaveLength(2);
        expect(exported.svgs[0].attrs).toBeUndefined();
        expect(exported.svgs[0].attrBindings.fill).toEqual({ kind: 'literal', value: '#ffffff' });
        expect(exported.svgs[0].attrBindings.width.expression).toEqual('{widthValue} + 1');
    });

    it('v4 export omits legacy station core', () => {
        const exported = JSON.parse(
            stringifyParam({
                id: 'new',
                label: 'new',
                transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 },
                version: 4,
                type: 'Station',
                core: 'id_rect',
                components: [],
                svgs: [
                    {
                        id: 'id_rect',
                        type: 'rect',
                        label: 'rect',
                        attrs: {},
                    },
                ],
            } as any)
        );

        expect(exported.type).toEqual('Station');
        expect(exported.core).toBeUndefined();
    });

    it('v4 export normalizes option variables', () => {
        const exported = JSON.parse(
            stringifyParam({
                id: 'new',
                label: 'new',
                transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 },
                version: 4,
                type: 'MiscNode',
                components: [
                    {
                        id: 'component_variant',
                        label: 'variant',
                        type: 'option',
                        defaultValue: 'missing',
                        value: 'invalid',
                        constraints: { options: ['local', 'express', 'local', ''] },
                    },
                ],
                svgs: [],
            } as any)
        );

        expect(exported.components[0]).toMatchObject({
            id: 'component_variant',
            label: 'variant',
            type: 'option',
            defaultValue: 'local',
            value: 'local',
            constraints: { options: ['local', 'express'] },
        });
    });
});
