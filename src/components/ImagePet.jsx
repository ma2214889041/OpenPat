import { useRef } from 'react';
import { STATES } from '../hooks/useGateway';
import './ImagePet.css';

export default function ImagePet({ status, assets, name, onClick }) {
    const containerRef = useRef(null);

    // Default fallback if assets are missing
    const activeAsset = assets?.[status] || assets?.idle || '/placeholder-pet.png';

    const getStatusLabel = () => {
        switch (status) {
            case STATES.THINKING: return '正在思考...';
            case STATES.TOOL_CALL: return '正在使用工具...';
            case STATES.DONE: return '完成！';
            case STATES.ERROR: return '出现错误';
            case STATES.OFFLINE: return '休眠中...';
            case STATES.TOKEN_EXHAUSTED: return '额度耗尽';
            default: return '';
        }
    };

    return (
        <div
            className={`image-pet image-pet--${status}`}
            onClick={onClick}
            ref={containerRef}
        >
            <div className="image-pet-container">
                <img
                    src={activeAsset}
                    alt={name || 'Pet'}
                    className="pet-sprite"
                />

                {/* State-specific overlays/FX could go here */}
                {status === STATES.THINKING && (
                    <div className="status-indicator thinking-fx">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                )}
            </div>

            {getStatusLabel() && (
                <div className="status-label">{getStatusLabel()}</div>
            )}
        </div>
    );
}
