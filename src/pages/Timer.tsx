import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '../store/TournamentContext';
import { useI18n } from '../store/I18nContext';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Maximize, ArrowLeft, Trophy, Volume2, VolumeX } from 'lucide-react';
import { calculatePayouts } from '../utils/payouts';
import { playWarningBeep, playLevelUpSound } from '../utils/audio';
import './Timer.css';

const Timer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { state, updateTournament } = useTournament();
    const { t } = useI18n();
    const navigate = useNavigate();

    const tournament = state.tournaments.find(t => t.id === id);
    const [isRunning, setIsRunning] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const lastSyncedAt = React.useRef<string | null>(null);

    useEffect(() => {
        if (tournament) {
            // Fast-forward processing on initial load OR when seeing a newer timestamp from the server 
            const isFreshData = tournament.updatedAt && tournament.updatedAt !== lastSyncedAt.current;

            if (isFreshData || !lastSyncedAt.current) {
                let initialTime = tournament.timeRemainingSeconds;

                // If the tournament is running, calculate how much time passed since the server registered it as 'running'
                if (tournament.status === 'running' && tournament.updatedAt) {
                    const dbTime = new Date(tournament.updatedAt).getTime();
                    const now = Date.now();
                    const passedSeconds = Math.floor((now - dbTime) / 1000);
                    initialTime = Math.max(0, tournament.timeRemainingSeconds - Math.max(0, passedSeconds));
                }

                setTimeRemaining(initialTime);
                setCurrentLevelIndex(tournament.currentLevelIndex);
                setIsRunning(tournament.status === 'running');
                lastSyncedAt.current = tournament.updatedAt || 'initialized';
            }
        }
    }, [tournament]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isRunning && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 11 && prev > 1 && !isMuted) {
                        playWarningBeep();
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (isRunning && timeRemaining === 0) {
            handleLevelComplete();
        }

        return () => clearInterval(interval);
    }, [isRunning, timeRemaining, tournament?.id, isMuted, currentLevelIndex]);

    if (!tournament) return <div className="p-8 text-center text-danger">{t('manage.notFound')}</div>;

    const currentLevel = tournament.levels[currentLevelIndex];
    const nextLevel = tournament.levels[currentLevelIndex + 1];

    const handleLevelComplete = () => {
        if (!isMuted) {
            playLevelUpSound();
        }

        if (nextLevel && tournament) {
            const nextDuration = nextLevel.durationMinutes * 60;
            setCurrentLevelIndex(prev => prev + 1);
            setTimeRemaining(nextDuration);
            // Push new level state to DB instantly
            updateTournament(tournament.id, {
                status: 'running',
                currentLevelIndex: currentLevelIndex + 1,
                timeRemainingSeconds: nextDuration
            });
        } else if (tournament) {
            setIsRunning(false);
            updateTournament(tournament.id, {
                status: 'completed',
                timeRemainingSeconds: 0
            });
        }
    };

    const toggleTimer = () => {
        if (!tournament) return;
        const newStatus = isRunning ? 'paused' : 'running';
        setIsRunning(!isRunning);
        updateTournament(tournament.id, {
            status: newStatus,
            timeRemainingSeconds: timeRemaining,
            currentLevelIndex
        });
    };

    const resetTimer = () => {
        if (!tournament) return;
        const duration = currentLevel ? currentLevel.durationMinutes * 60 : 0;
        setTimeRemaining(duration);
        setIsRunning(false);
        updateTournament(tournament.id, {
            status: 'paused',
            timeRemainingSeconds: duration,
            currentLevelIndex
        });
    };

    const jumpToLevel = (index: number) => {
        if (!tournament) return;
        if (index >= 0 && index < tournament.levels.length) {
            const duration = tournament.levels[index].durationMinutes * 60;
            setCurrentLevelIndex(index);
            setTimeRemaining(duration);
            setIsRunning(false);

            updateTournament(tournament.id, {
                status: 'paused',
                currentLevelIndex: index,
                timeRemainingSeconds: duration
            });
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Stats calculation
    const totalEntries = tournament.players.length + tournament.players.reduce((acc, p) => acc + p.reEntries, 0);
    const activePlayers = tournament.players.filter(p => p.status === 'active').length;

    // Calculate total chips including bonuses
    const baseTotalChips = totalEntries * tournament.startingChips;
    const bonusTotalChips = tournament.players.reduce((sum, player) => {
        const playerBonusTotal = player.appliedBonuses?.reduce((bSum, bId) => {
            const bonusChips = tournament.bonuses?.find(b => b.id === bId)?.chips || 0;
            return bSum + bonusChips;
        }, 0) || 0;
        return sum + playerBonusTotal;
    }, 0);
    const totalChips = baseTotalChips + bonusTotalChips;

    const avgStack = activePlayers > 0 ? Math.floor(totalChips / activePlayers) : tournament.startingChips;

    // Calculate Prize Pool & Payouts
    const basePrizePool = totalEntries * tournament.buyIn;
    const bonusPrizePool = tournament.players.reduce((sum, player) => {
        const playerBonusTotal = player.appliedBonuses?.reduce((bSum, bId) => {
            const bonusCost = tournament.bonuses?.find(b => b.id === bId)?.cost || 0;
            return bSum + bonusCost;
        }, 0) || 0;
        return sum + playerBonusTotal;
    }, 0);
    const prizePool = basePrizePool + bonusPrizePool;
    const payouts = calculatePayouts(
        totalEntries,
        prizePool,
        tournament.rakePercentage,
        tournament.customPayouts
    );
    const rakeAmount = tournament.rakePercentage ? prizePool * (tournament.rakePercentage / 100) : 0;
    const netPrizePool = prizePool - rakeAmount;

    return (
        <div className={`timer-container ${currentLevel?.isBreak ? 'is-break-bg' : ''} ${timeRemaining <= 60 && !currentLevel?.isBreak ? 'timer-warning' : ''}`}>

            {/* Top Bar */}
            <div className="timer-topbar animate-fade-in">
                <div className="flex-1">
                    <button className="btn btn-ghost" onClick={() => {
                        updateTournament(tournament.id, { timeRemainingSeconds: timeRemaining, currentLevelIndex });
                        navigate('/dashboard');
                    }}>
                        <ArrowLeft size={20} /> {t('timer.exit')}
                    </button>
                </div>
                <div className="header-title flex-2 text-center">
                    <h1>{tournament.name}</h1>
                </div>
                <div className="flex-1 text-right" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button className="btn btn-ghost" onClick={() => setIsMuted(!isMuted)} title={isMuted ? t('timer.unmute') : t('timer.mute')}>
                        {isMuted ? <VolumeX size={20} className="text-danger" /> : <Volume2 size={20} />}
                    </button>
                    <button className="btn btn-ghost" onClick={toggleFullscreen}>
                        <Maximize size={20} />
                    </button>
                </div>
            </div>

            {/* Main Clock Area */}
            <div className="timer-main animate-fade-in">
                <div className="level-info-large">
                    {currentLevel?.isBreak ? (
                        <h2 className="text-warning text-glow">{currentLevel.breakName || t('timer.break')}</h2>
                    ) : (
                        <h2>{t('create.level')} {currentLevel?.level}</h2>
                    )}
                </div>

                <div className={`clock-display font-mono ${timeRemaining <= 10 && isRunning ? 'pulse-fast' : ''}`}>
                    {formatTime(timeRemaining)}
                </div>

                <div className="blinds-display">
                    {currentLevel?.isBreak ? (
                        <div className="blinds-text">{t('timer.relax')}</div>
                    ) : (
                        <div className="blinds-text">
                            <span className="text-muted">{t('timer.blinds')} </span>
                            {currentLevel?.smallBlind?.toLocaleString()} / {currentLevel?.bigBlind?.toLocaleString()}
                            {currentLevel?.ante > 0 && <span className="ante-text"> {t('timer.ante')} {currentLevel.ante.toLocaleString()}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Controls Area */}
            <div className="timer-controls glass-panel animate-fade-in">
                <button className="btn btn-ghost btn-icon-lg" onClick={() => jumpToLevel(currentLevelIndex - 1)} disabled={currentLevelIndex === 0}>
                    <SkipBack size={24} />
                </button>
                <button className="btn btn-ghost btn-icon-lg" onClick={resetTimer}>
                    <RotateCcw size={24} />
                </button>

                <button
                    className={`btn btn-play-pause ${isRunning ? 'btn-danger' : 'btn-primary'}`}
                    onClick={toggleTimer}
                >
                    {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                </button>

                <button className="btn btn-ghost btn-icon-lg" onClick={() => jumpToLevel(currentLevelIndex + 1)} disabled={!nextLevel}>
                    <SkipForward size={24} />
                </button>
            </div>

            {/* Bottom Info Bar */}
            <div className="timer-info-grid glass-panel animate-fade-in">
                <div className="info-block">
                    <div className="info-label">{t('timer.activePlayers')}</div>
                    <div className="info-value">{activePlayers} <span className="text-muted">/ {totalEntries || 0}</span></div>
                </div>
                <div className="info-block" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '1.5rem' }}>
                    <div className="info-label">{t('timer.avgStack')}</div>
                    <div className="info-value font-mono">{avgStack.toLocaleString()}</div>
                </div>
                <div className="info-block next-level-block" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="info-label text-right">{t('timer.next')}</div>
                    <div className="info-value text-right">
                        {nextLevel?.isBreak
                            ? <span className="text-warning">{t('timer.break')} ({nextLevel.durationMinutes}m)</span>
                            : nextLevel
                                ? `${nextLevel.smallBlind}/${nextLevel.bigBlind} ${nextLevel.ante ? `(${nextLevel.ante})` : ''}`
                                : t('timer.end')}
                    </div>
                </div>
            </div>

            {/* Payouts Bar */}
            {payouts.length > 0 && (
                <div className="timer-payouts-bar glass-panel animate-fade-in" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '2rem', padding: '1rem', alignItems: 'center' }}>
                    <Trophy size={20} className="text-warning" />
                    {payouts.map(p => (
                        <div key={p.position} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="text-muted text-xs font-bold uppercase tracking-wider">{p.position}{p.position === 1 ? 'st' : p.position === 2 ? 'nd' : p.position === 3 ? 'rd' : 'th'} Place</div>
                            <div className="font-mono text-success" style={{ fontSize: '1.25rem', fontWeight: 600 }}>${p.amount.toLocaleString()}</div>
                        </div>
                    ))}
                    <div style={{ marginLeft: 'auto', textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                        <div className="text-muted text-xs font-bold uppercase tracking-wider">{t('timer.netPrizePool')}</div>
                        <div className="font-mono text-accent" style={{ fontSize: '1.25rem', fontWeight: 600 }}>${netPrizePool.toLocaleString()}</div>
                        {rakeAmount > 0 && (
                            <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                ({t('manage.gross', { amount: prizePool.toLocaleString() })})
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Timer;
