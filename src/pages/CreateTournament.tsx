import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../store/TournamentContext';
import { useI18n } from '../store/I18nContext';
import { nanoid } from 'nanoid';
import type { BlindLevel, Tournament, TournamentBonus } from '../types';
import { Plus, Trash2, Save, ChevronRight, ChevronLeft } from 'lucide-react';
import './CreateTournament.css';

const DEFAULT_LEVELS: Omit<BlindLevel, 'id'>[] = [
    { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, durationMinutes: 20, isBreak: false },
    { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, durationMinutes: 20, isBreak: false },
    { level: 3, smallBlind: 75, bigBlind: 150, ante: 0, durationMinutes: 20, isBreak: false },
    { level: 4, smallBlind: 100, bigBlind: 200, ante: 0, durationMinutes: 20, isBreak: false },
    { level: 5, smallBlind: 100, bigBlind: 200, ante: 200, durationMinutes: 20, isBreak: false },
    { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, durationMinutes: 15, isBreak: true, breakName: '15 Min Break' },
    { level: 7, smallBlind: 150, bigBlind: 300, ante: 300, durationMinutes: 20, isBreak: false },
    { level: 8, smallBlind: 200, bigBlind: 400, ante: 400, durationMinutes: 20, isBreak: false },
    { level: 9, smallBlind: 300, bigBlind: 600, ante: 600, durationMinutes: 20, isBreak: false },
    { level: 10, smallBlind: 400, bigBlind: 800, ante: 800, durationMinutes: 20, isBreak: false },
];

const CreateTournament: React.FC = () => {
    const { state, addTournament } = useTournament();
    const { t } = useI18n();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const handleNextWizardStep = (nextWizardStep: number) => {
        setStep(nextWizardStep);
    };

    // Form State
    const [name, setName] = useState('Friday Night Poker');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [buyIn, setBuyIn] = useState(50);
    const [startingChips, setStartingChips] = useState(10000);
    const [bonuses, setBonuses] = useState<TournamentBonus[]>([]);
    const [rakePercentage, setRakePercentage] = useState<number>(0);
    const [useCustomPayouts, setUseCustomPayouts] = useState<boolean>(false);
    const [customPayouts, setCustomPayouts] = useState<number[]>([50, 30, 20]);

    const [levels, setLevels] = useState<BlindLevel[]>(() =>
        DEFAULT_LEVELS.map(l => ({ ...l, id: nanoid() }))
    );

    const handleLevelChange = (id: string, field: keyof BlindLevel, value: any) => {
        setLevels(levels.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const addLevel = () => {
        const lastLevel = [...levels].reverse().find(l => !l.isBreak);
        const maxLevel = levels.reduce((max, l) => Math.max(max, l.level), 0);

        const newSmallBlind = lastLevel ? lastLevel.smallBlind * 2 : 500;
        const newBigBlind = lastLevel ? lastLevel.bigBlind * 2 : 1000;
        const newAnte = lastLevel ? (lastLevel.ante > 0 ? lastLevel.ante * 2 : 0) : 1000;
        const newDuration = lastLevel ? lastLevel.durationMinutes : 20;

        setLevels([
            ...levels,
            {
                id: nanoid(),
                level: maxLevel + 1,
                smallBlind: newSmallBlind,
                bigBlind: newBigBlind,
                ante: newAnte,
                durationMinutes: newDuration,
                isBreak: false
            }
        ]);
    };

    const addBreak = () => {
        setLevels([
            ...levels,
            {
                id: nanoid(),
                level: 0,
                smallBlind: 0,
                bigBlind: 0,
                ante: 0,
                durationMinutes: 10,
                isBreak: true,
                breakName: 'Break'
            }
        ]);
    };

    const removeLevel = (id: string) => {
        setLevels(levels.filter(l => l.id !== id));
    };

    const handleBonusChange = (id: string, field: keyof TournamentBonus, value: any) => {
        setBonuses(bonuses.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const addBonus = () => {
        setBonuses([
            ...bonuses,
            { id: nanoid(), name: 'New Bonus', cost: 0, chips: 0 }
        ]);
    };

    const removeBonus = (id: string) => {
        setBonuses(bonuses.filter(b => b.id !== id));
    };

    const addPayoutPosition = () => {
        setCustomPayouts([...customPayouts, 0]);
    };

    const removePayoutPosition = (index: number) => {
        const newPayouts = [...customPayouts];
        newPayouts.splice(index, 1);
        setCustomPayouts(newPayouts);
    };

    const handlePayoutChange = (index: number, value: number) => {
        const newPayouts = [...customPayouts];
        newPayouts[index] = value;
        setCustomPayouts(newPayouts);
    };

    const handleCreate = () => {
        if (!state.user) return;

        if (useCustomPayouts) {
            const sum = customPayouts.reduce((a, b) => a + b, 0);
            if (sum !== 100) {
                alert(t('create.payoutsError', { sum: sum.toString() }));
                return;
            }
        }

        // Normalize level numbers after potential deletions
        let currentLevel = 1;
        const normalizedLevels = levels.map(l => {
            if (l.isBreak) return l;
            return { ...l, level: currentLevel++ };
        });

        const newTournament: Tournament = {
            id: nanoid(),
            userId: state.user.id,
            name,
            date,
            status: 'draft',
            buyIn,
            startingChips,
            bonuses,
            currentLevelIndex: 0,
            timeRemainingSeconds: normalizedLevels[0]?.durationMinutes ? normalizedLevels[0].durationMinutes * 60 : 1200,
            rakePercentage,
            customPayouts: useCustomPayouts ? customPayouts : [],
            levels: normalizedLevels,
            players: [],
        };

        addTournament(newTournament);

        navigate('/dashboard');
    };

    return (
        <div className="create-container">
            <div className="create-header animate-fade-in">
                <h2>{t('create.title')}</h2>
                <div className="step-indicator" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>{t('create.step1')}</div>
                    <div className="step-line" />
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>{t('create.step2')}</div>
                    <div className="step-line" />
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>{t('create.step3')}</div>
                    <div className="step-line" />
                    <div className={`step ${step >= 4 ? 'active' : ''}`}>{t('create.step4')}</div>
                </div>
            </div>

            <div className="create-card glass-panel animate-fade-in">
                {step === 1 && (
                    <div className="step-content">
                        <h3>{t('create.basicsTitle')}</h3>
                        <p className="text-muted mb-4">{t('create.basicsSubtitle')}</p>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">{t('create.name')}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder={t('create.namePlaceholder')}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('create.date')}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('create.buyIn')}</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={buyIn}
                                    onChange={e => setBuyIn(Number(e.target.value))}
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('create.startingChips')}</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={startingChips}
                                    onChange={e => setStartingChips(Number(e.target.value))}
                                    min="100"
                                />
                            </div>
                        </div>

                        <div className="step-actions">
                            <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>{t('common.cancel')}</button>
                            <button className="btn btn-primary" onClick={() => handleNextWizardStep(2)}>
                                {t('create.nextStep')} <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-content">
                        <div className="structure-header">
                            <div>
                                <h3>{t('create.bonusesTitle')}</h3>
                                <p className="text-muted">{t('create.bonusesSubtitle')}</p>
                            </div>
                            <button className="btn btn-accent btn-sm" onClick={addBonus}>
                                <Plus size={16} /> {t('create.addBonus')}
                            </button>
                        </div>

                        {bonuses.length === 0 ? (
                            <div className="empty-state-small text-center py-4 mb-4 glass-panel">
                                <p className="text-muted">{t('create.noBonuses')}</p>
                            </div>
                        ) : (
                            <div className="bonuses-list mb-4">
                                {bonuses.map((bonus) => (
                                    <div key={bonus.id} className="bonus-row glass-panel">
                                        <div className="form-group mb-0">
                                            <label className="form-label text-xs">{t('create.bonusName')}</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={bonus.name}
                                                onChange={(e) => handleBonusChange(bonus.id, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group mb-0">
                                            <label className="form-label text-xs">{t('create.bonusCost')}</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={bonus.cost}
                                                min="0"
                                                onChange={(e) => handleBonusChange(bonus.id, 'cost', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="form-group mb-0">
                                            <label className="form-label text-xs">{t('create.bonusChips')}</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={bonus.chips}
                                                min="0"
                                                onChange={(e) => handleBonusChange(bonus.id, 'chips', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="bonus-action-col">
                                            <button className="btn btn-ghost btn-icon text-danger" onClick={() => removeBonus(bonus.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="step-actions mt-4">
                            <button className="btn btn-ghost" onClick={() => setStep(1)}>
                                <ChevronLeft size={18} /> {t('create.back')}
                            </button>
                            <button className="btn btn-primary" onClick={() => handleNextWizardStep(3)}>
                                {t('create.nextStep')} <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-content">
                        <div className="structure-header">
                            <div>
                                <h3>{t('create.structureTitle')}</h3>
                                <p className="text-muted">{t('create.structureSubtitle')}</p>
                            </div>
                            <div className="structure-actions">
                                <button className="btn btn-ghost btn-sm" onClick={addBreak}>
                                    <Plus size={16} /> {t('create.addBreak')}
                                </button>
                                <button className="btn btn-accent btn-sm" onClick={addLevel}>
                                    <Plus size={16} /> {t('create.addLevel')}
                                </button>
                            </div>
                        </div>

                        <div className="levels-table">
                            <div className="levels-table-header">
                                <div>{t('create.level')}</div>
                                <div>{t('create.sb')}</div>
                                <div>{t('create.bb')}</div>
                                <div>{t('create.ante')}</div>
                                <div>{t('create.duration')}</div>
                                <div></div>
                            </div>
                            <div className="levels-list">
                                {(() => {
                                    let displayLevel = 1;
                                    return levels.map((lvl) => {
                                        const currentDisplayLevel = lvl.isBreak ? 0 : displayLevel++;
                                        return (
                                            <div key={lvl.id} className={`level-row ${lvl.isBreak ? 'is-break' : ''}`}>
                                                {lvl.isBreak ? (
                                                    <>
                                                        <div className="break-label">{t('create.break')}</div>
                                                        <input
                                                            type="text"
                                                            className="form-input form-input-sm break-name"
                                                            value={lvl.breakName || 'Break'}
                                                            onChange={(e) => handleLevelChange(lvl.id, 'breakName', e.target.value)}
                                                        />
                                                        <div></div>
                                                        <div></div>
                                                        <input
                                                            type="number"
                                                            className="form-input form-input-sm"
                                                            value={lvl.durationMinutes}
                                                            onChange={(e) => handleLevelChange(lvl.id, 'durationMinutes', Number(e.target.value))}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="level-num">{currentDisplayLevel}</div>
                                                        <input
                                                            type="number"
                                                            className="form-input form-input-sm"
                                                            value={lvl.smallBlind}
                                                            onChange={(e) => handleLevelChange(lvl.id, 'smallBlind', Number(e.target.value))}
                                                        />
                                                        <input
                                                            type="number"
                                                            className="form-input form-input-sm"
                                                            value={lvl.bigBlind}
                                                            onChange={(e) => handleLevelChange(lvl.id, 'bigBlind', Number(e.target.value))}
                                                        />
                                                        <input
                                                            type="number"
                                                            className="form-input form-input-sm"
                                                            value={lvl.ante}
                                                            onChange={(e) => handleLevelChange(lvl.id, 'ante', Number(e.target.value))}
                                                        />
                                                        <input
                                                            type="number"
                                                            className="form-input form-input-sm"
                                                            value={lvl.durationMinutes}
                                                            onChange={(e) => handleLevelChange(lvl.id, 'durationMinutes', Number(e.target.value))}
                                                        />
                                                    </>
                                                )}
                                                <button className="btn btn-ghost btn-icon text-danger" onClick={() => removeLevel(lvl.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        <div className="step-actions mt-4">
                            <button className="btn btn-ghost" onClick={() => setStep(2)}>
                                <ChevronLeft size={18} /> {t('create.back')}
                            </button>
                            <button className="btn btn-primary" onClick={() => handleNextWizardStep(4)}>
                                {t('create.nextStep')} <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="step-content">
                        <h3>{t('create.payoutsTitle')}</h3>
                        <p className="text-muted mb-4">{t('create.payoutsSubtitle')}</p>

                        <div className="form-group mb-6">
                            <label className="form-label">{t('create.houseRake')}</label>
                            <p className="text-xs text-muted mb-2">{t('create.houseRakeDesc')}</p>
                            <input
                                type="number"
                                className="form-input"
                                value={rakePercentage}
                                onChange={e => setRakePercentage(Number(e.target.value))}
                                min="0"
                                max="100"
                            />
                        </div>

                        <div className="form-group mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    style={{ width: '1.2rem', height: '1.2rem' }}
                                    checked={useCustomPayouts}
                                    onChange={(e) => setUseCustomPayouts(e.target.checked)}
                                />
                                <span>{t('create.useCustomPayouts')}</span>
                            </label>
                            <p className="text-xs text-muted mt-1 ml-7">{t('create.customPayoutsDesc')}</p>
                        </div>

                        {useCustomPayouts && (
                            <div className="custom-payouts-box glass-panel p-4 mt-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm m-0">{t('create.posPerc')}</h4>
                                    <button className="btn btn-ghost btn-sm" onClick={addPayoutPosition}>
                                        <Plus size={16} /> {t('create.addPosition')}
                                    </button>
                                </div>

                                {customPayouts.map((val, index) => (
                                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                                        <div className="text-muted" style={{ width: '40px' }}>{index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}</div>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={val}
                                                onChange={(e) => handlePayoutChange(index, Number(e.target.value))}
                                                min="0"
                                                max="100"
                                            />
                                            <span>%</span>
                                        </div>
                                        <button className="btn btn-ghost btn-icon text-danger" onClick={() => removePayoutPosition(index)} disabled={customPayouts.length === 1}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}

                                <div className={`text-right text-xs mt-3 ${customPayouts.reduce((a, b) => a + b, 0) === 100 ? 'text-success' : 'text-danger font-bold'}`}>
                                    {t('create.total')}: {customPayouts.reduce((a, b) => a + b, 0)}% ({t('create.mustBe100')})
                                </div>
                            </div>
                        )}

                        <div className="step-actions mt-4">
                            <button className="btn btn-ghost" onClick={() => setStep(3)}>
                                <ChevronLeft size={18} /> {t('create.back')}
                            </button>
                            <button className="btn btn-primary" onClick={handleCreate}>
                                <Save size={18} /> {t('create.submit')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateTournament;
