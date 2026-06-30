import React from 'react';
import { getSmoothPathCenterlineD, getWidthStopGeometry } from '../../util/smooth-path';
import type {
    SmoothPathEditable,
    SmoothPathHandleSelection,
    SmoothPathHandleSize,
} from './smooth-path-editor-controller';
import type { SmoothPathOverlayHandlers } from './use-smooth-path-editor';

interface SmoothPathOverlayProps {
    selectedSmoothPath?: SmoothPathEditable;
    handleSize: SmoothPathHandleSize;
    handleSelection: SmoothPathHandleSelection;
    handlers: SmoothPathOverlayHandlers;
}

export const SmoothPathOverlay = (props: SmoothPathOverlayProps) => {
    const { selectedSmoothPath, handleSize, handleSelection, handlers } = props;
    if (!selectedSmoothPath) return null;

    const centerlineD = getSmoothPathCenterlineD(selectedSmoothPath.model);

    return (
        <g
            transform={`translate(${selectedSmoothPath.origin.x}, ${selectedSmoothPath.origin.y})`}
            onPointerMove={handlers.onOverlayPointerMove}
            onPointerUp={handlers.onOverlayPointerUp}
            onPointerCancel={handlers.onOverlayPointerUp}
        >
            <path
                d={centerlineD}
                fill="none"
                stroke="transparent"
                strokeWidth={handleSize.hitStrokeWidth}
                pointerEvents="stroke"
                onPointerDown={handlers.onPathPointerDown}
                onDoubleClick={handlers.onPathDoubleClick}
            />
            <path
                d={centerlineD}
                fill="none"
                stroke="#3182CE"
                strokeWidth={handleSize.guideStrokeWidth}
                strokeDasharray={handleSize.dashArray}
                pointerEvents="none"
            />
            {selectedSmoothPath.model.points.map(point => {
                const isSelected =
                    handleSelection?.kind === 'point' &&
                    handleSelection.elemId === selectedSmoothPath.elem.id &&
                    handleSelection.id === point.id;
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
                        onDoubleClick={event => handlers.onPointDoubleClick(point.id, event)}
                    />
                );
            })}
            {selectedSmoothPath.model.widthStops.map(stop => {
                const geometry = getWidthStopGeometry(selectedSmoothPath.model, stop.id);
                if (!geometry) return null;

                const isSelected =
                    handleSelection?.kind === 'width' &&
                    handleSelection.elemId === selectedSmoothPath.elem.id &&
                    handleSelection.id === stop.id;
                const fill = isSelected ? '#C53030' : '#E53E3E';

                return (
                    <g key={stop.id}>
                        <line
                            x1={geometry.start.x}
                            y1={geometry.start.y}
                            x2={geometry.end.x}
                            y2={geometry.end.y}
                            stroke={fill}
                            strokeWidth={handleSize.strokeWidth}
                            pointerEvents="none"
                        />
                        <circle
                            cx={geometry.center.x}
                            cy={geometry.center.y}
                            r={isSelected ? handleSize.selectedWidthStopRadius : handleSize.widthStopRadius}
                            fill={fill}
                            stroke="#FFFFFF"
                            strokeWidth={handleSize.strokeWidth}
                            cursor="grab"
                            onPointerDown={event => handlers.onWidthPositionPointerDown(stop.id, event)}
                            onContextMenu={event => handlers.onWidthContextMenu(stop.id, event)}
                        />
                        <circle
                            cx={geometry.start.x}
                            cy={geometry.start.y}
                            r={isSelected ? handleSize.selectedWidthStopRadius : handleSize.widthStopRadius}
                            fill={fill}
                            stroke="#FFFFFF"
                            strokeWidth={handleSize.strokeWidth}
                            cursor="ew-resize"
                            onPointerDown={event => handlers.onWidthSizePointerDown(stop.id, event)}
                            onContextMenu={event => handlers.onWidthContextMenu(stop.id, event)}
                        />
                    </g>
                );
            })}
        </g>
    );
};
