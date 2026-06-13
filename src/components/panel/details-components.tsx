import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Flex,
    Heading,
    Text,
    Textarea,
} from '@chakra-ui/react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import React from 'react';
import { MdArrowDownward, MdArrowUpward, MdClose } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useRootDispatch, useRootSelector } from '../../redux';
import { addComponent, deleteComponent, setComponents, setComponentValue } from '../../redux/param/param-slice';
import {
    ComponentsType,
    ComponentsTypeOptions,
    getComponentOptionValues,
    normalizeComponentOptionValue,
    normalizeComponentOptions,
} from '../../constants/components';
import { backupParam, openPaletteAppClip } from '../../redux/runtime/runtime-slice';
import { nanoid } from '../../util/helper';
import { defaultColorTheme, normalizeTheme } from '../../constants/constants';
import ThemeButton from './theme-button';

const normalizeDefaultValue = (type: ComponentsType, value: unknown, options?: string[]) => {
    if (type === 'switch') return Boolean(value);
    if (type === 'number') return Number.isNaN(Number(value)) ? 0 : Number(value);
    if (type === 'color') return normalizeTheme(value, defaultColorTheme);
    if (type === 'option') return normalizeComponentOptionValue(value, options ?? normalizeComponentOptions([], value));
    return value === undefined || value === null ? '' : String(value);
};

const createComponentLabel = (id: string) => `param_${id}`;

const parseOptionText = (text: string): string[] =>
    Array.from(
        new Set(
            text
                .split(/\r?\n/)
                .map(option => option.trim())
                .filter(option => option.length > 0)
        )
    );

const optionValuesToSelectOptions = (options: string[]): Record<string, string> =>
    Object.fromEntries(options.map(option => [option, option]));

const createComponentTypeOptions = (t: (key: string) => string): Record<ComponentsType, string> =>
    Object.fromEntries(
        Object.keys(ComponentsTypeOptions).map(type => [type, t(`panel.components.types.${type}`)])
    ) as Record<ComponentsType, string>;

interface OptionValuesEditorProps {
    defaultValue: unknown;
    options: string[];
    onChange: (options: string[]) => void;
}

const OptionValuesEditor = (props: OptionValuesEditorProps) => {
    const { defaultValue, options, onChange } = props;
    const optionText = options.join('\n');
    const [text, setText] = React.useState(optionText);

    React.useEffect(() => {
        setText(optionText);
    }, [optionText]);

    return (
        <Textarea
            value={text}
            resize="vertical"
            onChange={event => {
                const nextText = event.target.value;
                setText(nextText);
                onChange(parseOptionText(nextText));
            }}
            onBlur={() => {
                setText(normalizeComponentOptions(parseOptionText(text), defaultValue).join('\n'));
            }}
        />
    );
};

export function DetailsComponents() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const {
        paletteAppClip: { output },
    } = useRootSelector(state => state.runtime);
    const { t } = useTranslation();
    const requestedColorIndexRef = React.useRef<number>();
    const paramRef = React.useRef(param);
    const componentTypeOptions = React.useMemo(() => createComponentTypeOptions(t), [t]);

    React.useEffect(() => {
        paramRef.current = param;
    }, [param]);

    React.useEffect(() => {
        const requestedColorIndex = requestedColorIndexRef.current;
        if (requestedColorIndex !== undefined && output) {
            requestedColorIndexRef.current = undefined;
            const currentParam = paramRef.current;
            const component = currentParam.components[requestedColorIndex];
            if (component?.type === 'color') {
                dispatch(backupParam(currentParam));
                dispatch(
                    setComponentValue({
                        index: requestedColorIndex,
                        value: { ...component, defaultValue: output },
                    })
                );
            }
        }
    }, [dispatch, output?.toString()]);

    const handleAddNewComponent = () => {
        const id = nanoid();
        const name = `Parameter ${param.components.length + 1}`;
        dispatch(backupParam(param));
        dispatch(
            addComponent({
                id,
                label: createComponentLabel(id),
                name,
                type: 'text',
                defaultValue: 'text',
            })
        );
    };

    const handleMove = (index: number, d: number) => {
        const dest = index + d;
        if (dest >= 0 && dest < param.components.length) {
            dispatch(backupParam(param));
            dispatch(
                setComponents(
                    param.components
                        .filter((s, i) => i < Math.min(index, dest))
                        .concat(param.components[Math.max(index, dest)])
                        .concat(
                            param.components.filter((s, i) => i > Math.min(index, dest) && i < Math.max(index, dest))
                        )
                        .concat(param.components[Math.min(index, dest)])
                        .concat(param.components.filter((s, i) => i > Math.max(index, dest)))
                )
            );
        }
    };

    const p = param.components.map((c, index) => {
        const { id, label, type, defaultValue, name, constraints } = c;
        const optionValues = type === 'option' ? getComponentOptionValues(c) : [];
        const optionSelectOptions = optionValuesToSelectOptions(optionValues);
        const field: RmgFieldsField[] = [
            {
                label: t('panel.components.name'),
                type: 'input',
                value: name ?? label,
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(setComponentValue({ index: index, value: { ...c, name: v } }));
                },
            },
            {
                label: t('panel.common.type'),
                type: 'select',
                options: componentTypeOptions,
                value: type,
                onChange: v => {
                    const nextType = v as ComponentsType;
                    const nextOptionValues =
                        nextType === 'option' ? normalizeComponentOptions(constraints?.options, defaultValue) : [];
                    dispatch(backupParam(param));
                    dispatch(
                        setComponentValue({
                            index: index,
                            value: {
                                ...c,
                                type: nextType,
                                defaultValue: normalizeDefaultValue(nextType, defaultValue, nextOptionValues),
                                value:
                                    c.value === undefined
                                        ? undefined
                                        : normalizeDefaultValue(nextType, c.value, nextOptionValues),
                                constraints:
                                    nextType === 'number'
                                        ? { step: 1, ...constraints }
                                        : nextType === 'option'
                                          ? { ...constraints, options: nextOptionValues }
                                          : constraints,
                            },
                        })
                    );
                },
            },
            {
                label: t('panel.components.defaultValue'),
                type: 'input',
                value: defaultValue,
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(
                        setComponentValue({
                            index: index,
                            value: { ...c, defaultValue: normalizeDefaultValue(type, v) },
                        })
                    );
                },
                hidden: type === 'switch' || type === 'color' || type === 'option',
            },
            {
                label: t('panel.components.defaultValue'),
                type: 'select',
                options: optionSelectOptions,
                value: normalizeComponentOptionValue(defaultValue, optionValues),
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(
                        setComponentValue({
                            index: index,
                            value: { ...c, defaultValue: normalizeComponentOptionValue(v, optionValues) },
                        })
                    );
                },
                hidden: type !== 'option',
            },
            {
                label: t('panel.components.defaultValue'),
                type: 'switch',
                isChecked: defaultValue,
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(setComponentValue({ index: index, value: { ...c, defaultValue: v } }));
                },
                hidden: type !== 'switch',
            },
            {
                label: t('panel.components.defaultValue'),
                type: 'custom',
                component: (
                    <ThemeButton
                        theme={normalizeTheme(defaultValue, defaultColorTheme)}
                        onClick={() => {
                            requestedColorIndexRef.current = index;
                            dispatch(openPaletteAppClip(normalizeTheme(defaultValue, defaultColorTheme)));
                        }}
                    />
                ),
                hidden: type !== 'color',
            },
            {
                label: t('panel.components.options'),
                type: 'custom',
                component: (
                    <OptionValuesEditor
                        defaultValue={defaultValue}
                        options={optionValues}
                        onChange={nextRawOptions => {
                            const nextOptions = normalizeComponentOptions(nextRawOptions, defaultValue);
                            dispatch(backupParam(param));
                            dispatch(
                                setComponentValue({
                                    index: index,
                                    value: {
                                        ...c,
                                        defaultValue: normalizeComponentOptionValue(defaultValue, nextOptions),
                                        value:
                                            c.value === undefined
                                                ? undefined
                                                : normalizeComponentOptionValue(c.value, nextOptions),
                                        constraints: { ...constraints, options: nextOptions },
                                    },
                                })
                            );
                        }}
                    />
                ),
                helper: t('panel.components.optionsHelper'),
                hidden: type !== 'option',
            },
            {
                label: t('panel.components.minimum', { defaultValue: 'Minimum' }),
                type: 'input',
                value: constraints?.min?.toString() ?? '',
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(
                        setComponentValue({
                            index: index,
                            value: {
                                ...c,
                                constraints: {
                                    ...constraints,
                                    min: v === '' ? undefined : Number(v),
                                },
                            },
                        })
                    );
                },
                hidden: type !== 'number',
            },
            {
                label: t('panel.components.maximum', { defaultValue: 'Maximum' }),
                type: 'input',
                value: constraints?.max?.toString() ?? '',
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(
                        setComponentValue({
                            index: index,
                            value: {
                                ...c,
                                constraints: {
                                    ...constraints,
                                    max: v === '' ? undefined : Number(v),
                                },
                            },
                        })
                    );
                },
                hidden: type !== 'number',
            },
            {
                label: t('panel.components.step', { defaultValue: 'Step' }),
                type: 'input',
                value: constraints?.step?.toString() ?? '1',
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(
                        setComponentValue({
                            index: index,
                            value: {
                                ...c,
                                constraints: {
                                    ...constraints,
                                    step: v === '' ? undefined : Number(v),
                                },
                            },
                        })
                    );
                },
                hidden: type !== 'number',
            },
            {
                label: '',
                type: 'custom',
                oneLine: true,
                component: (
                    <>
                        <Button size="md" onClick={() => handleMove(index, -1)}>
                            <MdArrowUpward />
                        </Button>
                        <Button size="md" onClick={() => handleMove(index, 1)}>
                            <MdArrowDownward />
                        </Button>
                        <Button
                            size="md"
                            onClick={() => {
                                dispatch(backupParam(param));
                                dispatch(deleteComponent(index));
                            }}
                        >
                            <MdClose />
                        </Button>
                    </>
                ),
            },
        ];

        return (
            <AccordionItem key={id}>
                <AccordionButton p={2}>
                    <Box as="span" flex="1" textAlign="left">
                        {name ?? label}
                    </Box>
                    <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                    <RmgFields fields={field} />
                </AccordionPanel>
            </AccordionItem>
        );
    });

    return (
        <Flex width="100%" height="100%" direction="column" overflow="auto">
            <Flex p={2}>
                <Heading p={2} fontSize="x-large" width="100%">
                    {t('panel.components.title')}
                </Heading>
                <Button onClick={handleAddNewComponent}>+</Button>
            </Flex>
            <Box width="100%" height="100%" overflow="scroll">
                {p.length > 0 ? (
                    <Accordion width="100%" allowMultiple>
                        {...p}
                    </Accordion>
                ) : (
                    <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
                        <Text textAlign="center">
                            {t('panel.components.tips1')} <Button size="sm">+</Button> {t('panel.components.tips2')}
                        </Text>
                    </Flex>
                )}
            </Box>
        </Flex>
    );
}
