export type AttrLiteralValue = string | number | boolean | Record<string, unknown> | unknown[];

export type AttrBinding =
    | { kind: 'literal'; value: AttrLiteralValue }
    | { kind: 'variable'; componentId: string; path?: string }
    | { kind: 'formula'; expression: string }
    | { kind: 'conditional'; if: AttrCondition; then: AttrBinding; else: AttrBinding }
    | { kind: 'legacy'; expression: string };

export type AttrConditionOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'empty' | 'notEmpty';

export type AttrConditionOperand =
    | { source: 'literal'; value: AttrLiteralValue }
    | { source: 'variable'; componentId: string; path?: string };

export interface AttrCondition {
    left: AttrConditionOperand;
    operator: AttrConditionOperator;
    right?: AttrConditionOperand;
}
