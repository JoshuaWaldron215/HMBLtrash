import type { User, Pickup, Subscription } from '@shared/schema';
import { Resend } from 'resend';

// Initialize Resend with API key or use mock for development
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : {
      emails: {
        send: async (emailData: any) => {
          console.log('📧 Mock Email Sent:', {
            from: emailData.from,
            to: emailData.to,
            subject: emailData.subject,
            htmlLength: emailData.html?.length || 0
          });
          return {
            data: { id: 'mock-email-' + Date.now() },
            error: null
          };
        }
      }
    };

export class EmailService {
  private static instance: EmailService;
  private fromEmail = 'Acapella Trash <noreply@acapellatrashremoval.com>';
  private supportEmail = 'acapellatrashhmbl@gmail.com';
  private supportPhone = '(267) 401-4292';

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private getEmailTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acapella Trash Removal</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Acapella Trash</h1>
            <p style="color: #e2e8f0; margin: 5px 0 0 0; font-size: 14px;">Powered by HMBL</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 20px;">
            ${content}
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px; border-top: 1px solid #e2e8f0;">
            <div style="text-align: center; color: #64748b; font-size: 14px;">
              <p style="margin: 0 0 10px 0;">Need help? Contact us:</p>
              <p style="margin: 0 0 5px 0;">
                📧 <a href="mailto:${this.supportEmail}" style="color: #1e3a8a; text-decoration: none;">${this.supportEmail}</a>
              </p>
              <p style="margin: 0 0 15px 0;">
                📞 <a href="tel:+12674014292" style="color: #1e3a8a; text-decoration: none;">${this.supportPhone}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;">
              <p style="margin: 0; font-size: 12px;">
                © 2025 Acapella Trash Removal. All rights reserved.<br>
                Professional waste management services powered by HMBL.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendPickupConfirmationEmail(customer: User, pickup: Pickup): Promise<void> {
    try {
      const scheduledDate = new Date(pickup.scheduledDate!);
      const formattedDate = scheduledDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background-color: #10b981; color: white; padding: 15px; border-radius: 50px; display: inline-block; margin-bottom: 20px;">
            <span style="font-size: 24px;">✅</span>
          </div>
          <h2 style="color: #1e3a8a; margin: 0; font-size: 24px;">Pickup Confirmed!</h2>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0 0 0;">Your trash pickup has been successfully scheduled.</p>
        </div>

        <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #1e3a8a; margin: 20px 0;">
          <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 18px;">Pickup Details</h3>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">📅 Scheduled Date:</strong>
            <span style="color: #1f2937; margin-left: 8px;">${formattedDate}</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">📍 Address:</strong>
            <span style="color: #1f2937; margin-left: 8px;">${pickup.address}</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">🗑️ Bag Count:</strong>
            <span style="color: #1f2937; margin-left: 8px;">${pickup.bagCount} bags</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">🏷️ Service Type:</strong>
            <span style="color: #1f2937; margin-left: 8px; text-transform: capitalize;">${pickup.serviceType}</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">💰 Total Amount:</strong>
            <span style="color: #059669; font-weight: bold; margin-left: 8px; font-size: 18px;">$${parseFloat(pickup.amount?.toString() || '0').toFixed(2)}</span>
          </div>
          
          ${pickup.specialInstructions ? `
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">📝 Special Instructions:</strong>
            <span style="color: #1f2937; margin-left: 8px;">${pickup.specialInstructions}</span>
          </div>
          ` : ''}
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 16px;">What happens next?</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>We'll send you a reminder 24 hours before your pickup</li>
            <li>Our driver will arrive during your scheduled time window</li>
            <li>Please have your bags ready at the pickup location</li>
            <li>You'll receive a notification when the pickup is complete</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Thank you for choosing Acapella Trash for your waste removal needs!
          </p>
        </div>
      `;

      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [customer.email],
        subject: `Pickup Confirmed - ${formattedDate}`,
        html: this.getEmailTemplate(content),
      });

      if (error) {
        console.error('❌ Failed to send pickup confirmation email:', error);
        throw error;
      }

      console.log('✅ Pickup confirmation email sent successfully:', data?.id);
    } catch (error) {
      console.error('❌ Error sending pickup confirmation email:', error);
      throw error;
    }
  }

  async sendSubscriptionConfirmationEmail(customer: User, subscription: Subscription): Promise<void> {
    try {
      const nextPickupDate = subscription.nextPickupDate 
        ? new Date(subscription.nextPickupDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          })
        : 'To be scheduled';

      const monthlyAmount = subscription.pricePerMonth 
        ? parseFloat(subscription.pricePerMonth.toString()).toFixed(2)
        : '0.00';

      const content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background-color: #8b5cf6; color: white; padding: 15px; border-radius: 50px; display: inline-block; margin-bottom: 20px;">
            <span style="font-size: 24px;">🎉</span>
          </div>
          <h2 style="color: #1e3a8a; margin: 0; font-size: 24px;">Welcome to Acapella Trash!</h2>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0 0 0;">Your subscription is now active and ready to go.</p>
        </div>

        <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 20px 0;">
          <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 18px;">Subscription Details</h3>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">📋 Plan:</strong>
            <span style="color: #1f2937; margin-left: 8px; text-transform: capitalize;">${subscription.frequency || 'weekly'} Service</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">💰 Monthly Rate:</strong>
            <span style="color: #059669; font-weight: bold; margin-left: 8px; font-size: 18px;">$${monthlyAmount}</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">🗑️ Bag Limit:</strong>
            <span style="color: #1f2937; margin-left: 8px;">${subscription.bagCountLimit || 5} bags per pickup</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">📅 Next Pickup:</strong>
            <span style="color: #1f2937; margin-left: 8px;">${nextPickupDate}</span>
          </div>
          
          ${subscription.preferredDay ? `
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">🗓️ Preferred Day:</strong>
            <span style="color: #1f2937; margin-left: 8px; text-transform: capitalize;">${subscription.preferredDay}</span>
          </div>
          ` : ''}
          
          ${subscription.preferredTime ? `
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">⏰ Preferred Time:</strong>
            <span style="color: #1f2937; margin-left: 8px; text-transform: capitalize;">${subscription.preferredTime}</span>
          </div>
          ` : ''}
        </div>

        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 16px;">Your Subscription Benefits</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Automatic Scheduling:</strong> Your pickups are scheduled automatically</li>
            <li><strong>Priority Service:</strong> Guaranteed pickup within your time window</li>
            <li><strong>Flexible Management:</strong> Pause, modify, or cancel anytime</li>
            <li><strong>Better Rates:</strong> Save money with subscription pricing</li>
            <li><strong>Consistent Service:</strong> Same reliable pickup every ${subscription.frequency || 'week'}</li>
          </ul>
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 16px;">Managing Your Subscription</h3>
          <p style="color: #374151; margin: 0 0 10px 0; line-height: 1.6;">
            Log into your dashboard anytime to:
          </p>
          <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>View upcoming pickups and payment history</li>
            <li>Update your preferences or pickup instructions</li>
            <li>Pause your subscription for vacations</li>
            <li>Contact our support team for assistance</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
            Thank you for choosing Acapella Trash as your trusted waste management partner!
          </p>
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            We're committed to keeping your community clean and beautiful.
          </p>
        </div>
      `;

      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [customer.email],
        subject: 'Welcome to Acapella Trash - Subscription Confirmed! 🎉',
        html: this.getEmailTemplate(content),
      });

      if (error) {
        console.error('❌ Failed to send subscription confirmation email:', error);
        throw error;
      }

      console.log('✅ Subscription confirmation email sent successfully:', data?.id);
    } catch (error) {
      console.error('❌ Error sending subscription confirmation email:', error);
      throw error;
    }
  }

  async sendPickupCompletedEmail(customer: User, pickup: Pickup): Promise<void> {
    try {
      const completedDate = pickup.completedAt 
        ? new Date(pickup.completedAt).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

      const content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background-color: #059669; color: white; padding: 15px; border-radius: 50px; display: inline-block; margin-bottom: 20px;">
            <span style="font-size: 24px;">🎉</span>
          </div>
          <h2 style="color: #1e3a8a; margin: 0; font-size: 24px;">Pickup Completed!</h2>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0 0 0;">Your trash pickup has been successfully completed.</p>
        </div>

        <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
          <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 18px;">Service Summary</h3>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">✅ Completed:</strong>
            <span style="color: #1f2937; margin-left: 8px;">${completedDate}</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">📍 Address:</strong>
            <span style="color: #1f2937; margin-left: 8px;">${pickup.address}</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">🗑️ Bags Collected:</strong>
            <span style="color: #1f2937; margin-left: 8px;">${pickup.bagCount} bags</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">🏷️ Service Type:</strong>
            <span style="color: #1f2937; margin-left: 8px; text-transform: capitalize;">${pickup.serviceType}</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #374151;">💰 Amount:</strong>
            <span style="color: #059669; font-weight: bold; margin-left: 8px; font-size: 18px;">$${parseFloat(pickup.amount?.toString() || '0').toFixed(2)}</span>
          </div>
        </div>

        ${pickup.serviceType === 'subscription' ? `
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 16px;">Your Next Pickup</h3>
          <p style="color: #374151; margin: 0; line-height: 1.6;">
            As a subscription customer, your next pickup has been automatically scheduled for next week. 
            You'll receive a confirmation email with the details shortly.
          </p>
        </div>
        ` : `
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 16px;">Need Another Pickup?</h3>
          <p style="color: #374151; margin: 0 0 10px 0; line-height: 1.6;">
            Schedule your next pickup anytime through your dashboard or consider our subscription service for:
          </p>
          <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>Automatic weekly pickups</li>
            <li>Better pricing than one-time services</li>
            <li>Priority scheduling and support</li>
          </ul>
        </div>
        `}

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
            Thank you for choosing Acapella Trash for your waste removal needs!
          </p>
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Your satisfaction and our community's cleanliness are our top priorities.
          </p>
        </div>
      `;

      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [customer.email],
        subject: `Pickup Complete - Thank You! 🎉`,
        html: this.getEmailTemplate(content),
      });

      if (error) {
        console.error('❌ Failed to send pickup completion email:', error);
        throw error;
      }

      console.log('✅ Pickup completion email sent successfully:', data?.id);
    } catch (error) {
      console.error('❌ Error sending pickup completion email:', error);
      throw error;
    }
  }

  async sendPickupRescheduledEmail(customer: User, pickup: Pickup, originalDate: Date, newDate: Date): Promise<void> {
    try {
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [customer.email],
        subject: `Acapella Trash Pickup Rescheduled - ${newDate.toLocaleDateString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a8a;">Pickup Rescheduled</h2>
            <p>Dear ${customer.username || 'valued customer'},</p>
            
            <p>Your trash pickup has been rescheduled:</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Original Date:</strong> ${originalDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              <p><strong>New Date:</strong> ${newDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              <p><strong>Address:</strong> ${pickup.address}</p>
              <p><strong>Bags:</strong> ${pickup.bagCount}</p>
              <p><strong>Amount:</strong> $${parseFloat(pickup.amount?.toString() || '0').toFixed(2)}</p>
            </div>
            
            <p>We apologize for any inconvenience. If you have any questions, please contact us at <a href="mailto:acapellatrashhmbl@gmail.com">acapellatrashhmbl@gmail.com</a> or call <a href="tel:+12674014292">(267) 401-4292</a>.</p>
            
            <p>Best regards,<br>
            <strong>Acapella Trash Removal Team</strong><br>
            Powered by HMBL</p>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Email send error:', error);
        throw new Error(`Failed to send reschedule email: ${error}`);
      }

      console.log('📧 Reschedule email sent successfully:', {
        id: data?.id,
        to: customer.email,
        subject: `Pickup Rescheduled - ${newDate.toLocaleDateString()}`
      });
    } catch (error: any) {
      console.error('❌ Email service error:', error);
      throw error;
    }
  }

  async sendSubscriptionWelcomeEmail(customer: User, subscription: Subscription): Promise<void> {
    try {
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [customer.email],
        subject: 'Welcome to Acapella Trash - Your Subscription is Active!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a8a;">Welcome to Acapella Trash! 🎉</h2>
            <p>Dear ${customer.username || 'valued customer'},</p>
            
            <p>Thank you for subscribing to our weekly trash pickup service! Your subscription is now active.</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <h3 style="color: #16a34a; margin-top: 0;">Subscription Details</h3>
              <p><strong>Plan:</strong> ${subscription.frequency} pickup</p>
              <p><strong>Price:</strong> $${subscription.pricePerMonth}/month</p>
              <p><strong>Bag Limit:</strong> ${subscription.bagCountLimit} bags per pickup</p>
              <p><strong>Service Area:</strong> Philadelphia Metro</p>
            </div>
            
            <h3 style="color: #1e3a8a;">What happens next?</h3>
            <ul>
              <li>Your first pickup will be scheduled within 24 hours</li>
              <li>You'll receive email confirmations for each pickup</li>
              <li>Leave your bags curbside before 7 AM on pickup day</li>
              <li>Billing occurs monthly via your saved payment method</li>
            </ul>
            
            <p>Questions? Contact us at <a href="mailto:acapellatrashhmbl@gmail.com">acapellatrashhmbl@gmail.com</a> or <a href="tel:+12674014292">(267) 401-4292</a>.</p>
            
            <p>Welcome to the family!<br>
            <strong>Acapella Trash Removal Team</strong><br>
            Powered by HMBL</p>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Email send error:', error);
        throw new Error(`Failed to send welcome email: ${error}`);
      }

      console.log('📧 Subscription welcome email sent successfully:', {
        id: data?.id,
        to: customer.email,
        subject: 'Welcome to Acapella Trash - Your Subscription is Active!'
      });
    } catch (error: any) {
      console.error('❌ Email service error:', error);
      throw error;
    }
  }

  async sendOneTimePickupConfirmationEmail(customer: User, pickup: Pickup): Promise<void> {
    try {
      const serviceTypeLabel = pickup.serviceType === 'same-day' ? 'Same-Day' : 'Next-Day';
      const scheduledDate = new Date(pickup.scheduledDate || new Date());
      
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [customer.email],
        subject: `Pickup Confirmed - ${serviceTypeLabel} Service`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a8a;">Pickup Confirmed! ✅</h2>
            <p>Dear ${customer.username || 'valued customer'},</p>
            
            <p>Your ${serviceTypeLabel.toLowerCase()} trash pickup has been confirmed and scheduled.</p>
            
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1d4ed8; margin-top: 0;">Pickup Details</h3>
              <p><strong>Service:</strong> ${serviceTypeLabel} Pickup</p>
              <p><strong>Scheduled:</strong> ${scheduledDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              <p><strong>Address:</strong> ${pickup.address}</p>
              <p><strong>Bags:</strong> ${pickup.bagCount}</p>
              <p><strong>Total:</strong> $${parseFloat(pickup.amount?.toString() || '0').toFixed(2)}</p>
              ${pickup.specialInstructions ? `<p><strong>Special Instructions:</strong> ${pickup.specialInstructions}</p>` : ''}
            </div>
            
            <h3 style="color: #1e3a8a;">Pickup Instructions</h3>
            <ul>
              <li>Place bags curbside before 7 AM on pickup day</li>
              <li>Use standard trash bags (no loose items)</li>
              <li>Keep bags away from vehicles and obstacles</li>
              <li>You'll receive a completion notification after pickup</li>
            </ul>
            
            <p>Need to reschedule? Contact us at <a href="mailto:acapellatrashhmbl@gmail.com">acapellatrashhmbl@gmail.com</a> or <a href="tel:+12674014292">(267) 401-4292</a>.</p>
            
            <p>Thank you for choosing Acapella Trash!<br>
            <strong>Acapella Trash Removal Team</strong><br>
            Powered by HMBL</p>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Email send error:', error);
        throw new Error(`Failed to send pickup confirmation email: ${error}`);
      }

      console.log('📧 Pickup confirmation email sent successfully:', {
        id: data?.id,
        to: customer.email,
        subject: `Pickup Confirmed - ${serviceTypeLabel} Service`
      });
    } catch (error: any) {
      console.error('❌ Email service error:', error);
      throw error;
    }
  }

  async sendPickupCompletedEmail(customer: User, pickup: Pickup): Promise<void> {
    try {
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [customer.email],
        subject: 'Pickup Completed - Thank You!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Pickup Completed! ✅</h2>
            <p>Dear ${customer.username || 'valued customer'},</p>
            
            <p>Your trash pickup has been completed successfully.</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <h3 style="color: #16a34a; margin-top: 0;">Pickup Summary</h3>
              <p><strong>Completed:</strong> ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}</p>
              <p><strong>Address:</strong> ${pickup.address}</p>
              <p><strong>Bags Collected:</strong> ${pickup.bagCount}</p>
              <p><strong>Service Type:</strong> ${pickup.serviceType === 'subscription' ? 'Weekly Subscription' : 
                pickup.serviceType === 'same-day' ? 'Same-Day Pickup' : 'Next-Day Pickup'}</p>
            </div>
            
            ${pickup.serviceType === 'subscription' ? `
              <div style="background-color: #fefce8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #a16207; margin: 0;"><strong>📅 Next Pickup:</strong> Your next weekly pickup is automatically scheduled for next week!</p>
              </div>
            ` : ''}
            
            <p>Thank you for choosing Acapella Trash Removal. We appreciate your business!</p>
            
            <p>Questions or feedback? Contact us at <a href="mailto:acapellatrashhmbl@gmail.com">acapellatrashhmbl@gmail.com</a> or <a href="tel:+12674014292">(267) 401-4292</a>.</p>
            
            <p>Best regards,<br>
            <strong>Acapella Trash Removal Team</strong><br>
            Powered by HMBL</p>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Email send error:', error);
        throw new Error(`Failed to send completion email: ${error}`);
      }

      console.log('📧 Pickup completion email sent successfully:', {
        id: data?.id,
        to: customer.email,
        subject: 'Pickup Completed - Thank You!'
      });
    } catch (error: any) {
      console.error('❌ Email service error:', error);
      throw error;
    }
  }
}

export const emailService = EmailService.getInstance();