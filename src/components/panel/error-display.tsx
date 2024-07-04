import React from 'react';
import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export const ErrorDisplay = (props: { isOpen: boolean; onClose: () => void; errorList: Array<string[]> }) => {
    const { isOpen, onClose, errorList } = props;
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader></ModalHeader>

                <ModalBody>
                    <TableContainer>
                        <Table variant="striped" colorScheme="orange">
                            <Thead>
                                <Tr>
                                    <Th>Error Code</Th>
                                    <Th>Error Message</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {errorList.map((error, index) => (
                                    <Tr key={index}>
                                        <Td>{error[0]}</Td>
                                        <Td>{error[1]}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" variant="outline" mr="1" onClick={onClose}>
                        {t('close')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
