import './ColorSwatchPicker.css';
import { STATUS_COLOR_PALETTE } from '../../lib/statusColor';

interface ColorSwatchPickerProps {
    value: string;
    onChange: (hex: string) => void;
}

function ColorSwatchPicker({ value, onChange }: ColorSwatchPickerProps) {
    const isCustom = !STATUS_COLOR_PALETTE.includes(value);

    return (
        <div className="color-swatch-picker">
            {STATUS_COLOR_PALETTE.map(hex => (
                <button
                    key={hex}
                    type="button"
                    className={`color-swatch${value === hex ? ' is-selected' : ''}`}
                    style={{ '--swatch-color': hex } as React.CSSProperties}
                    onClick={() => onChange(hex)}
                    aria-label={`Choose color ${hex}`}
                    title={hex}
                />
            ))}

            {/* Escape hatch for an arbitrary color; native input is visually hidden,
                the label just shows a swatch styled to hint "more colors" */}
            <label
                className={`color-swatch color-swatch-custom${isCustom ? ' is-selected' : ''}`}
                style={isCustom ? ({ '--swatch-color': value } as React.CSSProperties) : undefined}
                title="Custom color"
            >
                {!isCustom && (
                    <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M10 4v12M4 10h12" />
                    </svg>
                )}
                <input
                    type="color"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="color-swatch-custom-input"
                />
            </label>
        </div>
    );
}

export default ColorSwatchPicker;