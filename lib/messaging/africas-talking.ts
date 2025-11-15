/**
 * Africa's Talking SMS and WhatsApp Integration
 * Docs: https://developers.africastalking.com/
 */

interface SMSOptions {
  to: string[]; // Phone numbers in format 254XXXXXXXXX
  message: string;
  from?: string; // Sender ID (must be approved)
}

interface WhatsAppOptions {
  to: string[]; // Phone numbers
  message: string;
}

interface SMSResponse {
  SMSMessageData: {
    Message: string;
    Recipients: Array<{
      statusCode: number;
      number: string;
      status: string;
      cost: string;
      messageId: string;
    }>;
  };
}

class AfricasTalkingService {
  private username: string;
  private apiKey: string;
  private senderId: string;
  private baseUrl: string;

  constructor() {
    this.username = process.env.AT_USERNAME || "sandbox";
    this.apiKey = process.env.AT_API_KEY || "";
    this.senderId = process.env.AT_SENDER_ID || "SCHOOL";
    this.baseUrl = "https://api.africastalking.com/version1";
  }

  /**
   * Send SMS
   */
  async sendSMS(options: SMSOptions): Promise<SMSResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messaging`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          apiKey: this.apiKey,
          Accept: "application/json",
        },
        body: new URLSearchParams({
          username: this.username,
          to: options.to.join(","),
          message: options.message,
          from: options.from || this.senderId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("SMS sent successfully:", data);
      return data;
    } catch (error: any) {
      console.error("SMS sending error:", error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send bulk SMS to multiple recipients
   */
  async sendBulkSMS(recipients: string[], message: string): Promise<SMSResponse> {
    return this.sendSMS({
      to: recipients,
      message,
    });
  }

  /**
   * Send fee reminder SMS
   */
  async sendFeeReminder(
    parentPhone: string,
    studentName: string,
    admissionNumber: string,
    balance: number
  ): Promise<SMSResponse> {
    const message = `Dear Parent, ${studentName} (${admissionNumber}) has a pending fee balance of KES ${balance.toLocaleString()}. Please clear to avoid inconvenience. Thank you.`;

    return this.sendSMS({
      to: [parentPhone],
      message,
    });
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmation(
    parentPhone: string,
    studentName: string,
    amount: number,
    receiptNumber: string,
    newBalance: number
  ): Promise<SMSResponse> {
    const message = `Payment received! KES ${amount.toLocaleString()} for ${studentName}. Receipt: ${receiptNumber}. New balance: KES ${newBalance.toLocaleString()}. Thank you.`;

    return this.sendSMS({
      to: [parentPhone],
      message,
    });
  }

  /**
   * Send general announcement
   */
  async sendAnnouncement(recipients: string[], announcement: string): Promise<SMSResponse> {
    return this.sendSMS({
      to: recipients,
      message: announcement,
    });
  }

  /**
   * Send WhatsApp message (if enabled)
   * Note: Requires WhatsApp to be enabled on your AT account
   */
  async sendWhatsApp(options: WhatsAppOptions): Promise<any> {
    try {
      // WhatsApp uses a different endpoint
      const response = await fetch(`${this.baseUrl}/messaging/whatsapp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apiKey: this.apiKey,
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: this.username,
          recipients: options.to.map((to) => ({
            phoneNumber: to,
            message: options.message,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("WhatsApp sent successfully:", data);
      return data;
    } catch (error: any) {
      console.error("WhatsApp sending error:", error);
      throw new Error(`Failed to send WhatsApp: ${error.message}`);
    }
  }

  /**
   * Get SMS delivery reports
   */
  async getDeliveryReports(messageId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/messaging/reports?username=${this.username}&messageId=${messageId}`,
        {
          method: "GET",
          headers: {
            apiKey: this.apiKey,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Error fetching delivery reports:", error);
      throw new Error(`Failed to fetch delivery reports: ${error.message}`);
    }
  }

  /**
   * Check account balance
   */
  async getBalance(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/user?username=${this.username}`, {
        method: "GET",
        headers: {
          apiKey: this.apiKey,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Error fetching balance:", error);
      throw new Error(`Failed to fetch balance: ${error.message}`);
    }
  }
}

// Singleton instance
let atInstance: AfricasTalkingService | null = null;

export function getAfricasTalkingService(): AfricasTalkingService {
  if (!atInstance) {
    atInstance = new AfricasTalkingService();
  }
  return atInstance;
}

export type { SMSOptions, WhatsAppOptions, SMSResponse };
