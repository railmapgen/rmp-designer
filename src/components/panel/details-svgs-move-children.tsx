import React from 'react';
import {
    Box,
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    VStack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useRootDispatch } from '../../redux';
import { setSvgs } from '../../redux/param/param-slice';
import { Param, SvgsElem } from '../../constants/constants';
import { supportsChildren } from '../../util/svgTagWithChildren';

export const MoveChildrenModal = (props: {
    isOpen: boolean;
    onClose: () => void;
    param: Param;
    path: number[];
    movedElem: SvgsElem;
}) => {
    const { isOpen, onClose, param, path: selectedPath, movedElem } = props;
    const dispatch = useRootDispatch();
    const { t } = useTranslation();

    const [destPath, setDestPath] = React.useState<number[] | undefined>(undefined);

    const dfsGetOptions = (svgs: SvgsElem[], path: number[]) => {
        return (
            <VStack p={5} width="100%">
                {svgs.map((s, i) => {
                    if (!supportsChildren(s.type) || [...path, i].toString() === selectedPath.toString()) {
                        return;
                    }
                    return (
                        <VStack key={s.id} width="100%">
                            <Button
                                width="100%"
                                onClick={() => {
                                    setDestPath([...path, i]);
                                    onClose();
                                }}
                            >
                                <Text as="span" fontWeight="bold">
                                    {s.label}
                                </Text>
                                <Box mr={2} />
                                <Text as="span">&lt;{s.type}&gt;</Text>
                            </Button>
                            {s.children && supportsChildren(s.type) && dfsGetOptions(s.children, [...path, i])}
                        </VStack>
                    );
                })}
            </VStack>
        );
    };

    const dfsRemove = (svgs: SvgsElem[], path: number[], index: number): SvgsElem[] => {
        if (index + 1 >= path.length) {
            return svgs.filter((s, i) => i !== path[index]);
        }
        const newChildren = dfsRemove(svgs[path[index]].children!, path, index + 1);
        return svgs
            .filter((s, i) => i < path[index])
            .concat([{ ...svgs[path[index]], children: newChildren }])
            .concat(svgs.filter((s, i) => i > path[index]));
    };

    const dfsPlace = (svgs: SvgsElem[], path: number[], index: number): SvgsElem[] => {
        if (index + 1 >= path.length) {
            const newSvgs = structuredClone(svgs);
            if (newSvgs[path[index]].children !== undefined) {
                newSvgs[path[index]].children!.push(movedElem!);
            } else {
                newSvgs[path[index]].children = [movedElem!];
            }
            return newSvgs;
        }
        const newChildren = dfsPlace(svgs[path[index]].children!, path, index + 1);
        return svgs
            .filter((s, i) => i < path[index])
            .concat([{ ...svgs[path[index]], children: newChildren }])
            .concat(svgs.filter((s, i) => i > path[index]));
    };

    React.useEffect(() => {
        if (!isOpen && destPath !== undefined) {
            console.log(selectedPath, destPath);
            const placedSvgs =
                destPath.length === 0 ? param.svgs.concat([movedElem!]) : dfsPlace(param.svgs, destPath, 0);
            console.log(placedSvgs);
            const deletedSvgs = dfsRemove(placedSvgs, selectedPath, 0);
            console.log(deletedSvgs);
            dispatch(setSvgs(deletedSvgs));
            setDestPath(undefined);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Text as="b" fontSize="xl">
                        Move
                    </Text>
                    <ModalCloseButton />
                </ModalHeader>

                <ModalBody width="100%">{dfsGetOptions(param.svgs, [])}</ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" variant="outline" mr="1" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
