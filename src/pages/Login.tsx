import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../store/TournamentContext';
import { useI18n } from '../store/I18nContext';
import './Login.css';

const Login: React.FC = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useTournament();
    const { t } = useI18n();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                if (!email.trim() || !username.trim() || !password.trim()) throw new Error(t('login.allFieldsReq'));
                await register(email, username, password);
            } else {
                if (!email.trim() || !password.trim()) throw new Error(t('login.allFieldsReq'));
                await login(email, password);
            }
            navigate('/');
        } catch (err: any) {
            setError(err.message || t('login.authFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass-panel animate-fade-in">
                <div className="login-header">
                    <span className="login-icon">🃏</span>
                    <h2>{isRegister ? t('login.createAccount') : t('login.welcomeBack')}</h2>
                    <p className="text-muted">
                        {isRegister ? t('login.joinPrompt') : t('login.signInPrompt')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div style={{ color: '#ff4444', backgroundColor: 'rgba(255, 68, 68, 0.1)', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid rgba(255, 68, 68, 0.3)', fontSize: '14px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    {isRegister && (
                        <div className="form-group">
                            <label htmlFor="username" className="form-label">{t('login.username')}</label>
                            <input
                                type="text"
                                id="username"
                                className="form-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t('login.usernamePlaceholder')}
                                required={isRegister}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">{t('login.email')}</label>
                        <input
                            type="email"
                            id="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('login.emailPlaceholder')}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label htmlFor="password" className="form-label">{t('login.password')}</label>
                        <input
                            type="password"
                            id="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('login.passwordPlaceholder')}
                            required
                        />
                    </div>

                    <button disabled={loading} type="submit" className="btn btn-primary w-full">
                        {loading ? t('login.processing') : (isRegister ? t('login.signUp') : t('login.signIn'))}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '14px' }}
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError('');
                            }}
                        >
                            {isRegister ? t('login.haveAccount') : t('login.needAccount')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
