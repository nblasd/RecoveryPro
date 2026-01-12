export const CURRENCIES = {
  USD: { symbol: '$', minAmount: 1, name: 'USD' },
  PKR: { symbol: 'Rs', minAmount: 300, name: 'PKR' }
};

export const DEFAULT_PAYOUT = 0.92;
export const MAX_STEPS = 8;

/**
 * Calculates the series of trade amounts required to maintain profit.
 * Logic: At any step i, a win should recover all previous losses + the profit of the first trade.
 * Formula: Bet[i] = (Sum(Bet[0..i-1]) + FirstBet * Payout) / Payout
 */
export function calculateTradeSeries(baseAmount, payoutRate = DEFAULT_PAYOUT, maxSteps = MAX_STEPS) {
  const steps = [];
  let totalCtxLoss = 0;
  // Desired net profit is the result of the first winning trade
  const targetProfit = baseAmount * payoutRate;

  for (let i = 0; i < maxSteps; i++) {
    if (i === 0) {
      steps.push(baseAmount);
      totalCtxLoss += baseAmount;
    } else {
      let nextBet = (totalCtxLoss + targetProfit) / payoutRate;
      nextBet = Math.ceil(nextBet * 100) / 100;
      
      steps.push(nextBet);
      totalCtxLoss += nextBet;
    }
  }
  
  return {
    trades: steps,
    totalInvestment: steps.reduce((a, b) => a + b, 0),
    sessionProfit: targetProfit,
    payoutRate: payoutRate
  };
}

export function calculateSeriesCost(baseAmount, payout, maxSteps = MAX_STEPS) {
  const { totalInvestment } = calculateTradeSeries(baseAmount, payout, maxSteps);
  return totalInvestment;
}

export function suggestBaseAmount(capitalInput, targetGoalInput, payoutInput, maxStepsInput = MAX_STEPS) {
  const capital = Number(capitalInput);
  const targetGoal = Number(targetGoalInput);
  const payout = Number(payoutInput);
  const maxSteps = Number(maxStepsInput);

  if (isNaN(capital) || isNaN(targetGoal) || isNaN(payout) || capital <= 0) return 1;

  // 1. Calculate the cost factor for this strategy (how much capital is needed per $1 of base bet)
  const costPerUnit = calculateSeriesCost(1, payout, maxSteps);
  
  // 2. Determine an absolute ceiling (safety limit)
  // We want to risk no more than 70% of capital for a single session series
  const maxSafeBase = (capital * 0.7) / costPerUnit;

  // 3. Determine an efficiency target
  // Aim to reach the goal in about 20-50 sessions for a good balance
  // Goal = Sessions * (BaseAmount * Payout) 
  // BaseAmount = Goal / (Sessions * Payout)
  const targetSessions = 40;
  const efficientBase = targetGoal / (targetSessions * payout);

  // 4. Determine a "Fast" target (10 sessions) but cap it at the safe limit
  const fastBase = targetGoal / (10 * payout);

  // 5. Select the best amount
  // We prefer the efficientBase, but if it's too risky, we use maxSafeBase.
  // If efficientBase is tiny, we might scale up toward fastBase if it's still safe.
  let suggested = Math.min(efficientBase, maxSafeBase);
  
  // If we have huge capital surplus, we can safely go faster
  if (fastBase < maxSafeBase * 0.8) {
    suggested = Math.max(suggested, Math.min(fastBase, maxSafeBase * 0.5));
  }

  // 6. Round and Clamp
  suggested = Math.floor(suggested);
  if (suggested < 1) suggested = 1;

  return suggested;
}

export function calculateSessionsNeeded(targetGoal, currentBalance, sessionProfit) {
  const remaining = targetGoal - currentBalance;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / sessionProfit);
}

export function formatCurrency(amount, currencyCode) {
  const currency = CURRENCIES[currencyCode];
  if (!currency) return `${amount}`;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}
