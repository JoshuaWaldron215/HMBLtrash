import { Resend } from 'resend';
import type { User, Pickup, Subscription } from '@shared/schema';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  private static instance: EmailService;
  private fromEmail = 'Acapella Trash <noreply@acapellatrashremoval.com>';

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
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
        throw new Error(`Failed to send reschedule email: ${error.message}`);
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
        throw new Error(`Failed to send welcome email: ${error.message}`);
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
        throw new Error(`Failed to send pickup confirmation email: ${error.message}`);
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
        throw new Error(`Failed to send completion email: ${error.message}`);
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