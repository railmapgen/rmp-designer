import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useToast,
} from '@chakra-ui/react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { defaultTransform, SvgsElem } from '../../constants/constants';
import { VariableFunction } from '../../constants/variable-function';
import { useRootDispatch } from '../../redux';
import { setLabel, setSvgs, setTransform } from '../../redux/param/param-slice';
import { nanoid } from '../../util/helper';

export function isBase64Svg(svgString: string) {
    const imageTagRegex = /<image*/;
    const match = svgString.match(imageTagRegex);
    return !!match;
}

export const loadSvgs = (svgString: string): SvgsElem[] => {
    function isGarbageAttr(attrName: string): boolean {
        return (
            attrName.startsWith('sodipodi:') ||
            attrName.startsWith('inkscape:') ||
            attrName.startsWith('xmlns:') ||
            attrName.startsWith('xml:space')
        );
    }

    function isGarbageNode(tagName: string): boolean {
        return ['sodipodi:namedview', 'metadata', 'rdf:RDF', 'cc:Work', 'dc:format', 'dc:type', 'dc:title'].includes(
            tagName
        );
    }

    function dfs(element: Element): SvgsElem | null {
        if (isGarbageNode(element.tagName)) {
            return null;
        }

        const attributes: Record<string, VariableFunction> = {};
        Array.from(element.attributes).forEach(attr => {
            if (isGarbageAttr(attr.name)) return;
            attributes[attr.name] = { type: 'value', value: attr.value.trim() };
        });

        if (element.tagName !== 'g' && element.textContent?.trim()) {
            attributes['_rmp_children_text'] = { type: 'value', value: element.textContent.trim() };
        }

        const children: SvgsElem[] = [];
        Array.from(element.children).forEach(child => {
            const parsed = dfs(child);
            if (parsed) children.push(parsed);
        });

        return {
            id: `id_${nanoid(10)}`,
            type: element.tagName,
            label: nanoid(5),
            attrs: attributes,
            children: children.length ? children : undefined,
        };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    const svgRoot = doc.documentElement;
    const svgElements = dfs(svgRoot);

    return svgElements?.children ?? [];
};

export const ImportFromSvg = (props: { isOpen: boolean; onClose: () => void }) => {
    const { isOpen, onClose } = props;
    const { t } = useTranslation();
    const dispatch = useRootDispatch();
    const toast = useToast();

    const [svgString, setSvgString] = React.useState('');
    const field: RmgFieldsField[] = [
        {
            label: 'SVG',
            type: 'textarea',
            value: '',
            onChange: v => setSvgString(v),
        },
    ];

    const handleImport = () => {
        if (isBase64Svg(svgString)) {
            toast({
                title: 'SVG format not available',
                status: 'error' as const,
                duration: 9000,
                isClosable: true,
            });
            return;
        }
        dispatch(setSvgs(loadSvgs(svgString)));
        dispatch(setLabel(`SVG ${nanoid(5)}`));
        dispatch(setTransform(defaultTransform));
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{t('header.import.pasteSVG')}</ModalHeader>
                <ModalCloseButton />

                <ModalBody paddingBottom={10}>
                    <RmgFields fields={field} minW="full" />
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" variant="outline" mr="1" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button colorScheme="red" mr="1" onClick={handleImport}>
                        {t('apply')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
