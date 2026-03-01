"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import Stripe from "stripe";

// ── Price IDs — these will map plan + period to Stripe prices
// We create prices dynamically via the Stripe API on first use
const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  starter: { monthly: 2900, yearly: 29000 },   // in cents: €29/mo, €290/yr
  pro: { monthly: 4900, yearly: 49000 },        // €49/mo, €490/yr
  enterprise: { monthly: 9900, yearly: 99000 }, // €99/mo, €990/yr
};

const PLAN_NAMES: Record<string, string> = {
  starter: "UNLOCKED Starter",
  pro: "UNLOCKED Pro",
  enterprise: "UNLOCKED Enterprise",
};

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" as any });
}

/**
 * Create a Stripe Checkout Session for a company's plan subscription.
 * Returns the checkout URL to redirect the user to.
 */
export const createCheckoutSession = action({
  args: {
    companyId: v.id("companies"),
    plan: v.union(v.literal("starter"), v.literal("pro"), v.literal("enterprise")),
    period: v.union(v.literal("monthly"), v.literal("yearly")),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const stripe = getStripe();

    // Get company details
    const company = await ctx.runQuery(api.companies.getById, { id: args.companyId });
    if (!company) throw new Error("Company not found");

    const priceConfig = PLAN_PRICES[args.plan];
    if (!priceConfig) throw new Error("Invalid plan");

    const unitAmount = args.period === "monthly" ? priceConfig.monthly : priceConfig.yearly;

    // Create or reuse Stripe customer
    let customerId = (company as any).stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.email,
        name: company.name,
        metadata: {
          companyId: args.companyId,
        },
      });
      customerId = customer.id;

      // Save Stripe customer ID
      await ctx.runMutation(api.companies.updateStripeCustomer, {
        companyId: args.companyId,
        stripeCustomerId: customerId,
      });
    }

    // Create checkout session with a subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: PLAN_NAMES[args.plan],
              description: `${args.plan.charAt(0).toUpperCase() + args.plan.slice(1)} plan — ${args.period === "monthly" ? "Monthly" : "Yearly"} subscription`,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: args.period === "monthly" ? "month" : "year",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        companyId: args.companyId,
        plan: args.plan,
        period: args.period,
      },
      subscription_data: {
        metadata: {
          companyId: args.companyId,
          plan: args.plan,
          period: args.period,
        },
      },
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
    });

    if (!session.url) throw new Error("Failed to create checkout session");

    // Mark payment as pending
    await ctx.runMutation(api.companies.updateStripePaymentStatus, {
      companyId: args.companyId,
      status: "pending",
      plan: args.plan,
      period: args.period,
    });

    return session.url;
  },
});
