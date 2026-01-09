import React, { useState, useMemo } from 'react';
import { calculateTradeSeries, calculateSessionsNeeded, formatCurrency, MAX_STEPS } from '../utils/calculator';
import { Target, TrendingUp, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const Dashboard = ({ config, onReset }) => {
    const [currentSession, setCurrentSession] = useState(1);
    const [currentStep, setCurrentStep] = useState(0);
    const [currentProfit, setCurrentProfit] = useState(0);
    const [history, setHistory] = useState([]); // { session, result: 'WIN'|'BUST', profit }

    const { trades, sessionProfit, totalInvestment } = useMemo(() =>
        calculateTradeSeries(config.baseAmount, config.payout, config.maxSteps),
        [config.baseAmount, config.payout, config.maxSteps]);

    const currentTradeAmount = trades[currentStep];
    const goalProgress = (currentProfit / config.targetGoal) * 100;
    const sessionsNeeded = calculateSessionsNeeded(config.targetGoal, currentProfit, sessionProfit);

    const handleWin = () => {
        // A win completes the session with the target profit
        const newProfit = currentProfit + sessionProfit;
        setCurrentProfit(newProfit);
        setHistory(prev => [{ session: currentSession, result: 'WIN', profit: sessionProfit }, ...prev]);

        // Reset for next session
        setCurrentSession(s => s + 1);
        setCurrentStep(0);
    };

    const handleLoss = () => {
        if (currentStep < config.maxSteps - 1) {
            // Just move to next step
            setCurrentStep(s => s + 1);
        } else {
            // BUST: Lost all steps
            // Loss is total sum of all trades in series
            const lossAmount = trades.reduce((a, b) => a + b, 0);
            const newProfit = currentProfit - lossAmount;
            setCurrentProfit(newProfit);
            setHistory(prev => [{ session: currentSession, result: 'BUST', profit: -lossAmount }, ...prev]);

            // Reset for next session (painful one)
            setCurrentSession(s => s + 1);
            setCurrentStep(0);
        }
    };

    const isGoalReached = currentProfit >= config.targetGoal;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl flex flex-col items-center">
                    <span className="text-slate-400 text-xs uppercase tracking-wider">Goal</span>
                    <span className="text-xl font-bold text-white">{formatCurrency(config.targetGoal, config.currency)}</span>
                </div>
                <div className="glass-panel p-4 rounded-xl flex flex-col items-center">
                    <span className="text-slate-400 text-xs uppercase tracking-wider">Current</span>
                    <span className={`text-xl font-bold ${currentProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(currentProfit, config.currency)}
                    </span>
                </div>
                <div className="glass-panel p-4 rounded-xl flex flex-col items-center">
                    <span className="text-slate-400 text-xs uppercase tracking-wider">Sessions Left</span>
                    <span className="text-xl font-bold text-cyan-400">{isGoalReached ? 0 : sessionsNeeded}</span>
                </div>
                <div className="glass-panel p-4 rounded-xl flex flex-col items-center">
                    <span className="text-slate-400 text-xs uppercase tracking-wider">Win Rate</span>
                    <span className="text-xl font-bold text-indigo-400">
                        {history.length > 0
                            ? Math.round((history.filter(h => h.result === 'WIN').length / history.length) * 100) + '%'
                            : '-'}
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="glass-panel p-1 rounded-full relative overflow-hidden h-6">
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, goalProgress))}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                    {Math.round(goalProgress)}%
                </div>
            </div>

            {/* Main Trading Card */}
            <div className="glass-panel rounded-2xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

                {isGoalReached ? (
                    <div className="py-12 space-y-6">
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <CheckCircle className="w-12 h-12 text-emerald-400" />
                        </div>
                        <h2 className="text-4xl font-bold text-white">Goal Reached!</h2>
                        <p className="text-slate-400">You achieved your target of {formatCurrency(config.targetGoal, config.currency)}</p>
                        <button onClick={onReset} className="btn-primary py-3 px-8 rounded-xl flex items-center gap-2 mx-auto">
                            <RefreshCw className="w-5 h-5" /> Start New Goal
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-sm font-medium bg-slate-800/80 px-3 py-1 rounded-full text-slate-300 border border-slate-700">
                                Session {currentSession}
                            </span>
                            <span className="text-sm font-medium bg-slate-800/80 px-3 py-1 rounded-full text-slate-300 border border-slate-700">
                                Step {currentStep + 1} / {config.maxSteps}
                            </span>
                        </div>

                        <div className="mb-12">
                            <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Investment Amount</p>
                            <div className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tighter">
                                {formatCurrency(currentTradeAmount, config.currency)}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Potential Payout: <span className="text-emerald-400">{formatCurrency(currentTradeAmount * (1 + config.payout), config.currency)}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <button
                                onClick={handleLoss}
                                className="btn-danger py-6 rounded-2xl flex flex-col items-center justify-center gap-1 group"
                            >
                                <XCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                <span className="text-lg uppercase tracking-wider">Loss</span>
                            </button>

                            <button
                                onClick={handleWin}
                                className="btn-success py-6 rounded-2xl flex flex-col items-center justify-center gap-1 group"
                            >
                                <CheckCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                <span className="text-lg uppercase tracking-wider">Win</span>
                            </button>
                        </div>

                        {currentStep > 0 && (
                            <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                <div className="text-left">
                                    <p className="text-sm text-orange-200">Martingale Active</p>
                                    <p className="text-xs text-orange-400/80">
                                        Investment increased to recover previous {currentStep} losses in this session.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Steps Preview */}
            {!isGoalReached && (
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Session Progression</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {trades.map((amount, idx) => (
                            <div
                                key={idx}
                                className={`flex-none min-w-[5rem] px-2 py-3 rounded-lg border text-center relative flex flex-col justify-center ${idx === currentStep
                                    ? 'bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/10 scale-105 z-10'
                                    : idx < currentStep
                                        ? 'bg-red-500/10 border-red-500/30 opacity-50'
                                        : 'bg-slate-800/30 border-slate-700/50'
                                    }`}
                            >
                                {idx < currentStep && (
                                    <div className="absolute top-1 right-1 text-red-500">
                                        <XCircle className="w-3 h-3" />
                                    </div>
                                )}
                                <div className="text-[10px] text-slate-500 mb-1 uppercase">Step {idx + 1}</div>
                                <div className={`font-bold text-sm break-all ${idx === currentStep ? 'text-white' : 'text-slate-400'}`}>
                                    {typeof amount === 'number' && amount < 1000 ? amount : formatCurrency(amount, config.currency).replace(config.currency === 'USD' ? '$' : 'Rs', '')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
