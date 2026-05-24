import { Parser } from 'expr-eval';
import { AttrBinding, AttrCondition, AttrConditionOperand, AttrLiteralValue } from '../constants/attr-binding';
import type { Components } from '../constants/components';
import type { Theme } from '../constants/constants';

const formulaParser = new Parser({
    operators: {
        assignment: false,
        fndef: false,
        in: false,
    },
});

export interface AttrEvaluationContext {
    components: Components[];
}

export interface AttrEvaluationResult {
    value?: unknown;
    error?: string;
}

type FormulaScopeValue = string | number | boolean | object | ((...args: any[]) => unknown);

const formulaFunctionPattern = /\bMath\.(min|max|round|abs|floor|ceil)\s*\(/;
const formulaOperatorPattern = /(?:\d|\}|\))\s*[+\-*/]\s*(?:\d|\{|\(|Math\.)/;
const variableTokenPattern = /\{([^{}]+)\}/g;

export interface AttrVariableToken {
    componentId: string;
    path?: string;
    token: string;
}

export const getComponentRuntimeValue = (component: Components): unknown =>
    component.value !== undefined ? component.value : component.defaultValue;

const toExpressionValue = (value: unknown): string | number | boolean | object | undefined => {
    if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value as unknown as object;
    if (value && typeof value === 'object') return value;
    return undefined;
};

export const getComponentDisplayName = (component: Components): string => component.name || component.label;

export const createFormulaScope = (components: Components[]): Record<string, FormulaScopeValue> => {
    const scope: Record<string, FormulaScopeValue> = {
        Math,
        concat: (...values: unknown[]) => values.map(value => stringifyTemplateValue(value)).join(''),
    };
    components.forEach(component => {
        const value = toExpressionValue(getComponentRuntimeValue(component));
        if (value === undefined) return;
        scope[component.label] = value;
        scope[component.id] = value;
        if (component.name) {
            const nameKey = slugifyComponentLabel(component.name);
            if (nameKey) scope[nameKey] = value;
        }
    });
    return scope;
};

export const slugifyComponentLabel = (name: string, fallback = 'param'): string => {
    const clean = name
        .trim()
        .replace(/[^A-Za-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
    const withFallback = clean || fallback;
    return /^[A-Za-z_]/.test(withFallback) ? withFallback : `param_${withFallback}`;
};

const tokenAliasesForComponent = (component: Components): AttrVariableToken[] => {
    const displayName = getComponentDisplayName(component);
    const baseAliases = Array.from(new Set([displayName, component.label, component.id].filter(Boolean)));
    if (component.type !== 'color') {
        return baseAliases.map(token => ({ token, componentId: component.id }));
    }

    const textAliases = [
        `${displayName}文字色`,
        `${displayName} text`,
        `${displayName}.text`,
        `${component.label}文字色`,
        `${component.label}.text`,
        `${component.id}.text`,
    ];

    return [
        ...baseAliases.map(token => ({ token, componentId: component.id, path: 'hex' })),
        ...Array.from(new Set(textAliases.filter(Boolean))).map(token => ({
            token,
            componentId: component.id,
            path: 'text',
        })),
    ];
};

export const getAttrVariableTokens = (components: Components[]): AttrVariableToken[] =>
    components.flatMap(tokenAliasesForComponent);

export const resolveVariableToken = (token: string, components: Components[]): AttrVariableToken | undefined => {
    const cleanToken = token.trim();
    return getAttrVariableTokens(components).find(option => option.token === cleanToken);
};

export const resolveVariableBinding = (
    binding: { componentId: string; path?: string },
    components: Components[]
): AttrEvaluationResult => {
    const component = components.find(c => c.id === binding.componentId || c.label === binding.componentId);
    if (!component) return { error: `Unknown variable: ${binding.componentId}` };

    const value = getComponentRuntimeValue(component);
    if (component.type === 'color') {
        const theme = value as Theme | undefined;
        if (!Array.isArray(theme)) return { error: `Invalid color variable: ${getComponentDisplayName(component)}` };
        if (binding.path === 'hex') return { value: theme[2] };
        if (binding.path === 'text') return { value: theme[3] };
        return { value: theme };
    }

    if (binding.path) return { error: `Variable ${getComponentDisplayName(component)} does not support path ${binding.path}` };
    return { value };
};

const replaceVariableTokens = (
    expression: string,
    components: Components[],
    replace: (token: AttrVariableToken, index: number) => string
): { expression: string; error?: string } => {
    let index = 0;
    let error: string | undefined;
    const nextExpression = expression.replace(variableTokenPattern, (_match, tokenText: string) => {
        const token = resolveVariableToken(tokenText, components);
        if (!token) {
            error = `Unknown variable: ${tokenText.trim()}`;
            return 'undefined';
        }
        const replacement = replace(token, index);
        index += 1;
        return replacement;
    });
    return { expression: nextExpression, error };
};

const stringifyTemplateValue = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

const isTemplateConcatExpression = (expression: string): boolean =>
    /\{[^{}]+\}/.test(expression) &&
    !formulaFunctionPattern.test(expression) &&
    !formulaOperatorPattern.test(expression) &&
    !expression.includes('?');

const evaluateTemplateConcatExpression = (expression: string, components: Components[]): AttrEvaluationResult => {
    let cursor = 0;
    let output = '';
    variableTokenPattern.lastIndex = 0;

    for (const match of expression.matchAll(variableTokenPattern)) {
        const [rawToken, tokenText] = match;
        output += expression.slice(cursor, match.index);
        const token = resolveVariableToken(tokenText, components);
        if (!token) return { error: `Unknown variable: ${tokenText.trim()}` };
        const result = resolveVariableBinding(token, components);
        if (result.error) return result;
        output += stringifyTemplateValue(result.value);
        cursor = (match.index ?? 0) + rawToken.length;
    }

    output += expression.slice(cursor);
    return { value: output };
};

const normalizeFormulaExpressionForEval = (
    expression: string,
    components: Components[]
): { expression: string; scope: Record<string, FormulaScopeValue>; error?: string } => {
    const scope = createFormulaScope(components);
    const normalized = replaceVariableTokens(expression, components, (token, index) => {
        const key = `__attrVar${index}`;
        const result = resolveVariableBinding(token, components);
        if (result.error) {
            scope[key] = undefined as unknown as FormulaScopeValue;
        } else {
            scope[key] = (toExpressionValue(result.value) ?? String(result.value ?? '')) as FormulaScopeValue;
        }
        return key;
    });
    return { expression: normalized.expression, scope, error: normalized.error };
};

const normalizeFormulaExpressionForLegacy = (expression: string, components: Components[]): string =>
    replaceVariableTokens(expression, components, token => variableToLegacyExpression(token.componentId, token.path, components))
        .expression;

const evaluateOperand = (operand: AttrConditionOperand, context: AttrEvaluationContext): AttrEvaluationResult => {
    if (operand.source === 'literal') return { value: operand.value };
    return resolveVariableBinding(operand, context.components);
};

const compareNumbers = (left: unknown, right: unknown, compare: (left: number, right: number) => boolean): boolean => {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) return false;
    return compare(leftNumber, rightNumber);
};

export const evaluateCondition = (condition: AttrCondition, context: AttrEvaluationContext): AttrEvaluationResult => {
    const left = evaluateOperand(condition.left, context);
    if (left.error) return left;
    const right = condition.right ? evaluateOperand(condition.right, context) : { value: undefined };
    if (right.error) return right;

    switch (condition.operator) {
        case 'eq':
            return { value: left.value === right.value };
        case 'ne':
            return { value: left.value !== right.value };
        case 'gt':
            return { value: compareNumbers(left.value, right.value, (l, r) => l > r) };
        case 'gte':
            return { value: compareNumbers(left.value, right.value, (l, r) => l >= r) };
        case 'lt':
            return { value: compareNumbers(left.value, right.value, (l, r) => l < r) };
        case 'lte':
            return { value: compareNumbers(left.value, right.value, (l, r) => l <= r) };
        case 'contains':
            return { value: String(left.value ?? '').includes(String(right.value ?? '')) };
        case 'empty':
            return { value: left.value === undefined || left.value === null || left.value === '' };
        case 'notEmpty':
            return { value: !(left.value === undefined || left.value === null || left.value === '') };
        default:
            return { error: `Unsupported condition operator: ${condition.operator}` };
    }
};

const evaluateLegacyExpression = (expression: string, components: Components[]): AttrEvaluationResult => {
    try {
        const variableNames = components.map(component => component.label);
        const variableValues = components.map(component => {
            const value = getComponentRuntimeValue(component);
            return component.type === 'number' && !Number.isNaN(Number(value)) ? Number(value) : value;
        });
        const legacyFunc = new Function(...variableNames, `return ${expression}`);
        return { value: legacyFunc(...variableValues) };
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Invalid legacy expression' };
    }
};

export const evaluateLegacyAttr = (legacyAttr: string, context: AttrEvaluationContext): AttrEvaluationResult =>
    evaluateLegacyExpression(legacyAttr.slice(1), context.components);

export const evaluateAttrBinding = (binding: AttrBinding, context: AttrEvaluationContext): AttrEvaluationResult => {
    try {
        if (binding.kind === 'literal') return { value: binding.value };
        if (binding.kind === 'variable') return resolveVariableBinding(binding, context.components);
        if (binding.kind === 'formula') {
            if (isTemplateConcatExpression(binding.expression)) {
                return evaluateTemplateConcatExpression(binding.expression, context.components);
            }
            const normalized = normalizeFormulaExpressionForEval(binding.expression || '0', context.components);
            if (normalized.error) return { error: normalized.error };
            const expression = formulaParser.parse(normalized.expression || '0');
            return { value: expression.evaluate(normalized.scope as any) };
        }
        if (binding.kind === 'conditional') {
            const condition = evaluateCondition(binding.if, context);
            if (condition.error) return condition;
            return evaluateAttrBinding(condition.value ? binding.then : binding.else, context);
        }
        return evaluateLegacyExpression(binding.expression, context.components);
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Invalid attribute binding' };
    }
};

const jsLiteral = (value: AttrLiteralValue): string =>
    typeof value === 'object' ? JSON.stringify(value) : JSON.stringify(String(value));

const findComponentForCompile = (componentId: string, components: Components[]) =>
    components.find(component => component.id === componentId || component.label === componentId);

const operandToJsExpression = (operand: AttrConditionOperand, components: Components[]): string =>
    operand.source === 'literal'
        ? jsLiteral(operand.value)
        : variableToLegacyExpression(operand.componentId, operand.path, components);

const conditionToJsExpression = (condition: AttrCondition, components: Components[]): string => {
    const left = operandToJsExpression(condition.left, components);
    const right = condition.right ? operandToJsExpression(condition.right, components) : 'undefined';
    switch (condition.operator) {
        case 'eq':
            return `(${left} === ${right})`;
        case 'ne':
            return `(${left} !== ${right})`;
        case 'gt':
            return `(Number(${left}) > Number(${right}))`;
        case 'gte':
            return `(Number(${left}) >= Number(${right}))`;
        case 'lt':
            return `(Number(${left}) < Number(${right}))`;
        case 'lte':
            return `(Number(${left}) <= Number(${right}))`;
        case 'contains':
            return `(String(${left}).includes(String(${right})))`;
        case 'empty':
            return `(${left} === undefined || ${left} === null || ${left} === "")`;
        case 'notEmpty':
            return `!(${left} === undefined || ${left} === null || ${left} === "")`;
        default:
            return 'false';
    }
};

const variableToLegacyExpression = (componentId: string, path: string | undefined, components: Components[]): string => {
    const component = findComponentForCompile(componentId, components);
    if (!component) return 'undefined';
    if (component.type === 'color') {
        if (path === 'hex') return `${component.label}[2]`;
        if (path === 'text') return `${component.label}[3]`;
    }
    return component.label;
};

const legacyStringExpression = (expression: string): string =>
    `String(${expression} == null ? "" : ${expression})`;

const templateConcatExpressionToLegacy = (expression: string, components: Components[]): string => {
    const parts: string[] = [];
    let cursor = 0;
    variableTokenPattern.lastIndex = 0;

    for (const match of expression.matchAll(variableTokenPattern)) {
        const [rawToken, tokenText] = match;
        const literal = expression.slice(cursor, match.index);
        if (literal) parts.push(JSON.stringify(literal));

        const token = resolveVariableToken(tokenText, components);
        const variableExpression = token ? variableToLegacyExpression(token.componentId, token.path, components) : 'undefined';
        parts.push(legacyStringExpression(variableExpression));
        cursor = (match.index ?? 0) + rawToken.length;
    }

    const tail = expression.slice(cursor);
    if (tail) parts.push(JSON.stringify(tail));
    return parts.length > 0 ? parts.join(' + ') : '""';
};

const formulaToLegacyExpression = (expression: string, components: Components[]): string => {
    if (isTemplateConcatExpression(expression)) return templateConcatExpressionToLegacy(expression, components);
    return normalizeFormulaExpressionForLegacy(expression, components) || 'undefined';
};

const bindingToJsExpression = (binding: AttrBinding, components: Components[]): string => {
    if (binding.kind === 'literal') return jsLiteral(binding.value);
    if (binding.kind === 'variable') return variableToLegacyExpression(binding.componentId, binding.path, components);
    if (binding.kind === 'formula') return formulaToLegacyExpression(binding.expression, components);
    if (binding.kind === 'conditional') {
        return `(${conditionToJsExpression(binding.if, components)} ? ${bindingToJsExpression(
            binding.then,
            components
        )} : ${bindingToJsExpression(binding.else, components)})`;
    }
    return binding.expression || 'undefined';
};

export const compileAttrBindingToLegacyAttr = (binding: AttrBinding, components: Components[]): string => {
    if (binding.kind === 'literal') {
        if (typeof binding.value === 'object') return `3${JSON.stringify(binding.value)}`;
        return `1${JSON.stringify(String(binding.value))}`;
    }
    if (binding.kind === 'variable') {
        const component = findComponentForCompile(binding.componentId, components);
        if (!component) return '2undefined';
        if (component.type === 'color') {
            if (binding.path === 'hex') return `2${component.label}[2]`;
            if (binding.path === 'text') return `2${component.label}[3]`;
        }
        return `2${component.label}`;
    }
    if (binding.kind === 'formula') return `3${formulaToLegacyExpression(binding.expression, components)}`;
    if (binding.kind === 'conditional') return `3${bindingToJsExpression(binding, components)}`;
    return `3${binding.expression || 'undefined'}`;
};

export const legacyAttrToBinding = (legacyAttr: string, components: Components[]): AttrBinding => {
    if (legacyAttr.startsWith('1')) {
        const raw = legacyAttr.slice(1);
        try {
            return { kind: 'literal', value: JSON.parse(raw) };
        } catch {
            return { kind: 'literal', value: raw.replace(/^"|"$/g, '') };
        }
    }
    if (legacyAttr.startsWith('2')) {
        const reference = legacyAttr.slice(1);
        if (reference === 'color[2]') return { kind: 'variable', componentId: 'color', path: 'hex' };
        if (reference === 'color[3]') return { kind: 'variable', componentId: 'color', path: 'text' };
        const component = components.find(c => c.label === reference || c.id === reference);
        return component ? { kind: 'variable', componentId: component.id } : { kind: 'legacy', expression: reference };
    }
    return { kind: 'legacy', expression: legacyAttr.startsWith('3') ? legacyAttr.slice(1) : legacyAttr };
};

export const evaluateSvgAttrs = (
    attrs: Record<string, string>,
    attrBindings: Record<string, AttrBinding> | undefined,
    components: Components[]
): { attrs: Record<string, unknown>; error?: string } => {
    const evaluated: Record<string, unknown> = {};
    const keys = new Set([...Object.keys(attrs), ...Object.keys(attrBindings ?? {})]);

    for (const key of keys) {
        const result = attrBindings?.[key]
            ? evaluateAttrBinding(attrBindings[key], { components })
            : evaluateLegacyAttr(attrs[key], { components });
        if (result.error) return { attrs: evaluated, error: result.error };
        evaluated[key] = result.value;
    }

    return { attrs: evaluated };
};

export const compileAttrRecord = (
    attrs: Record<string, string>,
    attrBindings: Record<string, AttrBinding> | undefined,
    components: Components[]
): Record<string, string> => {
    const nextAttrs = { ...attrs };
    if (!attrBindings) return nextAttrs;
    Object.entries(attrBindings).forEach(([key, binding]) => {
        nextAttrs[key] = compileAttrBindingToLegacyAttr(binding, components);
    });
    return nextAttrs;
};
