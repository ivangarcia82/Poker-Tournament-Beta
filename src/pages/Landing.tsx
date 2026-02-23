import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Users, Trophy, ArrowRight, Play, Coins, ShieldCheck, ChevronRight, Activity } from 'lucide-react';
import { useI18n } from '../store/I18nContext';
import { useTournament } from '../store/TournamentContext';
import './Landing.css';

const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.15, duration: 0.8, ease: easeOut },
    }),
};

const features = [
    { key: 'timer' as const, icon: Timer },
    { key: 'management' as const, icon: Users },
    { key: 'payouts' as const, icon: Trophy },
];

export default function Landing() {
    const navigate = useNavigate();
    const { t, language, setLanguage } = useI18n();
    const { state } = useTournament();

    const [activeFeature, setActiveFeature] = useState(0);
    const [progress, setProgress] = useState(0);
    const [activeFaq, setActiveFaq] = useState<number | null>(0);

    const faqsList = [
        { q: t('landing.faq1.q' as any), a: t('landing.faq1.a' as any) },
        { q: t('landing.faq2.q' as any), a: t('landing.faq2.a' as any) },
        { q: t('landing.faq3.q' as any), a: t('landing.faq3.a' as any) }
    ];

    // If already logged in, redirect to dashboard
    useEffect(() => {
        if (state.user) {
            navigate('/dashboard', { replace: true });
        }
    }, [state.user, navigate]);

    // Auto rotate features
    useEffect(() => {
        const duration = 5000;
        const interval = 50;
        const step = (interval / duration) * 100;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    setActiveFeature((current) => (current + 1) % features.length);
                    return 0;
                }
                return prev + step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [activeFeature]);

    const handleTabClick = (index: number) => {
        setActiveFeature(index);
        setProgress(0);
    };

    if (state.user) return null;

    return (
        <div className="landing-container">
            {/* ── Background Elements ── */}
            <div className="glow-orb orb-1" />
            <div className="glow-orb orb-2" />
            <div className="glow-orb orb-3" />

            <div className="grid-overlay" />

            {/* ── Navigation ── */}
            <nav className="landing-navbar">
                <div className="logo-text">
                    <ShieldCheck size={28} className="logo-icon" />
                    PTM
                </div>
                <div className="nav-actions">
                    <button
                        className="btn-lang"
                        onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                    >
                        {language === 'en' ? '🇪🇸 ES' : '🇺🇸 EN'}
                    </button>
                    <button className="btn-l-ghost" onClick={() => navigate('/login')}>
                        {t('landing.login')}
                    </button>
                    <button className="btn-l-primary" onClick={() => navigate('/login')}>
                        {t('landing.getStarted')}
                    </button>
                </div>
            </nav>

            {/* ── Hero Section ── */}
            <header className="hero-v2">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    className="hero-content-v2"
                >
                    <motion.span
                        className="badge-v2"
                        variants={fadeUp}
                        custom={0}
                    >
                        <Activity size={16} />
                        PREMIUM TOURNAMENT ENGINE
                    </motion.span>

                    <motion.h1
                        className="title-v2"
                        variants={fadeUp}
                        custom={1}
                    >
                        {t('landing.title')}
                    </motion.h1>

                    <motion.p
                        className="subtitle-v2"
                        variants={fadeUp}
                        custom={2}
                    >
                        {t('landing.subtitle')}
                    </motion.p>

                    <motion.div
                        variants={fadeUp}
                        custom={3}
                        className="hero-buttons"
                    >
                        <button
                            className="btn-l-primary btn-hero"
                            onClick={() => navigate('/login')}
                        >
                            {t('landing.getStarted')}
                            <ArrowRight size={20} className="arrow-icon" />
                        </button>
                        <button
                            className="btn-l-secondary btn-hero"
                            onClick={() => {
                                document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            <Play size={20} className="play-icon" fill="currentColor" />
                            {t('landing.watchDemo' as any)}
                        </button>
                    </motion.div>
                </motion.div>

                {/* 3D Floating Mockup */}
                <motion.div
                    className="hero-mockup-container"
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 1, ease: easeOut }}
                >
                    <motion.div
                        className="glass-mockup"
                        animate={{ y: [0, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    >
                        <div className="mockup-header-v2">
                            <div className="window-controls">
                                <span className="dot red" />
                                <span className="dot yellow" />
                                <span className="dot green" />
                            </div>
                            <div className="mockup-title-bar">poker-manager.app</div>
                        </div>
                        <div className="mockup-body-v2">
                            <div className="mockup-sidebar">
                                <div className="mockup-card stat-card" style={{ height: '100%', border: 'none' }}>
                                    <Trophy size={24} className="mockup-stat-icon" />
                                    <div className="mockup-stat-value">54</div>
                                    <div className="mockup-stat-label">{t('home.players' as any)}</div>

                                    <Coins size={24} className="mockup-stat-icon" style={{ marginTop: '2rem' }} />
                                    <div className="mockup-stat-value">$12.5k</div>
                                    <div className="mockup-stat-label">{t('timer.netPrizePool' as any)}</div>
                                </div>
                            </div>
                            <div className="mockup-main">
                                <div className="mockup-card tall">
                                    <div className="mockup-inner-timer">
                                        <div className="mockup-level">{t('create.level' as any).toUpperCase()} 8</div>
                                        <div className="mockup-time">14:59</div>
                                        <div className="mockup-blinds">
                                            <span className="mockup-blind-item">{t('timer.blinds' as any).toUpperCase()}: <span className="mockup-blind-value">500 / 1000</span></span>
                                        </div>
                                        <div className="mockup-progress-bar">
                                            <motion.div
                                                className="mockup-progress-fill"
                                                initial={{ width: '100%' }}
                                                animate={{ width: '0%' }}
                                                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mockup-grid">
                                    <div className="mockup-card sum stat-card">
                                        <div className="mockup-stat-value">15.4k</div>
                                        <div className="mockup-stat-label">{t('timer.avgStack' as any)}</div>
                                    </div>
                                    <div className="mockup-card sum stat-card">
                                        <div className="mockup-stat-value">25</div>
                                        <div className="mockup-stat-label">{t('landing.mockup.nextBreak' as any)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </header>

            {/* ── Interactive Feature Showcase ── */}
            <section id="features-section" className="showcase-section">
                <div className="showcase-container">
                    <motion.div
                        className="showcase-header"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                        variants={fadeUp}
                        custom={0}
                    >
                        <h2 className="section-title">{t('landing.featuresTitle' as any)}</h2>
                        <p className="section-subtitle">
                            {t('landing.featuresSubtitle' as any)}
                        </p>
                    </motion.div>

                    <div className="showcase-grid">
                        {/* Left Tabs */}
                        <div className="showcase-tabs">
                            {features.map((f, i) => {
                                const isActive = activeFeature === i;
                                const Icon = f.icon;
                                return (
                                    <div
                                        key={f.key}
                                        className={`feature-tab ${isActive ? 'active' : ''}`}
                                        onClick={() => handleTabClick(i)}
                                    >
                                        <div className="tab-icon-box">
                                            <Icon size={24} />
                                        </div>
                                        <div className="tab-content">
                                            <h3>{t(`landing.features.${f.key}` as any)}</h3>
                                            <p>{t(`landing.features.${f.key}Desc` as any)}</p>
                                        </div>
                                        {isActive && (
                                            <motion.div
                                                className="tab-progress"
                                                initial={{ width: '0%' }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0 }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Right Mockup Visualization */}
                        <div className="showcase-visual">
                            <div className="visual-glass">
                                <AnimatePresence mode="wait">
                                    {activeFeature === 0 && (
                                        <motion.div
                                            key="timer"
                                            className="visual-content timer-visual"
                                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                                            transition={{ duration: 0.5, ease: easeOut }}
                                        >
                                            <div className="level-badge">{t('create.level' as any).toUpperCase()} 8</div>
                                            <div className="time-display">14:59</div>
                                            <div className="blinds-display">500 / 1,000</div>
                                            <div className="ante-display">{t('timer.ante' as any)}: 1,000</div>

                                            <div className="timer-progress-bar">
                                                <motion.div
                                                    className="timer-fill"
                                                    initial={{ width: '100%' }}
                                                    animate={{ width: '0%' }}
                                                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeFeature === 1 && (
                                        <motion.div
                                            key="management"
                                            className="visual-content management-visual"
                                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                                            transition={{ duration: 0.5, ease: easeOut }}
                                        >
                                            <div className="player-list">
                                                {[1, 2, 3, 4].map((p, index) => (
                                                    <motion.div
                                                        key={p}
                                                        className="player-row"
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.15 }}
                                                    >
                                                        <div className="player-avatar">
                                                            <Users size={16} />
                                                        </div>
                                                        <div className="player-info">
                                                            <div className="player-name">{t('landing.mockup.player' as any)} {p}</div>
                                                            <div className="player-stack">15,000 pts</div>
                                                        </div>
                                                        <div className="player-badge">{t('landing.mockup.added' as any)}</div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                            <motion.button
                                                className="add-player-btn pulse"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {t('manage.addPlayer' as any)}
                                            </motion.button>
                                        </motion.div>
                                    )}

                                    {activeFeature === 2 && (
                                        <motion.div
                                            key="payouts"
                                            className="visual-content payouts-visual"
                                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                                            transition={{ duration: 0.5, ease: easeOut }}
                                        >
                                            <div className="prize-pool-header">
                                                <Coins size={32} className="coins-icon" />
                                                <div className="prize-amount">$ 15,400</div>
                                                <div className="prize-label">{t('landing.mockup.totalPrizePool' as any)}</div>
                                            </div>
                                            <div className="payout-tiers">
                                                {[
                                                    { pos: '1º', perc: '50%', amt: '$ 7,700' },
                                                    { pos: '2º', perc: '30%', amt: '$ 4,620' },
                                                    { pos: '3º', perc: '20%', amt: '$ 3,080' },
                                                ].map((tier, index) => (
                                                    <motion.div
                                                        key={index}
                                                        className="tier-row"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.2 + (index * 0.1) }}
                                                    >
                                                        <div className="tier-pos">{tier.pos}</div>
                                                        <div className="tier-bar-container">
                                                            <motion.div
                                                                className="tier-bar"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: tier.perc }}
                                                                transition={{ delay: 0.5 + (index * 0.1), duration: 0.8, ease: easeOut }}
                                                            />
                                                        </div>
                                                        <div className="tier-amt">{tier.amt}</div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How It Works Section ── */}
            <section className="how-it-works-section">
                <div className="hiw-container">
                    <motion.div
                        className="hiw-header"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                        variants={fadeUp}
                        custom={0}
                    >
                        <h2 className="section-title">{t('landing.hiw.title' as any)}</h2>
                        <p className="section-subtitle">
                            {t('landing.hiw.subtitle' as any)}
                        </p>
                    </motion.div>

                    <div className="hiw-grid">
                        <motion.div className="hiw-card" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "0px 0px -50px 0px" }} variants={fadeUp} custom={1}>
                            <div className="hiw-step">1</div>
                            <div className="hiw-icon setup">
                                <Activity size={28} />
                            </div>
                            <h3>{t('landing.hiw.step1Title' as any)}</h3>
                            <p>{t('landing.hiw.step1Desc' as any)}</p>
                        </motion.div>

                        <motion.div className="hiw-card" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "0px 0px -50px 0px" }} variants={fadeUp} custom={2}>
                            <div className="hiw-step">2</div>
                            <div className="hiw-icon manage">
                                <Users size={28} />
                            </div>
                            <h3>{t('landing.hiw.step2Title' as any)}</h3>
                            <p>{t('landing.hiw.step2Desc' as any)}</p>
                        </motion.div>

                        <motion.div className="hiw-card" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "0px 0px -50px 0px" }} variants={fadeUp} custom={3}>
                            <div className="hiw-step">3</div>
                            <div className="hiw-icon finish">
                                <Trophy size={28} />
                            </div>
                            <h3>{t('landing.hiw.step3Title' as any)}</h3>
                            <p>{t('landing.hiw.step3Desc' as any)}</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── FAQ Section ── */}
            <section className="faq-section">
                <div className="faq-container">
                    <motion.div
                        className="faq-header"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                        variants={fadeUp}
                        custom={0}
                    >
                        <h2 className="section-title">{t('landing.faq.title' as any)}</h2>
                        <p className="section-subtitle">{t('landing.faq.subtitle' as any)}</p>
                    </motion.div>

                    <div className="faq-list">
                        {faqsList.map((faq, index) => {
                            const isActive = activeFaq === index;
                            return (
                                <motion.div
                                    key={index}
                                    className={`faq-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setActiveFaq(isActive ? null : index)}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                                    variants={fadeUp}
                                    custom={index + 1}
                                >
                                    <div className="faq-question">
                                        <span>{faq.q}</span>
                                        <ChevronRight size={20} className="faq-icon" style={{ transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                                    </div>
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div className="faq-answer">{faq.a}</div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="cta-banner">
                <div className="cta-content">
                    <h2>{t('landing.cta.title' as any)}</h2>
                    <p>{t('landing.cta.subtitle' as any)}</p>
                    <button className="btn-l-primary cta-btn" onClick={() => navigate('/login')}>
                        {t('landing.cta.button' as any)}
                    </button>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="footer-v2">
                <div className="footer-content">
                    <div className="footer-brand">
                        <ShieldCheck size={24} className="logo-icon" />
                        <span>PTM v1.0</span>
                    </div>
                    <p>{t('landing.footerText')}</p>
                </div>
            </footer>
        </div>
    );
}
