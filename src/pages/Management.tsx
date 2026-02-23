import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '../store/TournamentContext';
import { useI18n } from '../store/I18nContext';
import { nanoid } from 'nanoid';
import type { Player } from '../types';
import { UserPlus, UserMinus, RefreshCw, Trophy, ArrowLeft, DollarSign, Edit2, Check, X, Plus, Trash2 } from 'lucide-react';
import { calculatePayouts } from '../utils/payouts';
import './Management.css';

const Management: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { state, updateTournament } = useTournament();
    const { t } = useI18n();
    const navigate = useNavigate();

    const tournament = state.tournaments.find(t => t.id === id);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [selectedBonuses, setSelectedBonuses] = useState<string[]>([]);
    const [isEditingPayouts, setIsEditingPayouts] = useState(false);
    const [editablePayouts, setEditablePayouts] = useState<number[]>([]);

    // Custom Modal State
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    if (!tournament) return <div className="p-8 text-center text-danger">{t('manage.notFound')}</div>;

    const handleAddPlayer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlayerName.trim()) return;

        const newPlayer: Player = {
            id: nanoid(),
            name: newPlayerName.trim(),
            status: 'active',
            reEntries: 0,
            appliedBonuses: selectedBonuses
        };

        updateTournament(tournament.id, {
            players: [...tournament.players, newPlayer]
        });

        setNewPlayerName('');
        setSelectedBonuses([]);
    };

    const addSelectedBonus = (bonusId: string) => {
        setSelectedBonuses([...selectedBonuses, bonusId]);
    };

    const removeSelectedBonus = (bonusId: string) => {
        const newBonuses = [...selectedBonuses];
        const index = newBonuses.lastIndexOf(bonusId);
        if (index > -1) {
            newBonuses.splice(index, 1);
            setSelectedBonuses(newBonuses);
        }
    };

    const handleEliminate = (playerId: string) => {
        setConfirmAction({
            isOpen: true,
            title: t('manage.eliminatePlayer'),
            message: t('manage.eliminateConfirm'),
            onConfirm: () => {
                const activeCount = tournament.players.filter(p => p.status === 'active').length;
                updateTournament(tournament.id, {
                    players: tournament.players.map(p =>
                        p.id === playerId ? { ...p, status: 'eliminated', position: activeCount } : p
                    )
                });
                setConfirmAction(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleReEntry = (playerId: string) => {
        setConfirmAction({
            isOpen: true,
            title: t('manage.processReEntry'),
            message: t('manage.reEntryConfirm'),
            onConfirm: () => {
                updateTournament(tournament.id, {
                    players: tournament.players.map(p =>
                        p.id === playerId ? { ...p, reEntries: p.reEntries + 1 } : p
                    )
                });
                setConfirmAction(prev => ({ ...prev, isOpen: false }));
            }
        });
    };
    const handleUnEliminate = (playerId: string) => {
        updateTournament(tournament.id, {
            players: tournament.players.map(p =>
                p.id === playerId ? { ...p, status: 'active', position: undefined } : p
            )
        });
    };

    const handleStartEditPayouts = () => {
        if (!tournament) return;
        if (tournament.customPayouts && tournament.customPayouts.length > 0) {
            setEditablePayouts([...tournament.customPayouts]);
        } else {
            setEditablePayouts(payouts.map(p => p.percentage));
        }
        setIsEditingPayouts(true);
    };

    const handleSavePayouts = () => {
        if (!tournament) return;
        const sum = editablePayouts.reduce((a, b) => a + b, 0);
        if (sum !== 100) {
            alert(t('manage.payoutsSumError', { sum: sum.toString() }));
            return;
        }
        updateTournament(tournament.id, { customPayouts: editablePayouts });
        setIsEditingPayouts(false);
    };
    const activePlayers = tournament.players.filter(p => p.status === 'active');
    const eliminatedPlayers = tournament.players.filter(p => p.status === 'eliminated').sort((a, b) => (a.position || 0) - (b.position || 0));

    const totalEntries = tournament.players.length + tournament.players.reduce((acc, p) => acc + p.reEntries, 0);

    // Calculate Prize Pool (Buy-ins + Re-entries + all paid bonuses)
    const basePrizePool = totalEntries * tournament.buyIn;
    const bonusPrizePool = tournament.players.reduce((sum, player) => {
        const playerBonusTotal = player.appliedBonuses?.reduce((bSum, bId) => {
            const bonusCost = tournament.bonuses?.find(b => b.id === bId)?.cost || 0;
            return bSum + bonusCost;
        }, 0) || 0;
        return sum + playerBonusTotal;
    }, 0);
    const prizePool = basePrizePool + bonusPrizePool;

    // Calculate Dynamic Payouts
    const payouts = calculatePayouts(
        totalEntries,
        prizePool,
        tournament.rakePercentage,
        tournament.customPayouts
    );
    const rakeAmount = tournament.rakePercentage ? prizePool * (tournament.rakePercentage / 100) : 0;
    const netPrizePool = prizePool - rakeAmount;

    return (
        <div className="management-container">
            <div className="mb-4">
                <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={18} /> {t('manage.backToHome')}
                </button>
            </div>

            <div className="management-header animate-fade-in">
                <div>
                    <h2>{t('manage.title', { name: tournament.name })}</h2>
                    <p className="text-muted">{t('manage.subtitle')}</p>
                </div>
                <div className="stats-badges">
                    <div className="stat-badge">
                        <span className="stat-label">{t('manage.prizePool')}</span>
                        <span className="stat-value text-accent">${netPrizePool.toLocaleString()}</span>
                        {rakeAmount > 0 && (
                            <span className="text-muted" style={{ fontSize: '0.7rem', display: 'block', marginTop: '2px' }}>
                                {t('manage.gross', { amount: prizePool.toLocaleString() })} <br />
                                {t('manage.rake', { amount: rakeAmount.toLocaleString() })}
                            </span>
                        )}
                    </div>
                    <div className="stat-badge">
                        <span className="stat-label">{t('manage.entries')}</span>
                        <span className="stat-value">{totalEntries}</span>
                    </div>
                    <div className="stat-badge">
                        <span className="stat-label">{t('manage.active')}</span>
                        <span className="stat-value">{activePlayers.length}</span>
                    </div>
                </div>
            </div>

            <div className="management-grid">
                {/* Registration Column */}
                <div className="management-col glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <h3>{t('manage.registration')}</h3>
                    <p className="text-muted mb-4">{t('manage.registrationSub')}</p>

                    <form onSubmit={handleAddPlayer} className="add-player-form-container">
                        <div className="add-player-form">
                            <input
                                type="text"
                                className="form-input"
                                placeholder={t('manage.playerName')}
                                value={newPlayerName}
                                onChange={e => setNewPlayerName(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary">
                                <UserPlus size={18} /> {t('common.add')}
                            </button>
                        </div>

                        {tournament.bonuses && tournament.bonuses.length > 0 && (
                            <div className="bonuses-selection mt-2">
                                <p className="text-xs text-muted mb-2">{t('manage.assignBonuses')}</p>
                                <div className="bonuses-grid-counters">
                                    {tournament.bonuses.map(bonus => {
                                        const count = selectedBonuses.filter(id => id === bonus.id).length;
                                        return (
                                            <div key={bonus.id} className="bonus-counter-block">
                                                <span className="text-xs flex-1">{bonus.name} (+{bonus.chips})</span>
                                                <div className="counter-controls">
                                                    <button type="button" className="btn btn-ghost btn-icon-small" onClick={() => removeSelectedBonus(bonus.id)} disabled={count === 0}>-</button>
                                                    <span className="counter-value">{count}</span>
                                                    <button type="button" className="btn btn-ghost btn-icon-small" onClick={() => addSelectedBonus(bonus.id)}>+</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </form>

                    <h4 className="mt-4 mb-2">{t('manage.activePlayers', { count: activePlayers.length.toString() })}</h4>
                    <div className="player-list">
                        {activePlayers.length === 0 ? (
                            <p className="text-muted italic text-center py-4">{t('manage.noActive')}</p>
                        ) : (
                            activePlayers.map(player => (
                                <div key={player.id} className="player-item">
                                    <div className="player-info">
                                        <div className="player-name-wrapper">
                                            <span className="player-name">{player.name}</span>
                                            {player.reEntries > 0 && <span className="badge badge-warning text-xs ml-2">Re x{player.reEntries}</span>}
                                        </div>
                                        {player.appliedBonuses && player.appliedBonuses.length > 0 && (
                                            <div className="player-bonuses text-xs text-muted">
                                                +{player.appliedBonuses.length} adds
                                            </div>
                                        )}
                                        {tournament.bonuses && tournament.bonuses.length > 0 && (
                                            <div className="active-player-bonuses mt-2">
                                                {tournament.bonuses.map(bonus => {
                                                    const count = (player.appliedBonuses || []).filter(id => id === bonus.id).length;
                                                    return (
                                                        <div key={bonus.id} className="bonus-counter-inline">
                                                            <span className="text-xs text-muted max-w-[80px] truncate" title={bonus.name}>{bonus.name}</span>
                                                            <div className="counter-controls-small">
                                                                <button
                                                                    className="btn btn-ghost btn-icon-xs"
                                                                    onClick={() => {
                                                                        const newBonuses = [...(player.appliedBonuses || [])];
                                                                        const index = newBonuses.lastIndexOf(bonus.id);
                                                                        if (index > -1) {
                                                                            newBonuses.splice(index, 1);
                                                                            updateTournament(tournament.id, {
                                                                                players: tournament.players.map(p =>
                                                                                    p.id === player.id ? { ...p, appliedBonuses: newBonuses } : p
                                                                                )
                                                                            });
                                                                        }
                                                                    }}
                                                                    disabled={count === 0}
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="counter-value-xs">{count}</span>
                                                                <button
                                                                    className="btn btn-ghost btn-icon-xs"
                                                                    onClick={() => {
                                                                        const newBonuses = [...(player.appliedBonuses || []), bonus.id];
                                                                        updateTournament(tournament.id, {
                                                                            players: tournament.players.map(p =>
                                                                                p.id === player.id ? { ...p, appliedBonuses: newBonuses } : p
                                                                            )
                                                                        });
                                                                    }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="player-actions">
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleReEntry(player.id)} title="Re-entry">
                                            <RefreshCw size={14} />
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleEliminate(player.id)} title="Eliminate">
                                            <UserMinus size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Results Column */}
                <div className="management-col glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3>{t('manage.results')}</h3>
                            <p className="text-muted mb-4">{t('manage.resultsSub')}</p>
                        </div>
                    </div>

                    {payouts.length > 0 && (
                        <div className="payouts-container mb-6" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 className="flex items-center text-accent m-0" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <DollarSign size={16} className="mr-2" /> {t('manage.currentPayouts')}
                                </h4>
                                {!isEditingPayouts ? (
                                    <button className="btn btn-ghost btn-icon-sm" onClick={handleStartEditPayouts} title={t('manage.editPayouts')}>
                                        <Edit2 size={14} />
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button className="btn btn-ghost btn-icon-sm text-danger" onClick={() => setIsEditingPayouts(false)} title={t('common.cancel')}>
                                            <X size={14} />
                                        </button>
                                        <button className="btn btn-ghost btn-icon-sm text-success" onClick={handleSavePayouts} title={t('common.save')}>
                                            <Check size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!isEditingPayouts ? (
                                <div className="payouts-grid" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {payouts.map(p => (
                                        <div key={p.position} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: p.position === 1 ? '#fbbf24' : p.position === 2 ? '#9ca3af' : '#b45309', fontWeight: 'bold' }}>
                                                    {p.position}{p.position === 1 ? 'st' : p.position === 2 ? 'nd' : p.position === 3 ? 'rd' : 'th'}
                                                </span>
                                                <span className="text-muted text-xs">({p.percentage}%)</span>
                                            </div>
                                            <span className="font-mono text-success font-bold">${p.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="payouts-editor" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {editablePayouts.map((val, index) => (
                                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="text-muted" style={{ width: '32px' }}>{index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}</span>
                                            <input
                                                type="number"
                                                className="form-input form-input-sm"
                                                style={{ flex: 1 }}
                                                value={val}
                                                onChange={(e) => {
                                                    const newArr = [...editablePayouts];
                                                    newArr[index] = Number(e.target.value);
                                                    setEditablePayouts(newArr);
                                                }}
                                                min="0"
                                                max="100"
                                            />
                                            <span>%</span>
                                            <button
                                                className="btn btn-ghost btn-icon-sm text-danger"
                                                disabled={editablePayouts.length === 1}
                                                onClick={() => setEditablePayouts(editablePayouts.filter((_, i) => i !== index))}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditablePayouts([...editablePayouts, 0])}>
                                            <Plus size={14} /> {t('manage.addSpot')}
                                        </button>
                                        <span className={`text-xs font-bold ${editablePayouts.reduce((a, b) => a + b, 0) === 100 ? 'text-success' : 'text-danger'}`}>
                                            {t('manage.totalPerc', { sum: editablePayouts.reduce((a, b) => a + b, 0).toString() })}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="player-list results-list">
                        {activePlayers.length === 1 && totalEntries > 1 && (
                            <div className="player-item winner-item">
                                <div className="player-info">
                                    <Trophy size={20} className="text-warning" />
                                    <span className="player-name font-bold">{activePlayers[0].name}</span>
                                </div>
                                <div className="rank">1st Place</div>
                            </div>
                        )}

                        {eliminatedPlayers.length === 0 ? (
                            <p className="text-muted italic text-center py-4">{t('manage.noEliminations')}</p>
                        ) : (
                            eliminatedPlayers.map(player => (
                                <div key={player.id} className="player-item eliminated-item">
                                    <div className="player-info">
                                        <span className="player-name text-muted">{player.name}</span>
                                    </div>
                                    <div className="player-actions">
                                        <span className="rank text-muted">#{player.position}</span>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleUnEliminate(player.id)} title={t('manage.undo')}>
                                            <RefreshCw size={14} /> {t('manage.undo')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Confirm Modal */}
            {confirmAction.isOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
                    <div className="glass-panel" style={{ padding: '24px', maxWidth: '400px', width: '90%' }}>
                        <h3 className="mb-2">{confirmAction.title}</h3>
                        <p className="text-muted mb-6">{confirmAction.message}</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button className="btn btn-ghost" onClick={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}>
                                {t('common.cancel')}
                            </button>
                            <button className="btn btn-primary" onClick={confirmAction.onConfirm}>
                                {t('manage.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Management;
