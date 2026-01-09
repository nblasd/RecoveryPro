import React, { useState, useEffect } from 'react';
import { Settings, DollarSign, Target, TrendingUp, Wallet, Lightbulb } from 'lucide-react';
import { CURRENCIES, DEFAULT_PAYOUT, suggestBaseAmount, calculateSeriesCost, formatCurrency } from '../utils/calculator';

const SetupForm = ({ onStart }) => {
    const [currency, setCurrency] = useState('USD');
    const [baseAmount, setBaseAmount] = useState(CURRENCIES.USD.minAmount);
    const [targetGoal, setTargetGoal] = useState(50);
    const [capital, setCapital] = useState(1000);
    const [payout, setPayout] = useState(DEFAULT_PAYOUT * 100);
    const [maxSteps, setMaxSteps] = useState(8);

    useEffect(() => {
        // Update base amount default when currency changes
        const min = CURRENCIES[currency].minAmount;
        if (baseAmount < min) setBaseAmount(min);
    }, [currency]);

    const handleSuggestion = () => {
        const payoutRate = payout / 100;
        const min = CURRENCIES[currency].minAmount;

        let suggested = suggestBaseAmount(capital, targetGoal, payoutRate, maxSteps);
        if (suggested < min) suggested = min;

        // Check if even min is safe?
        const cost = calculateSeriesCost(suggested, payoutRate, maxSteps);
        if (cost > capital) {
            alert(`Warning: Your capital (${formatCurrency(capital, currency)}) is not enough for even the minimum series cost (${formatCurrency(cost, currency)}) at ${maxSteps} steps.`);
        }

        setBaseAmount(suggested);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onStart({
            currency,
            baseAmount: Number(baseAmount),
            targetGoal: Number(targetGoal),
            capital: Number(capital),
            payout: Number(payout) / 100,
            maxSteps: Number(maxSteps)
        });
    };

    const currentSeriesCost = calculateSeriesCost(Number(baseAmount), Number(payout) / 100, maxSteps);
    const isRisky = currentSeriesCost > capital;

    return (
        <div className="w-full max-w-md p-8 glass-panel rounded-2xl animate-fade-in relative">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <Settings className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Strategy Setup</h2>
                    <p className="text-slate-400 text-sm">Configure your money management</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Currency Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Currency</label>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.keys(CURRENCIES).map((code) => (
                            <button
                                key={code}
                                type="button"
                                onClick={() => setCurrency(code)}
                                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${currency === code
                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/10'
                                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                <span className="font-bold">{code}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Total Capital */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Total Capital</label>
                    <div className="relative">
                        <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="number"
                            min="1"
                            value={capital}
                            onChange={(e) => setCapital(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 glass-input rounded-xl"
                            required
                        />
                    </div>
                </div>

                {/* Target Goal */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Daily Profit Target</label>
                    <div className="relative">
                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="number"
                            min="1"
                            value={targetGoal}
                            onChange={(e) => setTargetGoal(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 glass-input rounded-xl"
                            required
                        />
                    </div>
                </div>

                {/* Base Amount with Autosuggest */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-slate-300">Base Trade Amount</label>
                        <button type="button" onClick={handleSuggestion} className="text-xs text-cyan-400 flex items-center gap-1 hover:underline">
                            <Lightbulb className="w-3 h-3" /> Suggest Safe Amount
                        </button>
                    </div>
                    <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="number"
                            min={CURRENCIES[currency].minAmount}
                            value={baseAmount}
                            onChange={(e) => setBaseAmount(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 glass-input rounded-xl ${isRisky ? 'border-red-500 text-red-100' : ''}`}
                            required
                        />
                    </div>
                    {isRisky && (
                        <p className="text-xs text-red-400 mt-1">
                            ⚠️ Risk Warning: 8 consecutive losses will exceed your capital ({formatCurrency(currentSeriesCost, currency)} required).
                        </p>
                    )}
                    {!isRisky && currentSeriesCost > 0 && (
                        <p className="text-xs text-emerald-400/70 mt-1">
                            ✓ Max session drawdown: {formatCurrency(currentSeriesCost, currency)}
                        </p>
                    )}
                </div>

                {/* Strategy Limit */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Strategy Risk (Cons. Losses Covered)</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[3, 4, 5, 6, 7, 8, 9, 10].map(step => (
                            <button
                                key={step}
                                type="button"
                                onClick={() => setMaxSteps(step)}
                                className={`py-2 rounded-lg border text-sm font-medium transition-all ${maxSteps === step
                                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                    : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-500'
                                    }`}
                            >
                                {step}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500">
                        You need to win 1 trade out of {maxSteps}. {maxSteps < 5 ? '(Requires less capital but higher risk)' : '(Safer but requires more capital)'}
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isRisky}
                    className={`w-full py-4 mt-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-all ${isRisky ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'btn-primary'
                        }`}
                >
                    {isRisky ? 'Insufficient Capital' : 'Start Trading Session'}
                </button>
            </form>
        </div>
    );
};

export default SetupForm;
