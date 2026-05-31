import { Box, Button, Flex, HStack, Input, Text, useColorModeValue } from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Components } from '../../../constants/components';
import { getComponentDisplayName, resolveVariableToken } from '../../../util/attr-binding';
import {
    ExpressionBlock,
    ExpressionBlockKind,
    expressionBlocksToText,
    expressionTextToBlocks,
    getExpressionBlockKind,
} from '../../../util/expression-blocks';

interface EditableExpressionBlock extends ExpressionBlock {
    id: string;
}

export interface ExpressionBlockInputHandle {
    insertText: (text: string) => void;
}

const blockIndexDragType = 'application/x-rmp-attr-block-index';
const blockTextDragType = 'application/x-rmp-attr-block-text';

const blockStyleLight: Record<ExpressionBlockKind, { bg: string; borderColor: string; color: string }> = {
    literal: { bg: 'gray.50', borderColor: 'gray.200', color: 'gray.800' },
    variable: { bg: 'blue.50', borderColor: 'blue.200', color: 'blue.800' },
    operator: { bg: 'orange.50', borderColor: 'orange.200', color: 'orange.800' },
    function: { bg: 'purple.50', borderColor: 'purple.200', color: 'purple.800' },
    punctuation: { bg: 'yellow.50', borderColor: 'yellow.200', color: 'yellow.800' },
};

const blockStyleDark: Record<ExpressionBlockKind, { bg: string; borderColor: string; color: string }> = {
    literal: { bg: 'gray.700', borderColor: 'gray.600', color: 'gray.50' },
    variable: { bg: 'blue.900', borderColor: 'blue.600', color: 'blue.100' },
    operator: { bg: 'orange.900', borderColor: 'orange.600', color: 'orange.100' },
    function: { bg: 'purple.900', borderColor: 'purple.600', color: 'purple.100' },
    punctuation: { bg: 'yellow.900', borderColor: 'yellow.600', color: 'yellow.100' },
};

const getBlockWidth = (text: string) => `${Math.min(220, Math.max(28, text.length * 8 + 18))}px`;

const getExpressionBlockDisplayText = (
    block: ExpressionBlock,
    components: Components[],
    t: (key: string) => string
): string => {
    if (block.kind !== 'variable') return block.text;

    const token = block.text.match(/^\{([^{}]+)\}$/)?.[1];
    if (!token) return block.text;

    const variable = resolveVariableToken(token, components);
    if (!variable) return block.text;

    const component = components.find(c => c.id === variable.componentId || c.label === variable.componentId);
    if (!component) return block.text;

    const displayName = getComponentDisplayName(component);
    if (component.type !== 'color') return displayName;
    if (variable.path === 'text') return `${displayName} · ${t('panel.svgs.attrPanel.textColor')}`;
    return `${displayName} · ${t('panel.svgs.attrPanel.mainColor')}`;
};

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

export const setPaletteDragText = (event: React.DragEvent, text: string) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(blockTextDragType, text);
    event.dataTransfer.setData('text/plain', text);
};

export const ExpressionBlockInput = React.forwardRef<
    ExpressionBlockInputHandle,
    {
        value: string;
        placeholder: string;
        components: Components[];
        onChange: (value: string) => void;
        onEditModeChange?: (isEditing: boolean) => void;
    }
>((props, ref) => {
    const { value, placeholder, components, onChange, onEditModeChange } = props;
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
    const containerBg = useColorModeValue('white', 'gray.800');
    const containerBorder = useColorModeValue('gray.200', 'gray.600');
    const placeholderColor = useColorModeValue('gray.400', 'gray.500');
    const dragHandleColor = useColorModeValue('gray.500', 'gray.400');
    const blockStyles = useColorModeValue(blockStyleLight, blockStyleDark);

    React.useEffect(() => {
        if (!isEditing && value !== committedValueRef.current) {
            committedValueRef.current = value;
            setBlocks(createEditableBlocks(value));
        }
    }, [createEditableBlocks, isEditing, value]);

    const startEditing = () => {
        setIsEditing(true);
        onEditModeChange?.(true);
    };

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
        onEditModeChange?.(false);
        if (nextValue !== value) onChange(nextValue);
    };

    const cancelEditing = () => {
        committedValueRef.current = value;
        setBlocks(createEditableBlocks(value));
        setDraft('');
        setIsEditing(false);
        onEditModeChange?.(false);
    };

    const commitDraftLocally = () => {
        if (!draft.trim()) return;
        setBlocks(insertEditableExpressionText(blocks, draft, createId));
        setDraft('');
    };

    const insertTextLocally = React.useCallback(
        (text: string) => {
            setIsEditing(true);
            onEditModeChange?.(true);
            setBlocks(currentBlocks => insertEditableExpressionText(currentBlocks, text, createId));
        },
        [createId, onEditModeChange]
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
            borderColor={containerBorder}
            borderRadius="md"
            bg={containerBg}
            px={2}
            py={1}
            gap={1}
            wrap="wrap"
            alignItems="center"
            onDragOver={isEditing ? event => event.preventDefault() : undefined}
            onDrop={isEditing ? handleDropAtEnd : undefined}
            onDoubleClick={startEditing}
            _focusWithin={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
        >
            {!isEditing && blocks.length === 0 && (
                <Text color={placeholderColor} fontSize="sm" flex="1">
                    {placeholder}
                </Text>
            )}
            {blocks.map((block, index) => {
                const style = blockStyles[block.kind];
                const displayText = getExpressionBlockDisplayText(block, components, t);
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
                                color={dragHandleColor}
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
                        {isEditing && block.kind !== 'variable' ? (
                            <Input
                                variant="unstyled"
                                size="xs"
                                value={block.text}
                                width={getBlockWidth(displayText)}
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
                                {displayText}
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
                    <Button size="xs" variant="outline" onClick={startEditing}>
                        {t('panel.svgs.attrPanel.editBlocks')}
                    </Button>
                )}
            </HStack>
        </Flex>
    );
});

ExpressionBlockInput.displayName = 'ExpressionBlockInput';
