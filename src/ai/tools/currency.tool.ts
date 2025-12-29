
import { z } from 'zod';

export async function convertCurrency({ amount, from, to }: {
  amount: number;
  from: string;
  to: string;
}) {
  try {
    const res = await fetch(
      `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`
    );
    const data = await res.json();
    if (!data.result) throw new Error('Rate not available');
    return {
      result: Number(data.result.toFixed(2)),
      rate: data.info.rate,
      from: `${amount} ${from}`,
      to: `${data.result.toFixed(2)} ${to}`,
    };
  } catch (error) {
    console.error('Currency conversion API failed, using fallback rates:', error);
    
    const rates: Record<string, number> = { USD: 1, MXN: 19.8, EUR: 0.92, PLN: 3.95 };
    const result = amount * (rates[to] || 1) / (rates[from] || 1);
    return {
      result: Number(result.toFixed(2)),
      rate: 1,
      from: `${amount} ${from}`,
      to: `${result.toFixed(2)} ${to}`
    };
  }
}


export const convertCurrencySchema = z.object({
  amount: z.number().positive().describe('The amount to convert'),
  from: z.string().length(3).toUpperCase().describe('Source currency code (3 letters)'),
  to: z.string().length(3).toUpperCase().describe('Target currency code (3 letters)'),
});