import axios from "axios";

/**
 * M-Pesa Daraja API Integration for Kenya
 * Docs: https://developer.safaricom.co.ke/APIs
 */

type Environment = "sandbox" | "production";

interface DarajaConfig {
  consumerKey: string;
  consumerSecret: string;
  businessShortCode: string;
  passkey: string;
  environment: Environment;
  callbackUrl: string;
}

interface STKPushRequest {
  phoneNumber: string; // Format: 254XXXXXXXXX
  amount: number;
  accountReference: string; // e.g., admission number
  transactionDesc: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface CallbackMetadata {
  MpesaReceiptNumber: string;
  TransactionDate: string;
  PhoneNumber: string;
  Amount: number;
}

class DarajaAPI {
  private config: DarajaConfig;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: DarajaConfig) {
    this.config = config;
    this.baseUrl =
      config.environment === "sandbox"
        ? "https://sandbox.safaricom.co.ke"
        : "https://api.safaricom.co.ke";
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken!;
    }

    try {
      const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString(
        "base64"
      );

      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in 3600 seconds, we'll refresh 5 minutes before
      this.tokenExpiry = Date.now() + (3600 - 300) * 1000;

      return this.accessToken!;
    } catch (error) {
      console.error("Error getting access token:", error);
      throw new Error("Failed to authenticate with M-Pesa");
    }
  }

  /**
   * Generate password for STK Push
   */
  private generatePassword(): { password: string; timestamp: string } {
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);

    const password = Buffer.from(
      `${this.config.businessShortCode}${this.config.passkey}${timestamp}`
    ).toString("base64");

    return { password, timestamp };
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa Online)
   */
  async stkPush(request: STKPushRequest): Promise<STKPushResponse> {
    try {
      const token = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      const payload = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(request.amount), // Must be integer
        PartyA: request.phoneNumber,
        PartyB: this.config.businessShortCode,
        PhoneNumber: request.phoneNumber,
        CallBackURL: this.config.callbackUrl,
        AccountReference: request.accountReference,
        TransactionDesc: request.transactionDesc,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("STK Push error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || "STK Push failed");
    }
  }

  /**
   * Query STK Push transaction status
   */
  async stkPushQuery(checkoutRequestID: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      const payload = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID,
      };

      const response = await axios.post(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("STK Query error:", error.response?.data || error.message);
      throw new Error("STK Push query failed");
    }
  }

  /**
   * Register C2B URLs (for Paybill/Till number payments)
   */
  async registerC2BUrls(validationUrl: string, confirmationUrl: string): Promise<any> {
    try {
      const token = await this.getAccessToken();

      const payload = {
        ShortCode: this.config.businessShortCode,
        ResponseType: "Completed", // or "Cancelled"
        ConfirmationURL: confirmationUrl,
        ValidationURL: validationUrl,
      };

      const response = await axios.post(`${this.baseUrl}/mpesa/c2b/v1/registerurl`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("C2B Registration error:", error.response?.data || error.message);
      throw new Error("C2B URL registration failed");
    }
  }

  /**
   * B2C (Business to Customer) - For refunds
   */
  async b2cPayment(phoneNumber: string, amount: number, remarks: string): Promise<any> {
    try {
      const token = await this.getAccessToken();

      // Note: B2C requires additional security credentials
      // This is a simplified version
      const payload = {
        InitiatorName: "YOUR_INITIATOR_NAME", // Get from Daraja portal
        SecurityCredential: "YOUR_SECURITY_CREDENTIAL", // Encrypted password
        CommandID: "BusinessPayment",
        Amount: Math.round(amount),
        PartyA: this.config.businessShortCode,
        PartyB: phoneNumber,
        Remarks: remarks,
        QueueTimeOutURL: `${this.config.callbackUrl}/b2c/timeout`,
        ResultURL: `${this.config.callbackUrl}/b2c/result`,
        Occasion: remarks,
      };

      const response = await axios.post(`${this.baseUrl}/mpesa/b2c/v1/paymentrequest`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("B2C Payment error:", error.response?.data || error.message);
      throw new Error("B2C payment failed");
    }
  }
}

// Singleton instance
let darajaInstance: DarajaAPI | null = null;

export function getDarajaAPI(): DarajaAPI {
  if (!darajaInstance) {
    const config: DarajaConfig = {
      consumerKey: process.env.MPESA_CONSUMER_KEY || "",
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
      businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE || "",
      passkey: process.env.MPESA_PASSKEY || "",
      environment: (process.env.MPESA_ENVIRONMENT as Environment) || "sandbox",
      callbackUrl: process.env.MPESA_CALLBACK_URL || "",
    };

    darajaInstance = new DarajaAPI(config);
  }

  return darajaInstance;
}

export type { STKPushRequest, STKPushResponse, CallbackMetadata };
