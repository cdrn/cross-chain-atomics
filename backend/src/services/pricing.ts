import Decimal from "decimal.js";
import { PricingParameters } from "../types";

// Set precision for our calculations
Decimal.set({ precision: 20 });

export class PricingService {
  private static readonly SQRT_2PI = new Decimal(
    "2.506628274631000502415765284811045253006986740609938316629923576"
  );

  /**
   * Calculate the cumulative normal distribution function
   */
  private static normalCDF(x: Decimal): Decimal {
    const t = new Decimal(1).div(
      new Decimal(1).plus(new Decimal("0.2316419").mul(x.abs()))
    );
    const d = new Decimal("-0.5")
      .mul(x.mul(x))
      .exp()
      .div(PricingService.SQRT_2PI);

    const poly = new Decimal("1.330274429")
      .mul(t.pow(5))
      .minus(new Decimal("1.821255978").mul(t.pow(4)))
      .plus(new Decimal("1.781477937").mul(t.pow(3)))
      .minus(new Decimal("0.356563782").mul(t.pow(2)))
      .plus(new Decimal("0.319381530").mul(t));

    let cdf = new Decimal(1).minus(d.mul(poly));
    if (x.isNegative()) {
      cdf = new Decimal(1).minus(cdf);
    }

    return cdf;
  }

  /**
   * Calculate option premium using Black-Scholes formula
   */
  public calculatePremium(params: PricingParameters): number {
    const S = new Decimal(params.spotPrice);
    const K = new Decimal(params.strikePrice);
    const T = new Decimal(params.timeToExpiry);
    const r = new Decimal(params.riskFreeRate);
    const sigma = new Decimal(params.volatility);

    const d1 = S.div(K)
      .ln()
      .plus(r.plus(sigma.pow(2).div(2)).mul(T))
      .div(sigma.mul(T.sqrt()));

    const d2 = d1.minus(sigma.mul(T.sqrt()));

    // Calculate call option price
    const callPrice = S.mul(PricingService.normalCDF(d1)).minus(
      K.mul(new Decimal(-r.mul(T)).exp()).mul(PricingService.normalCDF(d2))
    );

    return callPrice.toNumber();
  }

  /**
   * Calculate implied volatility using Newton-Raphson method
   */
  public calculateImpliedVolatility(
    marketPrice: number,
    params: Omit<PricingParameters, "volatility">
  ): number {
    let sigma = new Decimal(0.5); // Initial guess
    const ITERATIONS = 100;
    const EPSILON = new Decimal("0.0001");

    for (let i = 0; i < ITERATIONS; i++) {
      const price = this.calculatePremium({
        ...params,
        volatility: sigma.toNumber(),
      });
      const diff = new Decimal(price).minus(marketPrice);

      if (diff.abs().lessThan(EPSILON)) {
        return sigma.toNumber();
      }

      // Adjust volatility guess using Newton-Raphson
      const vega = this.calculateVega({
        ...params,
        volatility: sigma.toNumber(),
      });
      sigma = sigma.minus(diff.div(vega));

      // Ensure volatility stays within reasonable bounds
      if (sigma.lessThan("0.01")) sigma = new Decimal("0.01");
      if (sigma.greaterThan("5")) sigma = new Decimal("5");
    }

    throw new Error("Implied volatility did not converge");
  }

  /**
   * Calculate option vega (sensitivity to volatility)
   */
  private calculateVega(params: PricingParameters): number {
    const S = new Decimal(params.spotPrice);
    const K = new Decimal(params.strikePrice);
    const T = new Decimal(params.timeToExpiry);
    const r = new Decimal(params.riskFreeRate);
    const sigma = new Decimal(params.volatility);

    const d1 = S.div(K)
      .ln()
      .plus(r.plus(sigma.pow(2).div(2)).mul(T))
      .div(sigma.mul(T.sqrt()));

    const vega = S.mul(T.sqrt())
      .mul(new Decimal("-0.5").mul(d1.pow(2)).exp())
      .div(PricingService.SQRT_2PI);

    return vega.toNumber();
  }
}
