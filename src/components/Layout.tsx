import React from 'react';
import { useTournament } from '../store/TournamentContext';
import { useI18n } from '../store/I18nContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, PlusCircle, Globe } from 'lucide-react';
import './Layout.css';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { state, logout } = useTournament();
    const { language, setLanguage, t } = useI18n();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'es' : 'en');
    };

    return (
        <div className="layout">
            <header className="header glass-panel">
                <div className="header-content container">
                    <div className="logo" onClick={() => navigate('/dashboard')}>
                        <span className="logo-icon">♠️</span>
                        <h1>Poker Manager</h1>
                    </div>

                    <div className="nav-actions">
                        <span className="user-greeting">{t('nav.welcome', { name: state.user?.username || '' })}</span>

                        <div className="controls">
                            <button className="lang-toggle-btn" onClick={toggleLanguage} title={t('settings.language')}>
                                <Globe size={16} />
                                <span className="lang-text">{language.toUpperCase()}</span>
                            </button>
                        </div>

                        <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
                            <LayoutDashboard size={18} /> {t('nav.dashboard')}
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/create')}>
                            <PlusCircle size={18} /> {t('nav.newTournament')}
                        </button>
                        <button className="btn btn-ghost" onClick={handleLogout}>
                            <LogOut size={18} /> {t('nav.logout')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="main-content container animate-fade-in">
                {children}
            </main>
        </div>
    );
};

