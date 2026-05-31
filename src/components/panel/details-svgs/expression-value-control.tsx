import { Box, Button, Flex, HStack, Input, Text, Textarea, useColorModeValue, VStack } from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AttrBinding, AttrLiteralValue } from '../../../constants/attr-binding';
import type { Components } from '../../../constants/components';
import type { SvgPanelVariableOption } from '../../../constants/svg-panel-options';
import { compileAttrBindingToLegacyAttr, resolveVariableToken } from '../../../util/attr-binding';
import { getAttrControl } from '../../../util/svg-attr-metadata';
import { ExpressionBlockInput, ExpressionBlockInputHandle, setPaletteDragText } from './expression-block-input';
import { stringifyValue } from '../../../util/svg-panel';

const expressionButtons = [
    { labelKey: 'add', fallbackLabel: '+', text: ' + ' },
    { labelKey: 'subtract', fallbackLabel: '-', text: ' - ' },
    { labelKey: 'multiply', fallbackLabel: 'x', text: ' * ' },
    { labelKey: 'divide', fallbackLabel: '/', text: ' / ' },
    { labelKey: 'min', fallbackLabel: 'Minimum', text: 'Math.min(, )', cursorOffset: 9 },
    { labelKey: 'max', fallbackLabel: 'Maximum', text: 'Math.max(, )', cursorOffset: 9 },
    { labelKey: 'round', fallbackLabel: 'Round', text: 'Math.round()', cursorOffset: 11 },
    { labelKey: 'abs', fallbackLabel: 'Absolute', text: 'Math.abs()', cursorOffset: 9 },
    { labelKey: 'floor', fallbackLabel: 'Floor', text: 'Math.floor()', cursorOffset: 11 },
    { labelKey: 'ceil', fallbackLabel: 'Ceil', text: 'Math.ceil()', cursorOffset: 10 },
    { labelKey: 'if', fallbackLabel: 'If', text: ' ?  : ', cursorOffset: 1 },
];

const getBindingToken = (binding: { componentId: string; path?: string }, components: Components[]) => {
    const component = components.find(c => c.id === binding.componentId || c.label === binding.componentId);
    if (!component) return binding.componentId;
    if (component.type === 'color' && (!binding.path || binding.path === 'hex')) return `${component.label}.hex`;
    if (component.type === 'color' && binding.path === 'text') return `${component.label}.text`;
    return component.label;
};

const bindingToEditorText = (binding: AttrBinding, components: Components[]): string => {
    if (binding.kind === 'literal') return stringifyValue(binding.value);
    if (binding.kind === 'variable') return `{${getBindingToken(binding, components)}}`;
    if (binding.kind === 'formula' || binding.kind === 'legacy') return binding.expression;
    return compileAttrBindingToLegacyAttr(binding, components).replace(/^3/, '');
};

const isFormulaText = (value: string) =>
    /\{[^{}]+\}/.test(value) ||
    /\bMath\.(min|max|round|abs|floor|ceil)\s*\(/.test(value) ||
    /\?/.test(value) ||
    /(?:\d|\}|\))\s*[+\-*/]\s*(?:\d|\{|\()/.test(value);

const variableTokenPattern = /\{([^{}]+)\}/g;

const normalizeEditorFormulaText = (value: string, components: Components[]) =>
    value.replace(variableTokenPattern, (match, tokenText: string) => {
        const variable = resolveVariableToken(tokenText, components);
        if (!variable) return match;
        const component = components.find(c => c.id === variable.componentId || c.label === variable.componentId);
        if (!component) return match;
        return `{${component.label}${variable.path ? `.${variable.path}` : ''}}`;
    });

const coerceLiteralValue = (elemType: string, attrKey: string, value: string): AttrLiteralValue => {
    const control = getAttrControl(elemType, attrKey);
    const trimmed = value.trim();

    if (control.type === 'number' && trimmed !== '' && !Number.isNaN(Number(trimmed))) {
        return Number(trimmed);
    }
    if (control.type === 'switch') {
        return ['true', '1', 'yes', 'on'].includes(trimmed.toLowerCase());
    }
    if (control.type === 'style' && trimmed) {
        try {
            return JSON.parse(trimmed);
        } catch {
            return value;
        }
    }
    return value;
};

const editorTextToBinding = (
    elemType: string,
    attrKey: string,
    value: string,
    components: Components[]
): AttrBinding => {
    const trimmed = value.trim();
    const exactToken = trimmed.match(/^\{([^{}]+)\}$/);
    if (exactToken) {
        const variable = resolveVariableToken(exactToken[1], components);
        if (variable) return { kind: 'variable', componentId: variable.componentId, path: variable.path };
    }
    if (isFormulaText(value)) return { kind: 'formula', expression: normalizeEditorFormulaText(value, components) };
    return { kind: 'literal', value: coerceLiteralValue(elemType, attrKey, value) };
};

export const ExpressionValueControl = (props: {
    elemType: string;
    attrKey: string;
    binding: AttrBinding;
    components: Components[];
    variableOptions: SvgPanelVariableOption[];
    quickValues?: Array<string | number>;
    onChange: (binding: AttrBinding) => void;
}) => {
    const { elemType, attrKey, binding, components, variableOptions, quickValues, onChange } = props;
    const { t } = useTranslation();
    const control = getAttrControl(elemType, attrKey);
    const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const blockInputRef = React.useRef<ExpressionBlockInputHandle | null>(null);
    const [isPanelOpen, setIsPanelOpen] = React.useState(false);
    const value = bindingToEditorText(binding, components);
    const isLargeInput =
        ['textarea', 'path', 'points', 'style'].includes(control.type) ||
        (control.type !== 'text-content' && value.length > 60);
    const supportsBlockInput = !isLargeInput;
    const quickOptions = control.type === 'select' && control.options ? Object.entries(control.options) : undefined;
    const captionColor = useColorModeValue('gray.500', 'gray.400');
    const panelBg = useColorModeValue('gray.50', 'gray.800');
    const panelCaptionColor = useColorModeValue('gray.600', 'gray.300');

    const handleTextChange = (nextValue: string) => {
        onChange(editorTextToBinding(elemType, attrKey, nextValue, components));
    };

    const insertText = (text: string, cursorOffset?: number) => {
        if (supportsBlockInput) {
            blockInputRef.current?.insertText(text);
            return;
        }

        const input = inputRef.current;
        const start = input?.selectionStart ?? value.length;
        const end = input?.selectionEnd ?? value.length;
        const nextValue = `${value.slice(0, start)}${text}${value.slice(end)}`;
        handleTextChange(nextValue);
        window.setTimeout(() => {
            const nextCursor = start + (cursorOffset ?? text.length);
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(nextCursor, nextCursor);
        });
    };

    return (
        <VStack align="stretch" spacing={2}>
            <HStack align="stretch">
                <Box flex="1">
                    {supportsBlockInput ? (
                        <ExpressionBlockInput
                            ref={blockInputRef}
                            value={value}
                            placeholder={t('panel.svgs.attrPanel.placeholder')}
                            components={components}
                            onChange={handleTextChange}
                            onEditModeChange={setIsPanelOpen}
                        />
                    ) : (
                        <Textarea
                            ref={node => {
                                inputRef.current = node;
                            }}
                            value={value}
                            placeholder={t('panel.svgs.attrPanel.placeholder')}
                            onChange={event => handleTextChange(event.target.value)}
                        />
                    )}
                </Box>
                {control.type === 'color' && /^#[0-9a-f]{6}$/i.test(value) && (
                    <Input
                        type="color"
                        width="48px"
                        p={1}
                        value={value}
                        onChange={event => handleTextChange(event.target.value)}
                    />
                )}
            </HStack>

            {quickOptions && (
                <Flex wrap="wrap" gap={1} alignItems="center">
                    <Text fontSize="xs" color={captionColor} mr={1}>
                        {t('panel.svgs.attrPanel.common')}
                    </Text>
                    {quickOptions.map(([key, label]) => (
                        <Button
                            key={key}
                            size="xs"
                            variant={value === key ? 'solid' : 'outline'}
                            onClick={() => handleTextChange(key)}
                        >
                            {label}
                        </Button>
                    ))}
                </Flex>
            )}

            {!quickOptions && quickValues && quickValues.length > 0 && (
                <Flex wrap="wrap" gap={1} alignItems="center">
                    <Text fontSize="xs" color={captionColor} mr={1}>
                        {t('panel.svgs.attrPanel.quick')}
                    </Text>
                    {quickValues.map(option => {
                        const optionValue = String(option);
                        return (
                            <Button
                                key={optionValue}
                                size="xs"
                                variant={value === optionValue ? 'solid' : 'outline'}
                                onClick={() => handleTextChange(optionValue)}
                            >
                                {optionValue || t('panel.svgs.attrPanel.empty')}
                            </Button>
                        );
                    })}
                </Flex>
            )}

            {isPanelOpen && (
                <Box borderWidth="1px" borderRadius="md" bg={panelBg} p={2}>
                    <VStack align="stretch" spacing={2}>
                        {variableOptions.length > 0 && (
                            <Box>
                                <Text fontSize="xs" color={panelCaptionColor} mb={1}>
                                    {t('panel.svgs.attrPanel.insertVariable')}
                                </Text>
                                <Flex wrap="wrap" gap={1}>
                                    {variableOptions.map(option => (
                                        <Button
                                            key={option.id}
                                            size="xs"
                                            variant="outline"
                                            draggable
                                            onDragStart={event => setPaletteDragText(event, `{${option.token}}`)}
                                            onClick={() => insertText(`{${option.token}}`)}
                                        >
                                            {option.value}
                                        </Button>
                                    ))}
                                </Flex>
                            </Box>
                        )}

                        <Box>
                            <Text fontSize="xs" color={panelCaptionColor} mb={1}>
                                {t('panel.svgs.attrPanel.insertCalculation')}
                            </Text>
                            <Flex wrap="wrap" gap={1}>
                                {expressionButtons.map(button => (
                                    <Button
                                        key={button.labelKey}
                                        size="xs"
                                        variant="outline"
                                        draggable
                                        onDragStart={event => setPaletteDragText(event, button.text)}
                                        onClick={() => insertText(button.text, button.cursorOffset)}
                                    >
                                        {t(`panel.svgs.attrPanel.calculations.${button.labelKey}`, {
                                            defaultValue: button.fallbackLabel,
                                        })}
                                    </Button>
                                ))}
                            </Flex>
                        </Box>
                    </VStack>
                </Box>
            )}
        </VStack>
    );
};
