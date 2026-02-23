import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../store/TournamentContext';
import { useI18n } from '../store/I18nContext';
import { PlusCircle, Play, Settings, Trash2, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import './Home.css';

const Home: React.FC = () => {
    const { state, deleteTournament } = useTournament();
    const { t } = useI18n();
    const navigate = useNavigate();

    const userTournaments = state.tournaments.filter(t => t.userId === state.user?.id);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'running': return <span className="badge badge-success">{t('status.running')}</span>;
            case 'paused': return <span className="badge badge-warning">{t('status.paused')}</span>;
            case 'completed': return <span className="badge badge-neutral">{t('status.completed')}</span>;
            default: return <span className="badge badge-neutral">{t('status.draft')}</span>;
        }
    };

    return (
        <div className="home-container">
            <div className="dashboard-header animate-fade-in">
                <div>
                    <h2>{t('home.title')}</h2>
                    <p className="text-muted">{t('home.subtitle')}</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        navigate('/create');
                    }}
                >
                    <PlusCircle size={18} /> {t('home.createNew')}
                </button>
            </div>

            {userTournaments.length === 0 ? (
                <div className="empty-state glass-panel animate-fade-in">
                    <div className="empty-icon">♠️</div>
                    <h3>{t('home.emptyTitle')}</h3>
                    <p className="text-muted">{t('home.emptySubtitle')}</p>
                    <button
                        className="btn btn-primary mt-4"
                        onClick={() => {
                            navigate('/create');
                        }}
                    >
                        <PlusCircle size={18} /> {t('home.createNew')}
                    </button>
                </div>
            ) : (
                <div className="tournament-grid">
                    {userTournaments.map((tournament, index) => (
                        <div
                            key={tournament.id}
                            className="tournament-card glass-panel animate-fade-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="card-header">
                                <h3>{tournament.name}</h3>
                                {getStatusBadge(tournament.status)}
                            </div>

                            <div className="card-details">
                                <div className="detail-item">
                                    <Calendar size={16} />
                                    <span>{format(new Date(tournament.date), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="chips-icon">💰</span>
                                    <span>{t('home.buyIn')}: ${tournament.buyIn}</span>
                                </div>
                                <div className="detail-item">
                                    <Users size={16} />
                                    <span>{tournament.players.length} {t('home.players')}</span>
                                </div>
                            </div>

                            <div className="card-actions">
                                <button
                                    className="btn btn-accent flex-1"
                                    onClick={() => window.open(`/tournament/${tournament.id}/timer`, '_blank')}
                                >
                                    <Play size={16} /> {t('home.timer')}
                                </button>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => {
                                        navigate(`/tournament/${tournament.id}/manage`);
                                    }}
                                    title={t('home.manage')}
                                >
                                    <Settings size={18} />
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => {
                                        if (window.confirm(t('home.deleteConfirm'))) {
                                            deleteTournament(tournament.id);
                                        }
                                    }}
                                    title={t('home.delete')}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Home;
