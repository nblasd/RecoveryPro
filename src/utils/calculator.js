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

export function suggestBaseAmount(capital, targetGoal, payout, maxSteps = MAX_STEPS) {
  // Simplification: Check safety of a proposed amount.
  const isSafe = (amount) => calculateSeriesCost(amount, payout, maxSteps) <= capital; 

  // 1. Goal-based suggestion (aim for ~30 sessions)
  let suggested = targetGoal / (30 * payout);
  
  suggested = Math.floor(suggested);
  if (suggested < 1) suggested = 1;

  // 2. Clamp to Safety
  while (!isSafe(suggested) && suggested > 0) {
    suggested--;
  }
  
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
