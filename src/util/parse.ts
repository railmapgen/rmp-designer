import { Components, ComponentsType } from '../constants/components';
import { useRootDispatch, useRootSelector } from '../redux';
import { addGlobalAlert } from '../redux/runtime/runtime-slice';
import { SvgsAttrsType } from '../constants/svgs';
import { Id } from '../constants/constants';

export const queryComponentValue = (components: Components[], query: string) => {
    components.forEach(c => {
        if (c.id === query) {
            return c.value;
        }
    });
    return undefined;
};

export const getComponentValue = (components: Components[]) =>
    components.map(c => ({
        id: c.label,
        value: c.value ?? c.defaultValue,
        type: c.type,
    }));

export const calcFunc = (str: string, ...rest: string[]) => new Function(...rest, `return ${str}`);

export const calcFuncInBatch = (
    id: Id,
    str: string[],
    name: string[],
    value: string[],
    attrsType: SvgsAttrsType[],
    varType: ComponentsType[]
) => {
    const dispatch = useRootDispatch();
    const { globalAlerts } = useRootSelector(store => store.runtime);
    const { color } = useRootSelector(store => store.param);
    if (globalAlerts && globalAlerts.has(id)) return str.map((s, i) => (attrsType[i] === 'number' ? '0' : 'none'));

    return str.map((s, i) => {
        try {
            return calcFunc(
                s,
                ...name,
                'color'
            )(
                ...value.map((v, varI) => (varType[varI] === 'number' && !Number.isNaN(Number(v)) ? Number(v) : v)),
                color ? color.value ?? color.defaultValue : ''
            );
        } catch (e) {
            if (e instanceof Error) {
                console.error(s, e);
                dispatch(addGlobalAlert({ id, str: e.message }));
                return attrsType[i] === 'number' ? '0' : attrsType[i] === 'boolean' ? 'false' : 'none';
            }
        }
    });
};
