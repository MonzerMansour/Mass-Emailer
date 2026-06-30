export interface Recipient {
  id: string;
  email: string;
  [key: string]: string;
}

export interface SendResult {
  recipientId: string;
  email: string;
  status: 'pending' | 'sending' | 'sent' | 'error';
  error?: string;
}
