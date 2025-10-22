require("dotenv").config()
const { Order } = require("../models")
const logger = require("../utils/logger")

// Initialize Stripe with proper error handling
let stripe
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.warn("STRIPE_SECRET_KEY is not set in environment variables. Payment features will not work.")
    stripe = null
  } else {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
    logger.info("Stripe initialized successfully")
  }
} catch (error) {
  logger.error("Failed to initialize Stripe:", error.message)
  stripe = null
}

// @desc    Create Stripe Payment Intent
// @route   POST /api/payments/create-payment-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: "Payment service is not configured. Please contact administrator.",
      })
    }

    const userId = req.user.id
    const { amount, currency = "usd", orderId } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      })
    }

    // Create payment intent with MANUAL CAPTURE (authorization only)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      capture_method: "manual", // Authorization only - payment will be captured when admin confirms order
      metadata: {
        userId: userId.toString(),
        orderId: orderId ? orderId.toString() : "",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    logger.info(`Payment authorized (not captured yet): ${paymentIntent.id} for user ${userId}`)

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    })
  } catch (error) {
    logger.error("Create payment intent error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
      error: error.message,
    })
  }
}

// @desc    Confirm Payment
// @route   POST /api/payments/confirm-payment
// @access  Private
const confirmPayment = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: "Payment service is not configured. Please contact administrator.",
      })
    }

    const { paymentIntentId, orderId } = req.body

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Payment Intent ID is required",
      })
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === "succeeded") {
      // Update order payment status if orderId is provided
      if (orderId) {
        const order = await Order.findByPk(orderId)
        if (order) {
          await order.update({
            payment_status: "paid",
            payment_method: "stripe",
            stripe_payment_id: paymentIntentId,
          })
        }
      }

      res.json({
        success: true,
        message: "Payment confirmed successfully",
        data: {
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
        },
      })
    } else {
      res.status(400).json({
        success: false,
        message: "Payment not completed",
        data: {
          status: paymentIntent.status,
        },
      })
    }
  } catch (error) {
    logger.error("Confirm payment error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message,
    })
  }
}

// @desc    Handle Stripe Webhook
// @route   POST /api/payments/webhook
// @access  Public (Stripe only)
const handleWebhook = async (req, res) => {
  if (!stripe) {
    logger.error("Stripe not initialized. Cannot process webhook.")
    return res.status(503).send("Payment service not configured")
  }

  const sig = req.headers["stripe-signature"]
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  // If webhook secret is not configured, use the raw body as event
  if (!webhookSecret) {
    logger.warn("STRIPE_WEBHOOK_SECRET not configured. Webhook signature verification skipped.")
    event = req.body
  } else {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err) {
      logger.error("Webhook signature verification failed:", err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object
      logger.info("PaymentIntent was successful!", paymentIntent.id)

      // Update order status
      if (paymentIntent.metadata.orderId) {
        try {
          const order = await Order.findByPk(paymentIntent.metadata.orderId)
          if (order) {
            await order.update({
              payment_status: "paid",
              stripe_payment_id: paymentIntent.id,
            })
            logger.info(`Order ${order.order_number} payment status updated to paid`)
          }
        } catch (error) {
          logger.error("Error updating order after payment success:", error)
        }
      }
      break

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object
      logger.error("PaymentIntent failed!", failedPayment.id)

      // Update order status to failed
      if (failedPayment.metadata.orderId) {
        try {
          const order = await Order.findByPk(failedPayment.metadata.orderId)
          if (order) {
            await order.update({
              payment_status: "failed",
            })
            logger.info(`Order ${order.order_number} payment status updated to failed`)
          }
        } catch (error) {
          logger.error("Error updating order after payment failure:", error)
        }
      }
      break

    case "charge.refunded":
      const refund = event.data.object
      logger.info("Charge was refunded!", refund.id)
      break

    default:
      logger.info(`Unhandled event type ${event.type}`)
  }

  res.json({ received: true })
}

// @desc    Create Checkout Session
// @route   POST /api/payments/create-checkout-session
// @access  Private
const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: "Payment service is not configured. Please contact administrator.",
      })
    }

    const userId = req.user.id
    const { items, orderId, successUrl, cancelUrl } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items provided",
      })
    }

    // Format line items for Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          description: item.description || "",
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }))

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl || `${process.env.FRONTEND_URL}/order-confirmation/${orderId}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/checkout`,
      metadata: {
        userId: userId.toString(),
        orderId: orderId ? orderId.toString() : "",
      },
    })

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    })
  } catch (error) {
    logger.error("Create checkout session error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
      error: error.message,
    })
  }
}

// @desc    Get Payment Status
// @route   GET /api/payments/status/:paymentIntentId
// @access  Private
const getPaymentStatus = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: "Payment service is not configured. Please contact administrator.",
      })
    }

    const { paymentIntentId } = req.params

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    res.json({
      success: true,
      data: {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        created: paymentIntent.created,
      },
    })
  } catch (error) {
    logger.error("Get payment status error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get payment status",
      error: error.message,
    })
  }
}

// @desc    Capture Authorized Payment (when admin confirms order)
// @route   POST /api/payments/capture-payment
// @access  Private/Admin
const capturePayment = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: "Payment service is not configured. Please contact administrator.",
      })
    }

    const { paymentIntentId, orderId } = req.body

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Payment Intent ID is required",
      })
    }

    // Capture the authorized payment
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId)

    logger.info(`Payment captured successfully: ${paymentIntent.id} for order ${orderId}`)

    // Update order payment status if orderId provided
    if (orderId) {
      const order = await Order.findByPk(orderId)
      if (order) {
        await order.update({
          payment_status: "paid",
          status: "confirmed",
        })
        logger.info(`Order ${orderId} payment status updated to paid`)
      }
    }

    res.json({
      success: true,
      message: "Payment captured successfully",
      data: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        status: paymentIntent.status,
      },
    })
  } catch (error) {
    logger.error("Capture payment error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to capture payment",
      error: error.message,
    })
  }
}

// @desc    Cancel Authorized Payment (when admin rejects order)
// @route   POST /api/payments/cancel-payment
// @access  Private/Admin
const cancelPayment = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: "Payment service is not configured. Please contact administrator.",
      })
    }

    const { paymentIntentId, orderId } = req.body

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Payment Intent ID is required",
      })
    }

    // Cancel the authorized payment
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId)

    logger.info(`Payment cancelled successfully: ${paymentIntent.id} for order ${orderId}`)

    // Update order payment status if orderId provided
    if (orderId) {
      const order = await Order.findByPk(orderId)
      if (order) {
        await order.update({
          payment_status: "cancelled",
          status: "cancelled",
        })
        logger.info(`Order ${orderId} payment status updated to cancelled`)
      }
    }

    res.json({
      success: true,
      message: "Payment authorization released. Amount will be returned to customer.",
      data: {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      },
    })
  } catch (error) {
    logger.error("Cancel payment error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to cancel payment",
      error: error.message,
    })
  }
}

module.exports = {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  createCheckoutSession,
  getPaymentStatus,
  capturePayment, // NEW: For admin to capture payment
  cancelPayment, // NEW: For admin to cancel payment
}
