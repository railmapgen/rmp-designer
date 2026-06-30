import React from 'react';
import { serializePolygonPoints } from '../../util/polygon-points';
import type { PolygonEditable, PolygonHandleSelection, PolygonHandleSize } from './polygon-editor-controller';
import type { PolygonOverlayHandlers } from './use-polygon-editor';

interface PolygonOverlayProps {
    selectedPolygon?: PolygonEditable;
    handleSize: PolygonHandleSize;
    handleSelection: PolygonHandleSelection;
    handlers: PolygonOverlayHandlers;
}

export const PolygonOverlay = (props: PolygonOverlayProps) => {
    const { selectedPolygon, handleSize, handleSelection, handlers } = props;
    if (!selectedPolygon) return null;

    const points = serializePolygonPoints(selectedPolygon.points);

    return (
        <g
            transform={`translate(${selectedPolygon.origin.x}, ${selectedPolygon.origin.y})`}
            onPointerMove={handlers.onOverlayPointerMove}
            onPointerUp={handlers.onOverlayPointerUp}
            onPointerCancel={handlers.onOverlayPointerUp}
        >
            <polygon
                points={points}
                fill="none"
                stroke="transparent"
                strokeWidth={handleSize.hitStrokeWidth}
                pointerEvents="stroke"
                onPointerDown={handlers.onPolygonPointerDown}
                onDoubleClick={handlers.onPolygonDoubleClick}
            />
            <polygon
                points={points}
                fill="none"
                stroke="#3182CE"
                strokeWidth={handleSize.guideStrokeWidth}
                strokeDasharray={handleSize.dashArray}
                pointerEvents="none"
            />
            {selectedPolygon.points.map(point => {
                const isSelected =
                    handleSelection?.elemId === selectedPolygon.elem.id && handleSelection.pointId === point.id;

                return (
                    <circle
                        key={point.id}
                        cx={point.x}
                        cy={point.y}
                        r={isSelected ? handleSize.selectedPointRadius : handleSize.pointRadius}
                        fill={isSelected ? '#2B6CB0' : '#3182CE'}
                        stroke="#FFFFFF"
                        strokeWidth={handleSize.strokeWidth}
                        cursor="move"
                        onPointerDown={event => handlers.onPointPointerDown(point.id, event)}
                        onContextMenu={event => handlers.onPointContextMenu(point.id, event)}
                        onDoubleClick={event => event.stopPropagation()}
                    />
                );
            })}
        </g>
    );
};
