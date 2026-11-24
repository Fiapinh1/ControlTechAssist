import React from 'react';

export default function DeviceLedMap({
  imageSrc,
  imageAlt = '',
  markers = [],
  stateById = {},
  activeIds = [],
  onMarkerClick,
  renderMarkerEditor,
  className = ''
}) {
  const activeSet = new Set(Array.isArray(activeIds) ? activeIds : [activeIds].filter(Boolean));
  const colorMap = {
    verde: '#22c55e',
    azul: '#2563eb',
    laranja: '#f59e0b',
    vermelho: '#ef4444',
    branco: '#f8fafc'
  };
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const modeClass = value => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'aceso';
  const ledColor = value => {
    const text = normalize(value);
    return Object.entries(colorMap).find(([key]) => text.includes(key))?.[1] || colorMap.verde;
  };

  return (
    <div className={`deviceLedMap ${className}`.trim()}>
      <img src={imageSrc} alt={imageAlt} draggable="false" />
      <div className="deviceLedMapLayer" aria-label="Mapa de LEDs do equipamento">
        {markers.map(marker => {
          const active = activeSet.has(marker.id);
          const state = stateById[marker.id] || marker.state || {};
          const color = ledColor(state.color);
          const mode = modeClass(state.mode);
          const editorHorizontal = marker.x < 24 ? 'from-left' : marker.x > 76 ? 'from-right' : 'from-center';
          const editorVertical = marker.y < 42 ? 'below' : 'above';
          const classes = [
            'deviceLedMarker',
            active ? 'active' : '',
            state.different ? 'different' : '',
            `mode-${mode}`
          ].filter(Boolean).join(' ');
          return (
            <React.Fragment key={marker.id}>
              <button
                type="button"
                className={classes}
                data-led-id={marker.id}
                style={{ left: `${marker.x}%`, top: `${marker.y}%`, '--led-color': color }}
                title={`${marker.label} - ${state.different ? 'diferente do padrão' : 'padrão normal'}`}
                aria-label={`LED ${marker.label}, ${state.different ? 'diferente do padrão' : 'padrão normal'}`}
                aria-pressed={active}
                onClick={() => onMarkerClick?.(marker)}
              >
                <span />
                <em>{marker.label}</em>
              </button>
              {active && renderMarkerEditor && (
                <div
                  className={`deviceLedEditorAnchor ${editorHorizontal} ${editorVertical}`}
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  onClick={event => event.stopPropagation()}
                >
                  {renderMarkerEditor(marker, state)}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
