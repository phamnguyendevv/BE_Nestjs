import { MailerService } from '@nestjs-modules/mailer'
import { Inject, Injectable } from '@nestjs/common'

import Stripe from 'stripe'

import { EXCEPTIONS, IException } from '@domain/exceptions/exceptions.interface'
import { IMailerService } from '@domain/services/mailer.interface'
import {
  IStripeService,
  STRIPE_SERVICE,
} from '@domain/services/stripe.interface'

@Injectable()
export class NodeMailerService implements IMailerService {
  constructor(
    private readonly mailService: MailerService,
    @Inject(EXCEPTIONS)
    private readonly exceptionsService: IException,

    @Inject(STRIPE_SERVICE)
    private readonly stripeService: IStripeService,
  ) {}

  async sendMail(to: string, subject: string, text?: string): Promise<void> {
    try {
      await this.mailService.sendMail({
        to,
        subject: subject,
        from: 'App Scheduling <kingisalwayme@gmail.com>',
        text: text,
      })
    } catch (error) {
      throw this.exceptionsService.internalServerErrorException({
        type: 'InternalServerError',
        message: 'Failed to send email',
      })
    }
  }
  async sendInvoiceEmail(
    invoiceId: string,
    customerEmail: string,
  ): Promise<void> {
    const invoice = await this.stripeService.getInvoice(invoiceId)
    const result = await this.stripeService.finalizeAndSendInvoice(invoiceId)
    const emailContent = this.generateInvoiceEmailContent(result)

    await this.mailService.sendMail({
      from: 'App Scheduling',
      to: customerEmail,
      subject: `Invoice #${invoice.number} - Payment Required`,
      html: emailContent,
    })
  }

  private generateInvoiceEmailContent(invoice: Stripe.Invoice): string {
    const total = (invoice.total / 100).toFixed(2)
    const currency = invoice.currency.toUpperCase()

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invoice  #${invoice.number}</h2>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Invoice Details</h3>
          <p><strong>Invoice ID:</strong> ${invoice.id}</p>
          <p><strong>Amount:</strong> ${currency} ${total}</p>
          <p><strong>Status:</strong> ${invoice.status}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.due_date ? invoice.due_date * 1000 : 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3>Line Items</h3>
          ${invoice.lines.data
            .map(
              (item) => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <p><strong>${item.description}</strong></p>
              <p>Amount: ${currency} ${(item.amount / 100).toFixed(2)}</p>
            </div>
          `,
            )
            .join('')}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${invoice.hosted_invoice_url}" 
             style="background-color: #007cba; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            View & Pay Invoice
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          If you have any questions about this invoice, please contact our support team.
        </p>
      </div>
    `
  }
}
