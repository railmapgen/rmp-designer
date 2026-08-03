import type { AttrBinding } from '../constants/attr-binding';
import type { Components } from '../constants/components';
import type { SvgsElem } from '../constants/constants';
import type { SvgPanelVariableOption } from '../constants/svg-panel-options';
import {
    compileAttrBindingToLegacyAttr,
    getComponentDisplayName,
    legacyAttrToBinding,
    normalizeAttrBindingForAttr,
} from './attr-binding';
import { getDefaultAttrBinding } from './svg-attr-metadata';

export const createVariableOptions = (components: Components[], t: (key: string) => string): SvgPanelVariableOption[] =>
    components.flatMap(component => {
        const displayName = getComponentDisplayName(component);
        if (component.type === 'color') {
            return [
                {
                    id: `${component.id}:hex`,
                    value: `${displayName} · ${t('panel.svgs.attrPanel.mainColor')}`,
                    token: `${component.label}.hex`,
                    componentId: component.id,
                    path: 'hex',
                },
                {
                    id: `${component.id}:text`,
                    value: `${displayName} · ${t('panel.svgs.attrPanel.textColor')}`,
                    token: `${component.label}.text`,
                    componentId: component.id,
                    path: 'text',
                },
            ];
        }
        return [
            {
                id: component.id,
                value: displayName,
                token: component.label,
                componentId: component.id,
            },
        ];
    });

export const stringifyValue = (value: unknown) =>
    typeof value === 'object' ? JSON.stringify(value) : value === undefined || value === null ? '' : String(value);

export const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

export const attrTextKey = (attrKey: string, field: 'title' | 'description' | 'effectHint' | 'unitHint') =>
    `panel.svgs.attrs.${attrKey}.${field}`;

export const getBindingForAttr = (attrKey: string, elem: SvgsElem, components: Components[]): AttrBinding => {
    if (elem.attrBindings?.[attrKey]) return normalizeAttrBindingForAttr(attrKey, elem.attrBindings[attrKey]);
    if (elem.attrs[attrKey])
        return normalizeAttrBindingForAttr(attrKey, legacyAttrToBinding(elem.attrs[attrKey], components));
    return getDefaultAttrBinding(elem.type, attrKey);
};

export const updateAttrBinding = (
    elem: SvgsElem,
    attrKey: string,
    binding: AttrBinding,
    components: Components[]
): { attrs: Record<string, string>; attrBindings: Record<string, AttrBinding> } => {
    const normalizedBinding = normalizeAttrBindingForAttr(attrKey, binding);
    const attrBindings = { ...(elem.attrBindings ?? {}), [attrKey]: normalizedBinding };
    return {
        attrBindings,
        attrs: {
            ...elem.attrs,
            [attrKey]: compileAttrBindingToLegacyAttr(normalizedBinding, components),
        },
    };
};

export const removeAttrBinding = (elem: SvgsElem, attrKey: string) => {
    const { [attrKey]: _removedAttr, ...attrs } = elem.attrs;
    const { [attrKey]: _removedBinding, ...attrBindings } = elem.attrBindings ?? {};
    return { attrs, attrBindings };
};

export const updateSvgAtPath = (
    svgs: SvgsElem[],
    path: number[],
    updater: (elem: SvgsElem) => SvgsElem
): SvgsElem[] => {
    if (path.length === 0) return svgs;
    const [currentIndex, ...restPath] = path;
    return svgs.map((elem, index) => {
        if (index !== currentIndex) return elem;
        if (restPath.length === 0) return updater(elem);
        return { ...elem, children: updateSvgAtPath(elem.children ?? [], restPath, updater) };
    });
};
