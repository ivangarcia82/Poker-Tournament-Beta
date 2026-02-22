import React from 'react';
import Joyride from 'react-joyride';
import type { Step } from 'react-joyride';
import { useTour } from '../store/TourContext';
import { useI18n } from '../store/I18nContext';

export const TourGuide: React.FC = () => {
    const { run, stepIndex, setStepIndex, stopTour } = useTour();
    const { t } = useI18n();

    const steps: Step[] = [
        // 0. Welcome (Home)
        {
            target: '.header-content .logo',
            content: t('tour.welcome'),
            disableBeacon: true,
            placement: 'bottom',
        },
        // 1. Click Create Tournament (Home) -> transitions to Create
        {
            target: '.dashboard-header .btn-primary',
            content: t('tour.clickCreate'),
            placement: 'bottom',
            spotlightClicks: true,
            disableOverlayClose: true,
            hideFooter: true,
        },
        // 2. Fill Form Basics (Create page - Step 1) -> click "Next Step"
        {
            target: '.create-card .step-actions .btn-primary',
            content: t('tour.createStep1'),
            placement: 'top',
            spotlightClicks: true,
            disableOverlayClose: true,
            hideFooter: true,
        },
        // 3. Fill Form Bonuses (Create page - Step 2) -> click "Next Step"
        {
            target: '.create-card .step-actions .btn-primary',
            content: t('tour.createStep2'),
            placement: 'top',
            spotlightClicks: true,
            disableOverlayClose: true,
            hideFooter: true,
        },
        // 4. Fill Form Structure (Create page - Step 3) -> click "Next Step"
        {
            target: '.create-card .step-actions .btn-primary',
            content: t('tour.createStep3'),
            placement: 'top',
            spotlightClicks: true,
            disableOverlayClose: true,
            hideFooter: true,
        },
        // 5. Fill Form Payouts (Create page - Step 4) -> click "Submit"
        {
            target: '.create-card .step-actions .btn-primary',
            content: t('tour.createStep4'),
            placement: 'top',
            spotlightClicks: true,
            disableOverlayClose: true,
            hideFooter: true,
        },
        // 6. Click Manage (Home) -> transitions to Manage
        {
            target: '.tournament-card .btn-ghost',
            content: t('tour.clickManage'),
            placement: 'bottom',
            spotlightClicks: true,
            disableOverlayClose: true,
            hideFooter: true,
        },
        // 7. Add Player (Management page) -> user submits form
        {
            target: '.add-player-form-container',
            content: t('tour.addPlayer'),
            placement: 'bottom',
            spotlightClicks: true,
            disableOverlayClose: true,
            hideFooter: true,
        },
        // 8. Done (Management page)
        {
            target: '.player-list',
            content: t('tour.finish'),
            placement: 'top',
        }
    ];

    const handleJoyrideCallback = (data: any) => {
        const { action, index, status, type } = data;

        if (status === 'finished' || status === 'skipped') {
            stopTour();
        } else if (type === 'step:after' && !steps[index].hideFooter) {
            // Only auto-advance if it's not a step waiting for an external trigger action
            setStepIndex(index + (action === 'prev' ? -1 : 1));
        } else if (type === 'target:notFound' && !steps[index].hideFooter) {
            // Error fallback
            setStepIndex(index + (action === 'prev' ? -1 : 1));
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            stepIndex={stepIndex}
            continuous={true}
            showSkipButton={true}
            floaterProps={{ disableAnimation: true }}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#3b82f6',
                    backgroundColor: '#1e293b',
                    textColor: '#f8fafc',
                    arrowColor: '#1e293b',
                    overlayColor: 'rgba(0, 0, 0, 0.75)',
                    zIndex: 10000,
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                buttonNext: {
                    backgroundColor: '#10b981'
                },
                buttonBack: {
                    marginRight: 10,
                    color: '#94a3b8'
                },
                buttonSkip: {
                    color: '#ef4444'
                }
            }}
            locale={{
                back: t('tour.back'),
                close: t('tour.close'),
                last: t('tour.last'),
                next: t('tour.next'),
                skip: t('tour.skip'),
            }}
        />
    );
};
