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
    HStack,
    Text,
    useColorModeValue,
    VStack,
} from '@chakra-ui/react';
import { RmgAutoComplete } from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose } from 'react-icons/md';
import type { AttrBinding } from '../../../constants/attr-binding';
import type { Components } from '../../../constants/components';
import type { SvgsElem } from '../../../constants/constants';
import type { SvgPanelAttrOption, SvgPanelVariableOption } from '../../../constants/svg-panel-options';
import { ATTR_GROUP_LABELS, ATTR_GROUP_ORDER, AttrGroup, AttrVisualRole } from '../../../constants/svg-attr-presets';
import { evaluateAttrBinding } from '../../../util/attr-binding';
import {
    getAttrUiMeta,
    getGroupedAttrKeys,
    getSvgAttrLabel,
    getSvgAttrMetadata,
} from '../../../util/svg-attr-metadata';
import { ExpressionValueControl } from './expression-value-control';
import { attrTextKey, getBindingForAttr, stringifyValue, unique } from '../../../util/svg-panel';

const AttrAddControl = (props: { elem: SvgsElem; existingKeys: string[]; onAdd: (attr: string) => void }) => {
    const { elem, existingKeys, onAdd } = props;
    const { t } = useTranslation();
    const existingKeySignature = existingKeys.join('|');
    const options: SvgPanelAttrOption[] = React.useMemo(() => {
        const metadata = getSvgAttrMetadata(elem.type, existingKeys);
        const existing = new Set(existingKeys);
        return [
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
    }, [elem.type, existingKeySignature, t]);
    const [selected, setSelected] = React.useState<SvgPanelAttrOption | undefined>(options[0]);

    React.useEffect(() => {
        setSelected(options[0]);
    }, [elem.id, existingKeySignature, options]);

    if (options.length === 0) return null;

    return (
        <HStack width="100%" alignItems="stretch">
            <Box flex="1">
                <RmgAutoComplete
                    data={options}
                    value={selected?.value ?? ''}
                    displayHandler={item => `${item.value}${item.recommended ? ' *' : ''}`}
                    filter={(query, item) => `${item.id} ${item.value}`.toLowerCase().includes(query.toLowerCase())}
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
    fill: 'F',
    stroke: 'S',
    text: 'T',
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
    variableOptions: SvgPanelVariableOption[];
    isVirtual: boolean;
    onChange: (key: string, binding: AttrBinding) => void;
    onRemove: (key: string) => void;
}) => {
    const { elem, attrKey, binding, components, variableOptions, isVirtual, onChange, onRemove } = props;
    const { t } = useTranslation();
    const result = React.useMemo(() => evaluateAttrBinding(binding, { components }), [binding, components]);
    const meta = React.useMemo(() => getAttrUiMeta(elem.type, attrKey), [attrKey, elem.type]);
    const isMore = meta.group === 'more';
    const title = t(attrTextKey(attrKey, 'title'), { defaultValue: meta.title });
    const description = t(attrTextKey(attrKey, 'description'), { defaultValue: meta.description });
    const effectHint = t(attrTextKey(attrKey, 'effectHint'), { defaultValue: meta.effectHint ?? '' }) || undefined;
    const unitHint = meta.unitHint ? t(attrTextKey(attrKey, 'unitHint'), { defaultValue: meta.unitHint }) : undefined;
    const rowBg = useColorModeValue('white', 'gray.800');
    const descriptionColor = useColorModeValue('gray.600', 'gray.300');
    const mutedColor = useColorModeValue('gray.500', 'gray.400');
    const subtleColor = useColorModeValue('gray.400', 'gray.500');

    return (
        <Box borderWidth="1px" borderRadius="md" p={3} mb={2} bg={rowBg} opacity={isVirtual ? 0.78 : 1}>
            <HStack alignItems="start" spacing={3}>
                <VisualRoleMarker role={meta.visualRole} />
                <Box width="34%" minW="136px">
                    <Text fontWeight="semibold">{title}</Text>
                    <Text fontSize="xs" color={descriptionColor}>
                        {description}
                    </Text>
                    {effectHint && (
                        <Text fontSize="xs" color={mutedColor} mt={1}>
                            {effectHint}
                        </Text>
                    )}
                    {unitHint && (
                        <Text fontSize="xs" color={mutedColor} mt={1}>
                            {t('panel.svgs.attrPanel.unit')}: {unitHint}
                        </Text>
                    )}
                    {isMore && (
                        <Text fontSize="xs" color={subtleColor} mt={1}>
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
                <Text fontSize="xs" color={result.error ? 'red.500' : mutedColor}>
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
    variableOptions: SvgPanelVariableOption[];
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

export const VisualAttrPanel = (props: {
    elem: SvgsElem;
    components: Components[];
    variableOptions: SvgPanelVariableOption[];
    onChange: (key: string, binding: AttrBinding) => void;
    onRemove: (key: string) => void;
    onAdd: (key: string) => void;
}) => {
    const { elem, components, variableOptions, onChange, onRemove, onAdd } = props;
    const { t } = useTranslation();
    const grouped = React.useMemo(
        () => getGroupedAttrKeys(elem.type, elem.attrs, elem.attrBindings),
        [elem.attrs, elem.attrBindings, elem.type]
    );
    const visualGroups = React.useMemo(
        () => ATTR_GROUP_ORDER.filter(group => group !== 'more' && grouped[group].length > 0),
        [grouped]
    );
    const visualKeys = React.useMemo(
        () => unique(visualGroups.flatMap(group => grouped[group])),
        [grouped, visualGroups]
    );
    const moreKeys = React.useMemo(() => grouped.more.filter(key => !visualKeys.includes(key)), [grouped, visualKeys]);
    const allVisibleKeys = React.useMemo(() => unique([...visualKeys, ...moreKeys]), [moreKeys, visualKeys]);
    const mutedColor = useColorModeValue('gray.500', 'gray.400');

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
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton>
                                <Box flex="1" textAlign="left" fontWeight="semibold">
                                    {t('panel.svgs.attrGroups.more', { defaultValue: ATTR_GROUP_LABELS.more })}
                                </Box>
                                <Text fontSize="xs" color={mutedColor} mr={2}>
                                    {t('panel.svgs.attrPanel.itemCount', { count: moreKeys.length })}
                                </Text>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={3}>
                                {isExpanded &&
                                    (moreKeys.length > 0 ? (
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
                                        <Text fontSize="sm" color={mutedColor} mb={2}>
                                            {t('panel.svgs.attrPanel.emptyMore')}
                                        </Text>
                                    ))}
                                {isExpanded && (
                                    <AttrAddControl elem={elem} existingKeys={allVisibleKeys} onAdd={onAdd} />
                                )}
                            </AccordionPanel>
                        </>
                    )}
                </AccordionItem>
            </Accordion>
        </VStack>
    );
};
