import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Checkbox,
    Flex,
    Heading,
    HStack,
    Input,
    Text,
    Textarea,
    VStack,
} from '@chakra-ui/react';
import { RmgAutoComplete, RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowDownward, MdArrowUpward, MdClose, MdDriveFileMoveOutline, MdError, MdUpload } from 'react-icons/md';
import { useRootDispatch, useRootSelector } from '../../redux';
import {
    addSelected,
    backupParam,
    clearGlobalAlerts,
    removeGlobalAlert,
    removeSelected,
} from '../../redux/runtime/runtime-slice';
import { setCore, setSvgs } from '../../redux/param/param-slice';
import { Id, SvgsElem } from '../../constants/constants';
import { supportsChildren } from '../../util/svgTagWithChildren';
import { MoveChildrenModal } from './details-svgs-move-children';
import svgs from '../svgs/module/svgs';
import { SvgsType } from '../../constants/svgs';
import type { AttrBinding, AttrLiteralValue } from '../../constants/attr-binding';
import type { Components } from '../../constants/components';
import { ATTR_GROUP_LABELS, ATTR_GROUP_ORDER, AttrGroup, AttrVisualRole } from '../../constants/svg-attr-presets';
import {
    compileAttrBindingToLegacyAttr,
    evaluateAttrBinding,
    getComponentDisplayName,
    legacyAttrToBinding,
    resolveVariableToken,
} from '../../util/attr-binding';
import {
    getAttrControl,
    getAttrUiMeta,
    getDefaultAttrBinding,
    getGroupedAttrKeys,
    getSvgAttrLabel,
    getSvgAttrMetadata,
} from '../../util/svg-attr-metadata';
import { getComponentsWithColor } from '../../util/save';
import {
    ExpressionBlock,
    ExpressionBlockKind,
    expressionBlocksToText,
    expressionTextToBlocks,
    getExpressionBlockKind,
} from '../../util/expression-blocks';

interface VariableOption {
    id: string;
    value: string;
    token: string;
    componentId: string;
    path?: string;
}

interface AttrOption {
    id: string;
    value: string;
    recommended: boolean;
}

interface EditableExpressionBlock extends ExpressionBlock {
    id: string;
}

interface ExpressionBlockInputHandle {
    insertText: (text: string) => void;
}

const blockIndexDragType = 'application/x-rmp-attr-block-index';
const blockTextDragType = 'application/x-rmp-attr-block-text';

const blockStyle: Record<ExpressionBlockKind, { bg: string; borderColor: string; color: string }> = {
    literal: { bg: 'gray.50', borderColor: 'gray.200', color: 'gray.800' },
    variable: { bg: 'blue.50', borderColor: 'blue.200', color: 'blue.800' },
    operator: { bg: 'orange.50', borderColor: 'orange.200', color: 'orange.800' },
    function: { bg: 'purple.50', borderColor: 'purple.200', color: 'purple.800' },
    punctuation: { bg: 'yellow.50', borderColor: 'yellow.200', color: 'yellow.800' },
};

const expressionButtons = [
    { label: '+', text: ' + ' },
    { label: '-', text: ' - ' },
    { label: '×', text: ' * ' },
    { label: '÷', text: ' / ' },
    { label: '最小值', text: 'Math.min(, )', cursorOffset: 9 },
    { label: '最大值', text: 'Math.max(, )', cursorOffset: 9 },
    { label: '四舍五入', text: 'Math.round()', cursorOffset: 11 },
    { label: '绝对值', text: 'Math.abs()', cursorOffset: 9 },
    { label: '向下取整', text: 'Math.floor()', cursorOffset: 11 },
    { label: '向上取整', text: 'Math.ceil()', cursorOffset: 10 },
    { label: '如果', text: ' ?  : ', cursorOffset: 1 },
];

const createVariableOptions = (components: Components[]): VariableOption[] =>
    components.flatMap(component => {
        if (component.type === 'color') {
            return [
                {
                    id: `${component.id}:hex`,
                    value: getComponentDisplayName(component),
                    token: getComponentDisplayName(component),
                    componentId: component.id,
                    path: 'hex',
                },
                {
                    id: `${component.id}:text`,
                    value: `${getComponentDisplayName(component)}文字色`,
                    token: `${getComponentDisplayName(component)}文字色`,
                    componentId: component.id,
                    path: 'text',
                },
            ];
        }
        return [
            {
                id: component.id,
                value: getComponentDisplayName(component),
                token: getComponentDisplayName(component),
                componentId: component.id,
            },
        ];
    });

const stringifyValue = (value: unknown) =>
    typeof value === 'object' ? JSON.stringify(value) : value === undefined || value === null ? '' : String(value);

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const getBlockWidth = (block: ExpressionBlock) => `${Math.min(220, Math.max(28, block.text.length * 8 + 18))}px`;

const insertEditableExpressionText = (
    blocks: EditableExpressionBlock[],
    text: string,
    createId: () => string,
    index = blocks.length
): EditableExpressionBlock[] => {
    const inserted = expressionTextToBlocks(text).map(block => ({ ...block, id: createId() }));
    return [...blocks.slice(0, index), ...inserted, ...blocks.slice(index)];
};

const moveEditableExpressionBlock = (
    blocks: EditableExpressionBlock[],
    fromIndex: number,
    toIndex: number
): EditableExpressionBlock[] => {
    if (fromIndex < 0 || fromIndex >= blocks.length || toIndex < 0) return blocks;
    const next = [...blocks];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(Math.min(toIndex, next.length), 0, moved);
    return next;
};

const setPaletteDragText = (event: React.DragEvent, text: string) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(blockTextDragType, text);
    event.dataTransfer.setData('text/plain', text);
};

const attrTextKey = (attrKey: string, field: 'title' | 'description' | 'effectHint' | 'unitHint') =>
    `panel.svgs.attrs.${attrKey}.${field}`;

const getBindingToken = (binding: { componentId: string; path?: string }, components: Components[]) => {
    const component = components.find(c => c.id === binding.componentId || c.label === binding.componentId);
    if (!component) return binding.componentId;
    const displayName = getComponentDisplayName(component);
    if (component.type === 'color' && binding.path === 'text') return `${displayName}文字色`;
    return displayName;
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

const coerceLiteralValue = (elemType: string, attrKey: string, value: string): AttrLiteralValue => {
    const control = getAttrControl(elemType, attrKey);
    const trimmed = value.trim();

    if (control.type === 'number' && trimmed !== '' && !Number.isNaN(Number(trimmed))) {
        return Number(trimmed);
    }
    if (control.type === 'switch') {
        return ['true', '1', 'yes', 'on', '是'].includes(trimmed.toLowerCase());
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

const editorTextToBinding = (elemType: string, attrKey: string, value: string, components: Components[]): AttrBinding => {
    const trimmed = value.trim();
    const exactToken = trimmed.match(/^\{([^{}]+)\}$/);
    if (exactToken) {
        const variable = resolveVariableToken(exactToken[1], components);
        if (variable) return { kind: 'variable', componentId: variable.componentId, path: variable.path };
    }
    if (isFormulaText(value)) return { kind: 'formula', expression: value };
    return { kind: 'literal', value: coerceLiteralValue(elemType, attrKey, value) };
};

const getBindingForAttr = (attrKey: string, elem: SvgsElem, components: Components[]): AttrBinding => {
    if (elem.attrBindings?.[attrKey]) return elem.attrBindings[attrKey];
    if (elem.attrs[attrKey]) return legacyAttrToBinding(elem.attrs[attrKey], components);
    return getDefaultAttrBinding(elem.type, attrKey);
};

const updateAttrBinding = (
    elem: SvgsElem,
    attrKey: string,
    binding: AttrBinding,
    components: Components[]
): { attrs: Record<string, string>; attrBindings: Record<string, AttrBinding> } => {
    const attrBindings = { ...(elem.attrBindings ?? {}), [attrKey]: binding };
    return {
        attrBindings,
        attrs: {
            ...elem.attrs,
            [attrKey]: compileAttrBindingToLegacyAttr(binding, components),
        },
    };
};

const removeAttrBinding = (elem: SvgsElem, attrKey: string) => {
    const { [attrKey]: _removedAttr, ...attrs } = elem.attrs;
    const { [attrKey]: _removedBinding, ...attrBindings } = elem.attrBindings ?? {};
    return { attrs, attrBindings };
};

const AttrAddControl = (props: { elem: SvgsElem; existingKeys: string[]; onAdd: (attr: string) => void }) => {
    const { elem, existingKeys, onAdd } = props;
    const { t } = useTranslation();
    const metadata = getSvgAttrMetadata(elem.type, existingKeys);
    const existing = new Set(existingKeys);
    const options: AttrOption[] = [
        ...metadata.recommendedAttrs.map(attr => ({
            id: attr,
            value: t(attrTextKey(attr, 'title'), { defaultValue: getSvgAttrLabel(elem.type, attr) }),
            recommended: true,
        })),
        ...metadata.advancedAttrs.map(attr => ({
            id: attr,
            value: t(attrTextKey(attr, 'title'), { defaultValue: getSvgAttrLabel(elem.type, attr) }),
            recommended: false,
        })),
    ].filter(option => !existing.has(option.id));
    const [selected, setSelected] = React.useState<AttrOption | undefined>(options[0]);

    React.useEffect(() => {
        setSelected(options[0]);
    }, [elem.id, existingKeys.join('|')]);

    if (options.length === 0) return null;

    return (
        <HStack width="100%" alignItems="stretch">
            <Box flex="1">
                <RmgAutoComplete
                    data={options}
                    value={selected?.value ?? ''}
                    displayHandler={item => `${item.value}${item.recommended ? ' *' : ''}`}
                    filter={(query, item) =>
                        `${item.id} ${item.value}`.toLowerCase().includes(query.toLowerCase())
                    }
                    onChange={setSelected}
                />
            </Box>
            <Button
                onClick={() => {
                    if (selected) onAdd(selected.id);
                }}
            >
                +
            </Button>
        </HStack>
    );
};

const ExpressionBlockInput = React.forwardRef<ExpressionBlockInputHandle, {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
}>((props, ref) => {
    const { value, placeholder, onChange } = props;
    const { t } = useTranslation();
    const blockIdRef = React.useRef(0);
    const createId = React.useCallback(() => `attr-block-${blockIdRef.current++}`, []);
    const createEditableBlocks = React.useCallback(
        (text: string): EditableExpressionBlock[] =>
            expressionTextToBlocks(text).map(block => ({ ...block, id: createId() })),
        [createId]
    );
    const [blocks, setBlocks] = React.useState<EditableExpressionBlock[]>(() => createEditableBlocks(value));
    const [draft, setDraft] = React.useState('');
    const [isEditing, setIsEditing] = React.useState(false);
    const committedValueRef = React.useRef(value);

    React.useEffect(() => {
        if (!isEditing && value !== committedValueRef.current) {
            committedValueRef.current = value;
            setBlocks(createEditableBlocks(value));
        }
    }, [createEditableBlocks, isEditing, value]);

    const commitEditing = (nextBlocks = blocks, nextDraft = draft) => {
        const blocksWithDraft = nextDraft.trim()
            ? insertEditableExpressionText(nextBlocks, nextDraft, createId)
            : nextBlocks;
        const cleanBlocks = blocksWithDraft.filter(block => block.text.trim() !== '');
        const nextValue = expressionBlocksToText(cleanBlocks);
        committedValueRef.current = nextValue;
        setBlocks(cleanBlocks);
        setDraft('');
        setIsEditing(false);
        if (nextValue !== value) onChange(nextValue);
    };

    const cancelEditing = () => {
        committedValueRef.current = value;
        setBlocks(createEditableBlocks(value));
        setDraft('');
        setIsEditing(false);
    };

    const commitDraftLocally = () => {
        if (!draft.trim()) return;
        setBlocks(insertEditableExpressionText(blocks, draft, createId));
        setDraft('');
    };

    const insertTextLocally = React.useCallback(
        (text: string) => {
            setIsEditing(true);
            setBlocks(currentBlocks => insertEditableExpressionText(currentBlocks, text, createId));
        },
        [createId]
    );

    React.useImperativeHandle(ref, () => ({ insertText: insertTextLocally }), [insertTextLocally]);

    const updateBlockText = (index: number, text: string) => {
        setBlocks(
            blocks.map((block, blockIndex) =>
                blockIndex === index ? { ...block, text, kind: getExpressionBlockKind(text.trim()) } : block
            )
        );
    };

    const handleDrop = (event: React.DragEvent, index: number) => {
        event.preventDefault();
        event.stopPropagation();

        const sourceIndexText = event.dataTransfer.getData(blockIndexDragType);
        if (sourceIndexText !== '') {
            const sourceIndex = Number(sourceIndexText);
            if (Number.isInteger(sourceIndex)) {
                const targetIndex = sourceIndex < index ? Math.max(0, index - 1) : index;
                setBlocks(moveEditableExpressionBlock(blocks, sourceIndex, targetIndex));
            }
            return;
        }

        const droppedText = event.dataTransfer.getData(blockTextDragType) || event.dataTransfer.getData('text/plain');
        if (droppedText) {
            setBlocks(insertEditableExpressionText(blocks, droppedText, createId, index));
        }
    };

    const handleDropAtEnd = (event: React.DragEvent) => {
        event.preventDefault();
        const sourceIndexText = event.dataTransfer.getData(blockIndexDragType);
        if (sourceIndexText !== '') {
            const sourceIndex = Number(sourceIndexText);
            if (Number.isInteger(sourceIndex)) {
                setBlocks(moveEditableExpressionBlock(blocks, sourceIndex, blocks.length));
            }
            return;
        }

        const droppedText = event.dataTransfer.getData(blockTextDragType) || event.dataTransfer.getData('text/plain');
        if (droppedText) {
            setBlocks(insertEditableExpressionText(blocks, droppedText, createId));
        }
    };

    return (
        <Flex
            minH="40px"
            width="100%"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"
            bg="white"
            px={2}
            py={1}
            gap={1}
            wrap="wrap"
            alignItems="center"
            onDragOver={isEditing ? event => event.preventDefault() : undefined}
            onDrop={isEditing ? handleDropAtEnd : undefined}
            onDoubleClick={() => setIsEditing(true)}
            _focusWithin={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
        >
            {!isEditing && blocks.length === 0 && (
                <Text color="gray.400" fontSize="sm" flex="1">
                    {placeholder}
                </Text>
            )}
            {blocks.map((block, index) => {
                const style = blockStyle[block.kind];
                return (
                    <HStack
                        key={block.id}
                        spacing={1}
                        px={1}
                        py="2px"
                        borderWidth="1px"
                        borderRadius="md"
                        bg={style.bg}
                        borderColor={style.borderColor}
                        color={style.color}
                        onDragOver={isEditing ? event => event.preventDefault() : undefined}
                        onDrop={isEditing ? event => handleDrop(event, index) : undefined}
                    >
                        {isEditing && (
                            <Box
                                draggable
                                cursor="grab"
                                color="gray.500"
                                fontSize="xs"
                                fontWeight="bold"
                                title={t('panel.svgs.attrPanel.dragBlock')}
                                onDragStart={event => {
                                    event.dataTransfer.effectAllowed = 'move';
                                    event.dataTransfer.setData(blockIndexDragType, String(index));
                                    event.dataTransfer.setData('text/plain', block.text);
                                }}
                            >
                                ::
                            </Box>
                        )}
                        {isEditing ? (
                            <Input
                                variant="unstyled"
                                size="xs"
                                value={block.text}
                                width={getBlockWidth(block)}
                                minW="28px"
                                fontWeight={block.kind === 'operator' ? 'bold' : 'medium'}
                                onChange={event => updateBlockText(index, event.target.value)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        commitEditing();
                                    }
                                    if (event.key === 'Escape') {
                                        event.preventDefault();
                                        cancelEditing();
                                    }
                                }}
                            />
                        ) : (
                            <Text px={1} fontSize="sm" fontWeight={block.kind === 'operator' ? 'bold' : 'medium'}>
                                {block.text}
                            </Text>
                        )}
                        {isEditing && (
                            <Button
                                size="xs"
                                minW="18px"
                                h="18px"
                                p={0}
                                variant="ghost"
                                title={t('panel.svgs.attrPanel.deleteBlock')}
                                onClick={() => setBlocks(blocks.filter((_block, blockIndex) => blockIndex !== index))}
                            >
                                x
                            </Button>
                        )}
                    </HStack>
                );
            })}
            {isEditing && (
                <Input
                    variant="unstyled"
                    size="sm"
                    flex="1"
                    minW="96px"
                    value={draft}
                    placeholder={blocks.length > 0 ? t('panel.svgs.attrPanel.blockInput') : placeholder}
                    onChange={event => setDraft(event.target.value)}
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            commitDraftLocally();
                        }
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            cancelEditing();
                        }
                    }}
                />
            )}
            <HStack ml="auto" spacing={1}>
                {isEditing ? (
                    <>
                        <Button size="xs" colorScheme="blue" onClick={() => commitEditing()}>
                            {t('panel.svgs.attrPanel.doneEditing')}
                        </Button>
                        <Button size="xs" variant="ghost" onClick={cancelEditing}>
                            {t('panel.svgs.attrPanel.cancelEditing')}
                        </Button>
                    </>
                ) : (
                    <Button size="xs" variant="outline" onClick={() => setIsEditing(true)}>
                        {t('panel.svgs.attrPanel.editBlocks')}
                    </Button>
                )}
            </HStack>
        </Flex>
    );
});

const ExpressionValueControl = (props: {
    elemType: string;
    attrKey: string;
    binding: AttrBinding;
    components: Components[];
    variableOptions: VariableOption[];
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
    const isLargeInput = ['textarea', 'path', 'points', 'style'].includes(control.type) || value.length > 60;
    const supportsBlockInput = !isLargeInput;
    const quickOptions = control.type === 'select' && control.options ? Object.entries(control.options) : undefined;

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
                            onChange={handleTextChange}
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
                <Button variant="outline" onClick={() => setIsPanelOpen(!isPanelOpen)}>
                    {isPanelOpen ? t('panel.svgs.attrPanel.collapse') : t('panel.svgs.attrPanel.insertValue')}
                </Button>
            </HStack>

            {quickOptions && (
                <Flex wrap="wrap" gap={1} alignItems="center">
                    <Text fontSize="xs" color="gray.500" mr={1}>
                        {t('panel.svgs.attrPanel.common')}
                    </Text>
                    {quickOptions.map(([key, label]) => (
                        <Button key={key} size="xs" variant={value === key ? 'solid' : 'outline'} onClick={() => handleTextChange(key)}>
                            {label}
                        </Button>
                    ))}
                </Flex>
            )}

            {!quickOptions && quickValues && quickValues.length > 0 && (
                <Flex wrap="wrap" gap={1} alignItems="center">
                    <Text fontSize="xs" color="gray.500" mr={1}>
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
                <Box borderWidth="1px" borderRadius="md" bg="gray.50" p={2}>
                    <VStack align="stretch" spacing={2}>
                        {variableOptions.length > 0 && (
                            <Box>
                                <Text fontSize="xs" color="gray.600" mb={1}>
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
                            <Text fontSize="xs" color="gray.600" mb={1}>
                                {t('panel.svgs.attrPanel.insertCalculation')}
                            </Text>
                            <Flex wrap="wrap" gap={1}>
                                {expressionButtons.map(button => (
                                    <Button
                                        key={button.label}
                                        size="xs"
                                        variant="outline"
                                        draggable
                                        onDragStart={event => setPaletteDragText(event, button.text)}
                                        onClick={() => insertText(button.text, button.cursorOffset)}
                                    >
                                        {button.label}
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

const roleColor: Record<AttrVisualRole, string> = {
    x: 'blue.500',
    y: 'cyan.500',
    width: 'purple.500',
    height: 'pink.500',
    radius: 'orange.500',
    fill: 'green.500',
    stroke: 'red.500',
    text: 'gray.700',
    opacity: 'teal.500',
    transform: 'yellow.600',
};

const roleLabel: Record<AttrVisualRole, string> = {
    x: 'X',
    y: 'Y',
    width: 'W',
    height: 'H',
    radius: 'R',
    fill: '色',
    stroke: '边',
    text: '文',
    opacity: '%',
    transform: '↗',
};

const VisualRoleMarker = (props: { role?: AttrVisualRole }) => {
    const { role } = props;
    const { t } = useTranslation();
    const color = role ? roleColor[role] : 'gray.400';
    const label = role ? t(`panel.svgs.attrRoles.${role}`, { defaultValue: roleLabel[role] }) : '?';
    return (
        <Flex
            width="34px"
            height="34px"
            flex="0 0 34px"
            alignItems="center"
            justifyContent="center"
            borderRadius="md"
            color="white"
            bg={color}
            fontWeight="bold"
            fontSize="sm"
        >
            {label}
        </Flex>
    );
};

const AttrBindingRow = (props: {
    elem: SvgsElem;
    attrKey: string;
    binding: AttrBinding;
    components: Components[];
    variableOptions: VariableOption[];
    isVirtual: boolean;
    onChange: (key: string, binding: AttrBinding) => void;
    onRemove: (key: string) => void;
}) => {
    const { elem, attrKey, binding, components, variableOptions, isVirtual, onChange, onRemove } = props;
    const { t } = useTranslation();
    const result = evaluateAttrBinding(binding, { components });
    const meta = getAttrUiMeta(elem.type, attrKey);
    const isMore = meta.group === 'more';
    const title = t(attrTextKey(attrKey, 'title'), { defaultValue: meta.title });
    const description = t(attrTextKey(attrKey, 'description'), { defaultValue: meta.description });
    const effectHint = meta.effectHint
        ? t(attrTextKey(attrKey, 'effectHint'), { defaultValue: meta.effectHint })
        : undefined;
    const unitHint = meta.unitHint ? t(attrTextKey(attrKey, 'unitHint'), { defaultValue: meta.unitHint }) : undefined;

    return (
        <Box borderWidth="1px" borderRadius="md" p={3} mb={2} bg="white" opacity={isVirtual ? 0.78 : 1}>
            <HStack alignItems="start" spacing={3}>
                <VisualRoleMarker role={meta.visualRole} />
                <Box width="34%" minW="136px">
                    <Text fontWeight="semibold">{title}</Text>
                    <Text fontSize="xs" color="gray.600">
                        {description}
                    </Text>
                    {effectHint && (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            {effectHint}
                        </Text>
                    )}
                    {unitHint && (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            {t('panel.svgs.attrPanel.unit')}: {unitHint}
                        </Text>
                    )}
                    {isMore && (
                        <Text fontSize="xs" color="gray.400" mt={1}>
                            {t('panel.svgs.attrPanel.svgAttribute')}: {attrKey}
                        </Text>
                    )}
                </Box>
                <Box flex="1">
                    <ExpressionValueControl
                        elemType={elem.type}
                        attrKey={attrKey}
                        binding={binding}
                        components={components}
                        variableOptions={variableOptions}
                        quickValues={meta.quickValues}
                        onChange={next => onChange(attrKey, next)}
                    />
                </Box>
                <Button
                    onClick={() => onRemove(attrKey)}
                    variant="outline"
                    isDisabled={isVirtual}
                    title={t('panel.svgs.attrPanel.removeAttr')}
                >
                    <MdClose />
                </Button>
            </HStack>
            <Box pl="46px" mt={2}>
                <Text fontSize="xs" color={result.error ? 'red.500' : 'gray.500'}>
                    {result.error
                        ? `${t('panel.svgs.attrPanel.error')}: ${result.error}`
                        : `${t('panel.svgs.attrPanel.currentValue')}: ${stringifyValue(result.value)}`}
                </Text>
            </Box>
        </Box>
    );
};

const AttrGroupPanel = (props: {
    group: AttrGroup;
    keys: string[];
    elem: SvgsElem;
    components: Components[];
    variableOptions: VariableOption[];
    onChange: (key: string, binding: AttrBinding) => void;
    onRemove: (key: string) => void;
}) => {
    const { group, keys, elem, components, variableOptions, onChange, onRemove } = props;
    const { t } = useTranslation();
    if (keys.length === 0) return null;

    return (
        <Box mb={4}>
            <Heading fontSize="md" mb={2}>
                {t(`panel.svgs.attrGroups.${group}`, { defaultValue: ATTR_GROUP_LABELS[group] })}
            </Heading>
            {keys.map(key => (
                <AttrBindingRow
                    key={key}
                    elem={elem}
                    attrKey={key}
                    binding={getBindingForAttr(key, elem, components)}
                    components={components}
                    variableOptions={variableOptions}
                    isVirtual={!(key in elem.attrs) && !(key in (elem.attrBindings ?? {}))}
                    onChange={onChange}
                    onRemove={onRemove}
                />
            ))}
        </Box>
    );
};

const VisualAttrPanel = (props: {
    elem: SvgsElem;
    components: Components[];
    variableOptions: VariableOption[];
    onChange: (key: string, binding: AttrBinding) => void;
    onRemove: (key: string) => void;
    onAdd: (key: string) => void;
}) => {
    const { elem, components, variableOptions, onChange, onRemove, onAdd } = props;
    const { t } = useTranslation();
    const grouped = getGroupedAttrKeys(elem.type, elem.attrs, elem.attrBindings);
    const visualGroups = ATTR_GROUP_ORDER.filter(group => group !== 'more' && grouped[group].length > 0);
    const visualKeys = unique(visualGroups.flatMap(group => grouped[group]));
    const moreKeys = grouped.more.filter(key => !visualKeys.includes(key));
    const allVisibleKeys = unique([...visualKeys, ...moreKeys]);

    return (
        <VStack align="stretch" spacing={0}>
            {visualGroups.map(group => (
                <AttrGroupPanel
                    key={group}
                    group={group}
                    keys={grouped[group]}
                    elem={elem}
                    components={components}
                    variableOptions={variableOptions}
                    onChange={onChange}
                    onRemove={onRemove}
                />
            ))}

            <Accordion allowToggle mb={2}>
                <AccordionItem borderWidth="1px" borderRadius="md">
                    <AccordionButton>
                        <Box flex="1" textAlign="left" fontWeight="semibold">
                            {t('panel.svgs.attrGroups.more', { defaultValue: ATTR_GROUP_LABELS.more })}
                        </Box>
                        <Text fontSize="xs" color="gray.500" mr={2}>
                            {t('panel.svgs.attrPanel.itemCount', { count: moreKeys.length })}
                        </Text>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={3}>
                        {moreKeys.length > 0 ? (
                            moreKeys.map(key => (
                                <AttrBindingRow
                                    key={key}
                                    elem={elem}
                                    attrKey={key}
                                    binding={getBindingForAttr(key, elem, components)}
                                    components={components}
                                    variableOptions={variableOptions}
                                    isVirtual={!(key in elem.attrs) && !(key in (elem.attrBindings ?? {}))}
                                    onChange={onChange}
                                    onRemove={onRemove}
                                />
                            ))
                        ) : (
                            <Text fontSize="sm" color="gray.500" mb={2}>
                                {t('panel.svgs.attrPanel.emptyMore')}
                            </Text>
                        )}
                        <AttrAddControl elem={elem} existingKeys={allVisibleKeys} onAdd={onAdd} />
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </VStack>
    );
};

export function DetailsSvgs() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const { globalAlerts, selected } = useRootSelector(store => store.runtime);
    const { t } = useTranslation();
    const components = React.useMemo(() => getComponentsWithColor(param), [param.components, param.color]);
    const variableOptions = React.useMemo(() => createVariableOptions(components), [components]);

    const handleMove = (index: number, d: number, path: number[]) => {
        const dfsMove = (data: SvgsElem[], path: number[], p: number): SvgsElem[] => {
            if (index >= path.length) {
                const dest = index + d;
                if (dest >= 0 && dest < data.length) {
                    return data
                        .filter((s, i) => i < Math.min(index, dest))
                        .concat(data[Math.max(index, dest)])
                        .concat(data.filter((s, i) => i > Math.min(index, dest) && i < Math.max(index, dest)))
                        .concat(data[Math.min(index, dest)])
                        .concat(data.filter((s, i) => i > Math.max(index, dest)));
                } else {
                    return data;
                }
            }
            const newChildren = dfsMove(data[path[p]].children!, path, p + 1);
            return data
                .filter((s, i) => i < path[p])
                .concat([{ ...data[path[p]], children: newChildren }])
                .concat(data.filter((s, i) => i > path[p]));
        };
        dispatch(backupParam(param));
        dispatch(setSvgs(dfsMove(param.svgs, path, 0)));
    };

    const handleSetValue = (
        id: string,
        key: 'type' | 'label' | 'attrs' | 'attrBindings',
        value: string | Record<string, string> | Record<string, AttrBinding>,
        path: number[]
    ) => {
        const dfsChangeValue = (
            data: SvgsElem,
            key: 'type' | 'label' | 'attrs' | 'attrBindings',
            value: string | Record<string, string> | Record<string, AttrBinding>,
            index: number
        ): SvgsElem => {
            if (index >= path.length) {
                if (key === 'attrs') return { ...data, attrs: value as Record<string, string> };
                if (key === 'attrBindings') return { ...data, attrBindings: value as Record<string, AttrBinding> };
                return { ...data, [key]: value as string };
            }
            const newChildren = structuredClone(data.children!);
            newChildren[path[index]] = dfsChangeValue(data.children![path[index]], key, value, index + 1);
            return { ...data, children: newChildren };
        };
        const newSvgs = structuredClone(param.svgs);
        newSvgs[path[0]] = dfsChangeValue(newSvgs[path[0]], key, value, 1);
        dispatch(backupParam(param));
        dispatch(setSvgs(newSvgs));
        dispatch(removeGlobalAlert(id));
    };

    const handleSetAttrsAndBindings = (
        elem: SvgsElem,
        attrs: Record<string, string>,
        attrBindings: Record<string, AttrBinding>,
        path: number[]
    ) => {
        const dfsPatch = (data: SvgsElem, index: number): SvgsElem => {
            if (index >= path.length) {
                return { ...data, attrs, attrBindings };
            }
            const newChildren = structuredClone(data.children!);
            newChildren[path[index]] = dfsPatch(data.children![path[index]], index + 1);
            return { ...data, children: newChildren };
        };
        const newSvgs = structuredClone(param.svgs);
        newSvgs[path[0]] = dfsPatch(newSvgs[path[0]], 1);
        dispatch(backupParam(param));
        dispatch(setSvgs(newSvgs));
        dispatch(removeGlobalAlert(elem.id));
    };

    const handleRemove = (id: string, path: number[]) => {
        const dfsRemove = (data: SvgsElem[], index: number): SvgsElem[] => {
            if (index + 1 >= path.length) {
                return data.filter((s, i) => i !== path[index]);
            }
            const newChildren = dfsRemove(data[path[index]].children!, index + 1);
            return data
                .filter((s, i) => i < path[index])
                .concat([{ ...data[path[index]], children: newChildren.length === 0 ? undefined : newChildren }])
                .concat(data.filter((c, i) => i > path[index]));
        };
        dispatch(backupParam(param));
        dispatch(setSvgs(dfsRemove(param.svgs, 0)));
        dispatch(clearGlobalAlerts());
    };

    const [isMoveChildrenOpen, setIsMoveChildrenOpen] = React.useState(false);
    const [moveChildrenId, setMoveChildrenId] = React.useState<number[]>([]);
    const [moveChildrenElem, setMoveChildrenElem] = React.useState<SvgsElem>();

    const dfsField = (svgs: SvgsElem[], path: number[], father: Id) =>
        svgs.toReversed().map((s, index) => {
            const i = svgs.length - index - 1;
            const currentPath = [...path, i];
            const field: RmgFieldsField[] = [
                {
                    label: t('panel.common.label'),
                    type: 'input',
                    value: s.label,
                    onChange: value => handleSetValue(s.id, 'label', value, currentPath),
                },
                {
                    label: t('panel.common.type'),
                    type: 'input',
                    value: s.type,
                    onChange: value => handleSetValue(s.id, 'type', value, currentPath),
                },
                {
                    label: t('panel.svgs.core'),
                    type: 'switch',
                    isChecked: param.core ? param.core === s.id : false,
                    onChange: value => {
                        dispatch(setCore(value ? s.id : undefined));
                    },
                    hidden: param.type !== 'Station',
                },
                {
                    label: '',
                    type: 'custom',
                    oneLine: true,
                    component: (
                        <>
                            <Button size="md" onClick={() => handleMove(i, 1, path)}>
                                <MdArrowUpward />
                            </Button>
                            <Button size="md" onClick={() => handleMove(i, -1, path)}>
                                <MdArrowDownward />
                            </Button>
                            <Button
                                size="md"
                                onClick={() => {
                                    setMoveChildrenId(currentPath);
                                    setMoveChildrenElem(s);
                                    setIsMoveChildrenOpen(true);
                                    dispatch(backupParam(param));
                                }}
                            >
                                <MdDriveFileMoveOutline />
                            </Button>
                            <Button size="md" onClick={() => handleRemove(s.id, currentPath)}>
                                <MdClose />
                            </Button>
                        </>
                    ),
                },
            ];

            const displayChildren = s.children ? dfsField(s.children, currentPath, s.id) : [];
            const displayTextChildrenButton =
                supportsChildren(s.type) && displayChildren.length === 0 && !('_rmp_children_text' in s.attrs) ? (
                    <Button
                        width="100%"
                        onClick={() => {
                            const next = updateAttrBinding(
                                s,
                                '_rmp_children_text',
                                getDefaultAttrBinding(s.type, '_rmp_children_text'),
                                components
                            );
                            handleSetAttrsAndBindings(s, next.attrs, next.attrBindings, currentPath);
                        }}
                    >
                        {t('panel.svgs.addTextChildren')}
                    </Button>
                ) : null;
            const handleCheck = (e: React.ChangeEvent) => {
                e.stopPropagation();
                if (selected.has(s.id)) {
                    dispatch(removeSelected(s.id));
                    if (selected.has(father)) {
                        dispatch(removeSelected(father));
                    }
                } else {
                    dispatch(addSelected(s.id));
                }
            };
            return (
                <AccordionItem key={s.id}>
                    <AccordionButton p={2}>
                        <Checkbox isChecked={selected.has(s.id) || selected.has(father)} onChange={handleCheck} />
                        <Box mr={2} />
                        <Box as="span" flex="1" textAlign="left">
                            <Text as="span" fontWeight="bold">
                                {s.label}
                            </Text>{' '}
                            <Text as="span">&lt;{s.type}&gt;</Text>
                        </Box>
                        {globalAlerts.has(s.id) ? <MdError color="#D9534F" title={globalAlerts.get(s.id)} /> : ''}
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        <RmgFields fields={field} />
                        <VisualAttrPanel
                            elem={s}
                            components={components}
                            variableOptions={variableOptions}
                            onChange={(attrKey, nextBinding) => {
                                const next = updateAttrBinding(s, attrKey, nextBinding, components);
                                handleSetAttrsAndBindings(s, next.attrs, next.attrBindings, currentPath);
                            }}
                            onRemove={attrKey => {
                                const next = removeAttrBinding(s, attrKey);
                                handleSetAttrsAndBindings(s, next.attrs, next.attrBindings, currentPath);
                            }}
                            onAdd={attr => {
                                const next = updateAttrBinding(s, attr, getDefaultAttrBinding(s.type, attr), components);
                                handleSetAttrsAndBindings(s, next.attrs, next.attrBindings, currentPath);
                            }}
                        />
                        <HStack width="100%" pb={2}>
                            {displayTextChildrenButton}
                        </HStack>
                        {displayChildren}
                    </AccordionPanel>
                </AccordionItem>
            );
        });

    return (
        <>
            <Flex width="100%" height="100%" direction="column" overflow="auto">
                <Flex p={2}>
                    <Heading fontSize="x-large" p={2}>
                        {t('panel.svgs.title')}
                    </Heading>
                </Flex>
                <Box width="100%" height="100%" overflow="scroll">
                    {param.svgs.length > 0 ? (
                        <Accordion width="100%" allowMultiple>
                            {dfsField(param.svgs, [], 'id_@root')}
                        </Accordion>
                    ) : (
                        <Flex height="100%" width="100%" justifyContent="center" alignItems="center" direction="column">
                            <Text textAlign="center">
                                {t('panel.svgs.tipsA1')}
                                <Button size="sm" variant="outline" m={1}>
                                    <MdUpload />
                                </Button>
                                {t('panel.svgs.tipsA2')}
                            </Text>
                            <br />
                            <Text textAlign="center">
                                {t('panel.svgs.tipsB1')}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={svgs[SvgsType.Rect].icon}
                                    sx={{
                                        justifyContent: 'flex-start',
                                        p: 1,
                                        m: 1,
                                        h: 10,
                                    }}
                                >
                                    Rectangle
                                </Button>
                                {t('panel.svgs.tipsB2')}
                            </Text>
                        </Flex>
                    )}
                </Box>
            </Flex>
            <MoveChildrenModal
                isOpen={isMoveChildrenOpen}
                onClose={() => setIsMoveChildrenOpen(false)}
                param={param}
                path={moveChildrenId}
                movedElem={moveChildrenElem!}
            />
        </>
    );
}
