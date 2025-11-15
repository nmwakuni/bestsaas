/**
 * M-Pesa Callback types
 */

export interface STKCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: any;
        }>;
      };
    };
  };
}

export interface C2BCallback {
  TransactionType: string;
  TransID: string;
  TransTime: string;
  TransAmount: string;
  BusinessShortCode: string;
  BillRefNumber: string; // This will be the student admission number
  InvoiceNumber?: string;
  OrgAccountBalance?: string;
  ThirdPartyTransID?: string;
  MSISDN: string; // Phone number
  FirstName?: string;
}

export interface ParsedSTKCallback {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
}

/**
 * Parse STK Push callback
 */
export function parseSTKCallback(callback: STKCallback): ParsedSTKCallback {
  const { stkCallback } = callback.Body;

  const parsed: ParsedSTKCallback = {
    merchantRequestId: stkCallback.MerchantRequestID,
    checkoutRequestId: stkCallback.CheckoutRequestID,
    resultCode: stkCallback.ResultCode,
    resultDesc: stkCallback.ResultDesc,
  };

  // Extract metadata if payment was successful
  if (stkCallback.ResultCode === 0 && stkCallback.CallbackMetadata) {
    const items = stkCallback.CallbackMetadata.Item;

    items.forEach((item) => {
      switch (item.Name) {
        case "Amount":
          parsed.amount = item.Value;
          break;
        case "MpesaReceiptNumber":
          parsed.mpesaReceiptNumber = item.Value;
          break;
        case "TransactionDate":
          parsed.transactionDate = item.Value.toString();
          break;
        case "PhoneNumber":
          parsed.phoneNumber = item.Value.toString();
          break;
      }
    });
  }

  return parsed;
}

/**
 * M-Pesa Result Codes
 */
export const MPESA_RESULT_CODES: Record<number, string> = {
  0: "Success",
  1: "Insufficient Funds",
  2: "Less Than Minimum Transaction Value",
  3: "More Than Maximum Transaction Value",
  4: "Would Exceed Daily Transfer Limit",
  5: "Would Exceed Minimum Balance",
  6: "Unresolved Primary Party",
  7: "Unresolved Receiver Party",
  8: "Would Exceed Maximum Balance",
  11: "Debit Account Invalid",
  12: "Credit Account Invalid",
  13: "Unresolved Debit Account",
  14: "Unresolved Credit Account",
  15: "Duplicate Detected",
  17: "Internal Failure",
  20: "Unresolved Initiator",
  26: "Traffic Blocking Condition In Place",
  1032: "Request cancelled by user",
  1037: "DS timeout",
  2001: "Wrong PIN",
};

export function getMpesaResultMessage(code: number): string {
  return MPESA_RESULT_CODES[code] || "Unknown error";
}
