import { Inject, Injectable, Logger } from '@nestjs/common'

import { error } from 'console'
import Stripe from 'stripe'

import { CheckoutSessionEntity } from '@domain/entities/payment.entity'
import { EXCEPTIONS, IException } from '@domain/exceptions/exceptions.interface'
import {
  IStripeService,
  STRIPE_CLIENT,
} from '@domain/services/stripe.interface'

import { CreateCheckoutSessionDto } from '@adapters/controllers/payments/dto/create-checkout-session.dto'
import { CreateInvoiceFromOrderDto } from '@adapters/controllers/payments/dto/create-invoices-payment.dto'

import { EnvironmentConfigService } from '@infrastructure/config/environment/environment-config.service'

@Injectable()
export class StripeService implements IStripeService {
  private readonly logger = new Logger(StripeService.name)
  constructor(
    @Inject(STRIPE_CLIENT)
    private readonly stripeClient: Stripe,

    private readonly environmentConfigService: EnvironmentConfigService,

    @Inject(EXCEPTIONS)
    private readonly exceptionsService: IException,
  ) {}

  // Accept Payments (Create Payment Intent)
  async createPaymentIntent(params: {
    amount: number
    currency: string
    metadata?: {
      appointmentId?: number
      userId?: string
    }
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const paymentIntent = await this.stripeClient.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      automatic_payment_methods: { enabled: true },
      metadata: params.metadata,
    })

    return {
      clientSecret: paymentIntent.client_secret || '',
      paymentIntentId: paymentIntent.id,
    }
  }

  async getPaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent =
        await this.stripeClient.paymentIntents.retrieve(paymentIntentId)
      // Nếu thanh toán chưa succeed thì không cần kiểm tra refund
      if (paymentIntent.status !== 'succeeded') {
        return {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          isRefunded: false,
          metadata: paymentIntent.metadata,
          totalRefunded: 0,
          refundDetails: [],
        }
      }
      // Nếu đã succeed → mới cần check refund
      const refunds = await this.stripeClient.refunds.list({
        payment_intent: paymentIntentId,
      })
      const totalRefunded = refunds.data.reduce((sum, r) => sum + r.amount, 0)

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        isRefunded: totalRefunded > 0,
        metadata: paymentIntent.metadata,
        totalRefunded,
        refundDetails: refunds.data,
      }
    } catch {
      throw new Error(`Stripe retrieve error:`)
    }
  }

  async createRefund(
    paymentIntentId: string,
    amount?: number,
  ): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripeClient.refunds.create({
        payment_intent: paymentIntentId,
        amount,
      })

      return refund
    } catch {
      throw new Error(`Stripe refund error:`)
    }
  }

  constructEventFromPayload(payload: string, signature: string): Stripe.Event {
    const webhookSecret = this.environmentConfigService.getStripeWebhookSecret()
    try {
      return this.stripeClient.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      )
    } catch (error) {
      throw new Error(`Webhook signature verification failed`)
    }
  }

  async createCheckoutSession(checkoutSessionDto: CheckoutSessionEntity) {
    try {
      const session = await this.stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: checkoutSessionDto.name,
                description: checkoutSessionDto.description,
              },
              unit_amount: checkoutSessionDto.amount,
            },
            quantity: 1,
          },
        ],
        customer: checkoutSessionDto.customerId,
        mode: 'payment',
        success_url: checkoutSessionDto.successUrl,
        cancel_url: checkoutSessionDto.cancelUrl,
        payment_intent_data: {
          metadata: {
            appointmentId: checkoutSessionDto.appointmentId,
            userId: checkoutSessionDto.userId,
          },
        },
      })

      return {
        sessionId: session.id,
        url: session.url,
      }
    } catch (error) {
      this.logger.error('Stripe checkout error:', error)
      throw new Error(`Stripe checkout error`)
    }
  }
  async createInvoice(params: {
    customerId: string
    description?: string
    metadata?: Record<string, string>
    dueDate?: number
    autoAdvance?: boolean
  }): Promise<Stripe.Invoice> {
    try {
      const invoice = await this.stripeClient.invoices.create({
        customer: params.customerId,
        description: params.description,
        metadata: params.metadata,
        due_date: params.dueDate,
        auto_advance: params.autoAdvance ?? false,
      })

      return invoice
    } catch (error) {
      this.logger.error('Create invoice error:', error)
      throw new Error('Failed to create invoice')
    }
  }
  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await this.stripeClient.invoices.retrieve(invoiceId, {
        expand: ['payment_intent', 'subscription', 'customer'],
      })

      return invoice
    } catch (error) {
      this.logger.error('Get invoice error:', error)
      throw new Error('Failed to retrieve invoice')
    }
  }
  async getInvoices(params?: {
    customerId?: string
    status?: Stripe.Invoice.Status
    limit?: number
    startingAfter?: string
    endingBefore?: string
    created?: {
      gte?: number
      lte?: number
    }
  }) {
    try {
      const invoices = await this.stripeClient.invoices.list({
        customer: params?.customerId,
        status: params?.status,
        limit: params?.limit || 10,
        starting_after: params?.startingAfter,
        ending_before: params?.endingBefore,
        created: params?.created,
        expand: ['data.customer', 'data.payment_intent'],
      })

      return {
        invoices: invoices.data,
        hasMore: invoices.has_more,
        total: invoices.data.length,
      }
    } catch (error) {
      this.logger.error('Get invoices error:', error)
      throw new Error('Failed to retrieve invoices')
    }
  }
  async finalizeInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice =
        await this.stripeClient.invoices.finalizeInvoice(invoiceId)
      return invoice
    } catch (error) {
      this.logger.error('Finalize invoice error:', error)
      throw new Error('Failed to finalize invoice')
    }
  }
  async sendInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await this.stripeClient.invoices.sendInvoice(invoiceId)
      return invoice
    } catch (error) {
      this.logger.error('Send invoice error:', error)
      throw new Error('Failed to send invoice')
    }
  }
  async addInvoiceItem(params: {
    customerId: string
    amount: number
    currency: string
    description?: string
    invoiceId?: string
    metadata?: Record<string, string>
  }): Promise<Stripe.InvoiceItem> {
    try {
      const invoiceItem = await this.stripeClient.invoiceItems.create({
        customer: params.customerId,
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        invoice: params.invoiceId,
        metadata: params.metadata,
      })

      return invoiceItem
    } catch (error) {
      this.logger.error('Add invoice item error:', error)
      throw new Error('Failed to add invoice item')
    }
  }
  async payInvoice(
    invoiceId: string,
    params?: {
      paymentMethod?: string
      source?: string
    },
  ): Promise<Stripe.Invoice> {
    try {
      const invoice = await this.stripeClient.invoices.pay(invoiceId, {
        payment_method: params?.paymentMethod,
        source: params?.source,
      })

      return invoice
    } catch (error) {
      this.logger.error('Pay invoice error:', error)
      throw new Error('Failed to pay invoice')
    }
  }
  async voidInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await this.stripeClient.invoices.voidInvoice(invoiceId)
      return invoice
    } catch (error) {
      this.logger.error('Void invoice error:', error)
      throw new Error('Failed to void invoice')
    }
  }
  async getCustomerInvoices(
    customerId: string,
    params?: {
      status?: Stripe.Invoice.Status
      limit?: number
    },
  ) {
    try {
      const invoices = await this.stripeClient.invoices.list({
        customer: customerId,
        status: params?.status,
        limit: params?.limit || 10,
        expand: ['data.payment_intent'],
      })

      return {
        invoices: invoices.data,
        hasMore: invoices.has_more,
        total: invoices.data.length,
      }
    } catch (error) {
      this.logger.error('Get customer invoices error:', error)
      throw new Error('Failed to get customer invoices')
    }
  }
  async createOrGetCustomer(params: {
    email: string
    name?: string
    phone?: string
    description?: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postal_code?: string
      country?: string
    }
    metadata?: Record<string, string>
  }): Promise<Stripe.Customer> {
    try {
      const existingCustomer = await this.findCustomerByEmail(params.email)

      if (existingCustomer) {
        if (params.name || params.phone || params.address || params.metadata) {
          return await this.updateCustomer(existingCustomer.id, {
            name: params.name,
            phone: params.phone,
            description: params.description,
            address: params.address,
            metadata: params.metadata,
          })
        }
        return existingCustomer
      }
      return await this.createCustomer(params)
    } catch (error) {
      this.logger.error('Create or get customer error:', error)
      throw this.exceptionsService.badRequestException({
        type: 'CreateOrGetCustomerException',
        message: 'Failed to create or get customer',
      })
    }
  }
  async findCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
    try {
      const customers = await this.stripeClient.customers.list({
        email: email,
        limit: 1,
      })

      return customers.data.length > 0 ? customers.data[0] : null
    } catch (error) {
      this.logger.error('Find customer by email error:', error)
      throw this.exceptionsService.badRequestException({
        type: 'FindCustomerByEmailException',
        message: 'Failed to find customer by email',
      })
    }
  }
  async createCustomer(params: {
    email?: string
    name?: string
    phone?: string
    description?: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postal_code?: string
      country?: string
    }
    shipping?: {
      name: string
      address: {
        line1: string
        line2?: string
        city: string
        state?: string
        postal_code: string
        country: string
      }
    }
    metadata?: Record<string, string>
    paymentMethod?: string // để attach payment method luôn
  }): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripeClient.customers.create({
        email: params.email,
        name: params.name,
        phone: params.phone,
        description: params.description,
        address: params.address,
        shipping: params.shipping,
        metadata: params.metadata,
      })

      // Nếu có payment method thì attach luôn
      if (params.paymentMethod) {
        await this.stripeClient.paymentMethods.attach(params.paymentMethod, {
          customer: customer.id,
        })
      }

      return customer
    } catch (error) {
      this.logger.error('Create customer error:', error)
      throw new Error('Failed to create customer')
    }
  }
  async updateCustomer(
    customerId: string,
    params: {
      email?: string
      name?: string
      phone?: string
      description?: string
      address?: {
        line1?: string
        line2?: string
        city?: string
        state?: string
        postal_code?: string
        country?: string
      }
      metadata?: Record<string, string>
    },
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripeClient.customers.update(customerId, {
        email: params.email,
        name: params.name,
        phone: params.phone,
        description: params.description,
        address: params.address,
        metadata: params.metadata,
      })

      return customer
    } catch (error) {
      this.logger.error('Update customer error:', error)
      throw new Error('Failed to update customer')
    }
  }

  //-------------------------invoice-------------------------
  async createInvoiceFromOrder(dto: CreateInvoiceFromOrderDto) {
    try {
      const customer = await this.createOrGetCustomer({
        email: dto.customerInfo.email,
        name: dto.customerInfo.name,
        phone: dto.customerInfo.phone,
        address: dto.customerInfo.address,
        metadata: {
          paymentId: dto.paymentId.toString(),
          ...dto.metadata,
        },
      })

      this.logger.log(
        `Using customer: ${customer.email} for order: ${dto.paymentId}`,
      )

      // 2. Tạo draft invoice
      const invoice = await this.stripeClient.invoices.create({
        customer: customer.id,
        collection_method: 'send_invoice',
        days_until_due: dto.dueDays || 7,
        description: dto.description || `Invoice for Order #${dto.paymentId}`,
        metadata: {
          paymentId: dto.paymentId.toString(),
          customerEmail: dto.customerInfo.email,
          ...dto.metadata,
        },
        auto_advance: false,
      })

      for (const item of dto.items) {
        await this.stripeClient.invoiceItems.create({
          customer: customer.id,
          invoice: invoice.id,
          amount: item.unitAmount * item.quantity,
          currency: 'usd',
          description: `${item.name} x ${item.quantity}`,
          metadata: {
            productName: item.name,
            quantity: item.quantity.toString(),
            unitAmount: item.unitAmount.toString(),
          },
        })
      }

      const updatedInvoice = await this.stripeClient.invoices.retrieve(
        invoice.id!,
      )

      return {
        invoiceId: invoice.id,
        customerId: customer.id,
        customerEmail: dto.customerInfo.email,
        status: invoice.status,
        amount: updatedInvoice.amount_due,
        currency: updatedInvoice.currency,
        dueDate: invoice.due_date,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        lineItemsCount: dto.items.length,
      }
    } catch (error) {
      this.logger.error('Create invoice from order error:', error)
      throw new Error(`Failed to create invoice from order`)
    }
  }
  async finalizeAndSendInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const finalizedInvoice =
        await this.stripeClient.invoices.finalizeInvoice(invoiceId)

      const sentInvoice =
        await this.stripeClient.invoices.sendInvoice(invoiceId)

      return sentInvoice
    } catch (error) {
      this.logger.error('Finalize and send invoice error:', error)
      throw this.exceptionsService.internalServerErrorException({
        type: 'FinalizeAndSendInvoiceException',
        message: 'This invoice is already finalized, cannot finalize again',
      })
    }
  }
  async getInvoiceDetails(invoiceId: string) {
    try {
      const invoice = await this.stripeClient.invoices.retrieve(invoiceId, {
        expand: ['payment_intent', 'customer', 'lines.data', 'subscription'],
      })

      return {
        id: invoice.id,
        status: invoice.status,
        amount: invoice.amount_due,
        amountPaid: invoice.amount_paid,
        amountRemaining: invoice.amount_remaining,
        currency: invoice.currency,
        dueDate: invoice.due_date,
        paidAt: invoice.status_transitions?.paid_at,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        // paymentIntent: invoice.payment_intent,
        customer: invoice.customer,
        lineItems: invoice.lines.data,
        metadata: invoice.metadata,
      }
    } catch (error) {
      this.logger.error('Get invoice details error:', error)
      throw new Error('Failed to get invoice details')
    }
  }
  async getSession(sessionId: string) {
    try {
      const session = await this.stripeClient.checkout.sessions.retrieve(sessionId)
      return session
    } catch (error) {
      this.logger.error('Get session error:', error)
      throw new Error('Failed to get session')
    }
  }
}
