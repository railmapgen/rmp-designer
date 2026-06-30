import React from 'react';
import { Id, SvgsElem } from '../../constants/constants';
import { Components } from '../../constants/components';
import { supportsChildren } from '../../util/svgTagWithChildren';
import { addGlobalAlert } from '../../redux/runtime/runtime-slice';
import { useRootDispatch, useRootSelector } from '../../redux';
import { evaluateSvgAttrs } from '../../util/attr-binding';

export interface CreateSvgsProps {
    svgsElem: SvgsElem;
    components: Components[];
    prefix: Id[];
    isEditable?: boolean;
    handlePointerDown: (id: Id, path: Id[], e: React.PointerEvent<SVGElement>) => void;
    handlePointerMove: (id: Id, path: Id[], e: React.PointerEvent<SVGElement>) => void;
    handlePointerUp: (id: Id, path: Id[], e: React.PointerEvent<SVGElement>) => void;
}

const CreateSvgsComponent = (props: CreateSvgsProps) => {
    const {
        svgsElem,
        components,
        prefix,
        isEditable = true,
        handlePointerUp,
        handlePointerMove,
        handlePointerDown,
    } = props;
    const { id, type, attrs } = svgsElem;
    const dispatch = useRootDispatch();
    const hasGlobalAlert = useRootSelector(state => state.runtime.globalAlerts.has(id));
    const isSelected = useRootSelector(state => state.runtime.selected.has(id));
    const hasSelected = useRootSelector(state => state.runtime.selected.size > 0);
    const currentPath = React.useMemo(() => [...prefix, id], [id, prefix]);

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerDown(id, currentPath, e),
        [currentPath, id, handlePointerDown]
    );
    const onPointerMove = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerMove(id, currentPath, e),
        [currentPath, id, handlePointerMove]
    );
    const onPointerUp = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerUp(id, currentPath, e),
        [currentPath, id, handlePointerUp]
    );

    const evaluatedAttrs = React.useMemo(() => {
        if (hasGlobalAlert) return { attrs: {} };
        return evaluateSvgAttrs(attrs, svgsElem.attrBindings, components);
    }, [attrs, svgsElem.attrBindings, components, hasGlobalAlert]);
    const newAttrs = evaluatedAttrs.attrs;
    const styleError =
        'style' in newAttrs && typeof newAttrs.style !== 'object' ? '"style" must be an object!' : undefined;
    const error = evaluatedAttrs.error ?? styleError;

    React.useEffect(() => {
        if (error && !hasGlobalAlert) {
            dispatch(addGlobalAlert({ id: id, str: error }));
        }
    }, [dispatch, error, hasGlobalAlert, id]);

    const Children =
        supportsChildren(type) && svgsElem.children
            ? svgsElem.children.map((s, i) => (
                  <CreateSvgs
                      key={i}
                      svgsElem={s}
                      components={components}
                      prefix={currentPath}
                      isEditable={isEditable}
                      handlePointerDown={handlePointerDown}
                      handlePointerMove={handlePointerMove}
                      handlePointerUp={handlePointerUp}
                  />
              ))
            : '_rmp_children_text' in newAttrs
              ? [newAttrs._rmp_children_text as React.ReactNode]
              : [];
    const newStyle =
        'style' in newAttrs && typeof newAttrs.style === 'object'
            ? { ...(newAttrs.style as object), cursor: isEditable ? 'move' : 'default' }
            : { cursor: isEditable ? 'move' : 'default' };
    return (
        <g
            id={`g_${id}`}
            key={`g_${id}`}
            transform={`translate(${newAttrs.x ?? 0}, ${newAttrs.y ?? 0})`}
            opacity={isEditable && !isSelected && hasSelected ? 0.5 : 1}
            pointerEvents={isEditable ? undefined : 'none'}
        >
            {React.createElement(
                type,
                {
                    ...newAttrs,
                    id: id,
                    key: id,
                    x: 0,
                    y: 0,
                    onPointerDown: isEditable ? onPointerDown : undefined,
                    onPointerMove: isEditable ? onPointerMove : undefined,
                    onPointerUp: isEditable ? onPointerUp : undefined,
                    style: newStyle,
                },
                ...Children
            )}
        </g>
    );
};

export const CreateSvgs = React.memo(CreateSvgsComponent);
