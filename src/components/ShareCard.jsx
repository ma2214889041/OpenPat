import { useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import LobsterSVG from './LobsterSVG';
import './ShareCard.css';

export default function ShareCard({ stats, status, skin, rank, username, petFrameUrl }) {
    const qrRef = useRef(null);

    useEffect(() => {
        if (qrRef.current) {
            QRCode.toCanvas(qrRef.current, window.location.origin, {
                width: 80,
                margin: 0,
                color: {
                    dark: '#ffffff',
                    light: '#00000000'
                }
            });
        }
    }, []);

    return (
        <div className={`share-card theme-${skin}`} id="share-card-content">
            <div className="card-inner">
                <header className="card-header">
                    <div className="brand">
                        <span className="logo">🦞</span>
                        <span className="name">OpenPat</span>
                    </div>
                    <div className="rank-badge">{rank.toUpperCase()}</div>
                </header>

                <main className="card-main">
                    <div className="lobster-display">
                        {petFrameUrl
                          ? <img src={petFrameUrl} alt="pet" className="share-card-pet-img" />
                          : <LobsterSVG status={status} skin={skin} rank={rank} />
                        }
                    </div>

                    <div className="stats-box">
                        <div className="stat-item">
                            <span className="stat-val">{stats.totalTasks || 0}</span>
                            <span className="stat-lbl">Tasks Done</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-val">{Math.round(((stats.tokensInput || 0) + (stats.tokensOutput || 0)) / 1000)}k</span>
                            <span className="stat-lbl">Tokens</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-val">{stats.uptime || 0}m</span>
                            <span className="stat-lbl">Uptime</span>
                        </div>
                    </div>
                </main>

                <footer className="card-footer">
                    <div className="user-info">
                        <p className="user-tag">@{username || 'Anonymous'}</p>
                        <p className="date">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="qr-wrap">
                        <canvas ref={qrRef}></canvas>
                    </div>
                </footer>
            </div>
            <div className="card-decoration-1"></div>
            <div className="card-decoration-2"></div>
        </div>
    );
}
