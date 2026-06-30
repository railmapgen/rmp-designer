import { defaultParam, normalizeTheme, Param, SvgsElem } from '../constants/constants';
import {
    colorComponents,
    Components,
    getComponentOptionValues,
    normalizeComponentOptionValue,
} from '../constants/components';
import { AttrBinding } from '../constants/attr-binding';
import {
    compileAttrRecord,
    legacyAttrToBinding,
    normalizeAttrBindingForExport,
    slugifyComponentLabel,
} from './attr-binding';

export const SAVE_VERSION = 4;

type ExportSvgsElem = Omit<SvgsElem, 'attrs' | 'children'> & {
    children?: ExportSvgsElem[];
};

type ExportParam = Omit<Param, 'svgs' | 'color' | 'version' | 'core'> & {
    version: 4;
    svgs: ExportSvgsElem[];
};

export const prepareParamForExport = (param: Param): ExportParam => {
    const normalizedParam = normalizeParamForDesigner(param);
    const components = normalizedParam.components;
    const { color: _color, svgs: _svgs, version: _version, core: _core, ...rest } = normalizedParam;
    return {
        ...rest,
        version: SAVE_VERSION,
        svgs: exportSvgs(normalizedParam.svgs, components),
    };
};

export const stringifyParam = (param: Param): string => JSON.stringify(prepareParamForExport(param));

export const upgrade: (originalParam: string | null) => Promise<string> = async originalParam => {
    let changed = false;

    if (!originalParam) {
        originalParam = JSON.stringify(defaultParam);
        changed = true;
    }

    let originalSave = JSON.parse(originalParam);
    if (!('version' in originalSave) || !Number.isInteger(originalSave.version)) {
        originalSave = { ...originalSave, version: 0 };
        changed = true;
    }

    let version = Number(originalSave.version);
    let save = JSON.stringify(originalSave);
    while (version in UPGRADE_COLLECTION) {
        save = UPGRADE_COLLECTION[version](save);
        version = Number(JSON.parse(save).version);
        changed = true;
    }

    if (changed) {
        console.warn(`Upgrade save to version: ${version}`);
        // Backup original param in case of bugs in the upgrades.
        if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
            localStorage.setItem('rmp-designer__param__backup', originalParam);
        }
    }

    const normalized = normalizeParamForDesigner(JSON.parse(save) as Param);
    return JSON.stringify(normalized);
};

export const UPGRADE_COLLECTION: { [version: number]: (param: string) => string } = {
    0: param => {
        const p = JSON.parse(param) as Param;
        const newSvgs: SvgsElem[] = p.svgs.map(s => {
            const modifiedAttrs: Record<string, string> = {};
            for (const key in s.attrs) {
                if (Object.prototype.hasOwnProperty.call(s.attrs, key)) {
                    const regValue = /^"[^"]*"$/;
                    const regNumber = /^[0-9-]+$/;
                    const regVar = /^[A-Za-z0-9]+$/;
                    if (regValue.test(s.attrs[key])) {
                        modifiedAttrs[key] = `1${s.attrs[key]}`;
                    } else if (regNumber.test(s.attrs[key])) {
                        modifiedAttrs[key] = `1"${s.attrs[key]}"`;
                    } else if (regVar.test(s.attrs[key])) {
                        modifiedAttrs[key] = `2${s.attrs[key]}`;
                    } else {
                        modifiedAttrs[key] = `3${s.attrs[key]}`;
                    }
                }
            }
            return { ...s, attrs: modifiedAttrs };
        });
        return JSON.stringify({ ...p, version: 1, svgs: newSvgs } as Param);
    },
    1: param => {
        // Add label
        const p = JSON.parse(param) as Param;
        return JSON.stringify({ ...p, version: 2, label: p.id, transform: defaultParam.transform } as Param);
    },
    2: param => {
        const p = JSON.parse(param) as Param;
        const components = migrateComponents(p.components);
        const color = p.color ? migrateComponent(p.color) : undefined;
        const componentsWithColor = color ? [...components, color] : components;
        return JSON.stringify({
            ...p,
            version: 3,
            components,
            color,
            svgs: migrateSvgs(p.svgs, componentsWithColor),
        } as Param);
    },
    3: param => {
        const p = JSON.parse(param) as Param;
        return JSON.stringify({
            ...normalizeParamForDesigner(p),
            version: 4,
        } as Param);
    },
};

const migrateComponent = (component: Components): Components => {
    const name = component.name ?? component.label;
    const label = component.label || slugifyComponentLabel(name, component.id);
    const optionValues = component.type === 'option' ? getComponentOptionValues(component) : [];
    const defaultValue =
        component.type === 'switch'
            ? Boolean(component.defaultValue)
            : component.type === 'color'
              ? normalizeTheme(component.defaultValue)
              : component.type === 'option'
                ? normalizeComponentOptionValue(component.defaultValue, optionValues)
                : component.defaultValue;
    const value =
        component.value === undefined
            ? undefined
            : component.type === 'switch'
              ? Boolean(component.value)
              : component.type === 'color'
                ? normalizeTheme(component.value)
                : component.type === 'option'
                  ? normalizeComponentOptionValue(component.value, optionValues)
                  : component.value;
    const constraints =
        component.type === 'number'
            ? {
                  step: 1,
                  ...component.constraints,
              }
            : component.type === 'option'
              ? {
                    ...component.constraints,
                    options: optionValues,
                }
              : component.constraints;
    return {
        ...component,
        label,
        name,
        defaultValue,
        value,
        constraints,
    };
};

const migrateComponents = (components: Components[]): Components[] => components.map(migrateComponent);

const componentIdentity = (component: Components) => component.id || component.label;

export const normalizeParamForDesigner = (param: Param): Param => {
    const components = migrateComponents(param.components ?? []);
    const color = param.color ? migrateComponent({ ...colorComponents, ...param.color, type: 'color' }) : undefined;
    const hasColorComponent =
        !!color && components.some(component => componentIdentity(component) === componentIdentity(color));
    const nextComponents = color && !hasColorComponent ? [...components, color] : components;

    return {
        ...param,
        version: SAVE_VERSION,
        color: undefined,
        core: undefined,
        components: nextComponents,
        svgs: normalizeSvgsForDesigner(param.svgs ?? [], nextComponents),
    };
};

const migrateSvgs = (svgs: SvgsElem[], components: Components[]): SvgsElem[] =>
    svgs.map(svg => {
        const attrBindings: Record<string, AttrBinding> = {};
        Object.entries(svg.attrs ?? {}).forEach(([key, value]) => {
            attrBindings[key] = legacyAttrToBinding(value, components);
        });
        return {
            ...svg,
            attrs: svg.attrs ?? {},
            attrBindings,
            children: svg.children ? migrateSvgs(svg.children, components) : undefined,
        };
    });

const normalizeSvgsForDesigner = (svgs: SvgsElem[], components: Components[]): SvgsElem[] =>
    svgs.map(svg => {
        const attrs = svg.attrs ?? {};
        return {
            ...svg,
            attrs,
            attrBindings: svg.attrBindings ?? migrateSvgs([{ ...svg, attrs }], components)[0].attrBindings,
            children: svg.children ? normalizeSvgsForDesigner(svg.children, components) : undefined,
        };
    });

const compileSvgs = (svgs: SvgsElem[], components: Components[]): SvgsElem[] =>
    svgs.map(svg => ({
        ...svg,
        attrs: compileAttrRecord(svg.attrs, svg.attrBindings, components),
        children: svg.children ? compileSvgs(svg.children, components) : undefined,
    }));

const getExportAttrBindings = (svg: SvgsElem, components: Components[]): Record<string, AttrBinding> => {
    const attrBindings: Record<string, AttrBinding> = { ...(svg.attrBindings ?? {}) };
    Object.entries(svg.attrs ?? {}).forEach(([key, value]) => {
        if (!attrBindings[key]) attrBindings[key] = legacyAttrToBinding(value, components);
    });
    return Object.fromEntries(
        Object.entries(attrBindings).map(([key, binding]) => [key, normalizeAttrBindingForExport(binding, components)])
    );
};

const exportSvgs = (svgs: SvgsElem[], components: Components[]): ExportSvgsElem[] =>
    svgs.map(svg => {
        const { attrs: _attrs, children, ...rest } = svg;
        return {
            ...rest,
            attrBindings: getExportAttrBindings(svg, components),
            children: children ? exportSvgs(children, components) : undefined,
        };
    });
