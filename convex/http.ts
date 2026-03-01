import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// ── Widget JS Handler ──
const widgetHandler = httpAction(async (ctx) => {
  const bundle = await ctx.runQuery(api.widget.getBundle);

  if (!bundle) {
    return new Response("// Widget bundle not uploaded yet", {
      status: 404,
      headers: {
        "Content-Type": "application/javascript",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return new Response(bundle.content, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    },
  });
});

const corsHandler = httpAction(async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
});

// ── Stripe Webhook Handler ──
const stripeWebhook = httpAction(async (ctx, request) => {
  const body = await request.text();

  // Parse the event — in production with webhook signing secret,
  // you'd verify the signature here. For now we parse directly.
  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventType = event.type;

  if (eventType === "checkout.session.completed") {
    const session = event.data.object;
    const companyId = session.metadata?.companyId;
    const plan = session.metadata?.plan;
    const period = session.metadata?.period;
    const subscriptionId = session.subscription;

    if (companyId && plan && period && subscriptionId) {
      await ctx.runMutation(api.companies.completeStripePayment, {
        companyId,
        stripeSubscriptionId: subscriptionId,
        plan,
        period,
      });
    }
  } else if (eventType === "customer.subscription.updated") {
    // Handles: plan changes, cancel_at_period_end, reactivation from portal
    const subscription = event.data.object;
    const customerId = subscription.customer;
    if (customerId) {
      const company = await ctx.runQuery(api.companies.findCompanyByStripeCustomer, {
        stripeCustomerId: customerId,
      });
      if (company) {
        // Detect plan + period from the subscription items
        const item = subscription.items?.data?.[0];
        const interval = item?.price?.recurring?.interval; // "month" or "year"
        const period = interval === "year" ? "yearly" : "monthly";
        // Detect plan from metadata (set during checkout)
        const plan = subscription.metadata?.plan || undefined;

        await ctx.runMutation(api.companies.handleSubscriptionUpdated, {
          companyId: company._id,
          status: subscription.status === "active" ? "active"
            : subscription.status === "past_due" ? "past_due"
            : "active",
          cancelAtPeriodEnd: subscription.cancel_at_period_end === true,
          plan,
          period,
        });
      }
    }
  } else if (eventType === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    if (customerId) {
      const company = await ctx.runQuery(api.companies.findCompanyByStripeCustomer, {
        stripeCustomerId: customerId,
      });
      if (company) {
        await ctx.runMutation(api.companies.updateStripePaymentStatus, {
          companyId: company._id,
          status: "cancelled",
        });
      }
    }
  } else if (eventType === "invoice.payment_failed") {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    // Try to find company by customer id
    const customerId = invoice.customer;
    if (customerId) {
      const company = await ctx.runQuery(api.companies.findCompanyByStripeCustomer, {
        stripeCustomerId: customerId,
      });
      if (company) {
        await ctx.runMutation(api.companies.updateStripePaymentStatus, {
          companyId: company._id,
          status: "past_due",
        });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// Widget routes
http.route({ path: "/widget.js", method: "GET", handler: widgetHandler });
http.route({ path: "/widget.js", method: "OPTIONS", handler: corsHandler });
http.route({ path: "/booking-widget.js", method: "GET", handler: widgetHandler });
http.route({ path: "/booking-widget.js", method: "OPTIONS", handler: corsHandler });

// Stripe webhook
http.route({ path: "/stripe-webhook", method: "POST", handler: stripeWebhook });

export default http;
