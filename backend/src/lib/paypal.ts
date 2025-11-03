import axios from 'axios';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || '';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_BASE_URL = PAYPAL_MODE === 'production' 
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Obtiene un access token de PayPal
 */
async function getAccessToken(): Promise<string> {
  // Si tenemos un token válido, retornarlo
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    
    const response = await axios.post<{
      access_token: string;
      expires_in: number;
    }>(
      `${PAYPAL_BASE_URL}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const newToken = response.data.access_token;
    if (!newToken) {
      throw new Error('No se recibió access_token de PayPal');
    }

    accessToken = newToken;
    // El token expira en response.data.expires_in segundos (típicamente 32400 = 9 horas)
    // Reducimos 5 minutos como margen de seguridad
    tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

    return accessToken;
  } catch (error) {
    console.error('Error obteniendo access token de PayPal:', error);
    throw new Error('No se pudo obtener el token de acceso de PayPal');
  }
}

export interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
}

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  invoiceId?: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

/**
 * Crea una orden de pago en PayPal
 */
export async function createOrder(params: CreateOrderParams): Promise<PayPalOrder> {
  const token = await getAccessToken();
  const { amount, currency = 'USD', invoiceId, description, returnUrl, cancelUrl } = params;

  try {
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: description || `Pago de factura ${invoiceId || ''}`,
          custom_id: invoiceId || '',
          invoice_id: invoiceId || '',
        },
      ],
      application_context: {
        brand_name: 'IGER - Sistema de Gestión Escolar',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: returnUrl || 'https://dev.d2umdnu9x2m9qg.amplifyapp.com/payments/success',
        cancel_url: cancelUrl || 'https://dev.d2umdnu9x2m9qg.amplifyapp.com/payments/cancel',
      },
    };

    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v2/checkout/orders`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      }
    );

    return {
      id: response.data.id,
      status: response.data.status,
      links: response.data.links || [],
    };
  } catch (error) {
    console.error('Error creando orden PayPal:', error);
    if (axios.isAxiosError(error)) {
      console.error('PayPal error response:', error.response?.data);
      throw new Error(`Error de PayPal: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Captura un pago de una orden
 */
export async function captureOrder(orderId: string): Promise<PayPalOrder> {
  const token = await getAccessToken();

  try {
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      }
    );

    return {
      id: response.data.id,
      status: response.data.status,
      links: response.data.links || [],
    };
  } catch (error) {
    console.error('Error capturando orden PayPal:', error);
    if (axios.isAxiosError(error)) {
      console.error('PayPal error response:', error.response?.data);
      throw new Error(`Error de PayPal: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Obtiene detalles de una orden
 */
export async function getOrder(orderId: string): Promise<PayPalOrder> {
  const token = await getAccessToken();

  try {
    const response = await axios.get(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      id: response.data.id,
      status: response.data.status,
      links: response.data.links || [],
    };
  } catch (error) {
    console.error('Error obteniendo orden PayPal:', error);
    if (axios.isAxiosError(error)) {
      console.error('PayPal error response:', error.response?.data);
      throw new Error(`Error de PayPal: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Valida la firma del webhook de PayPal
 */
export function validateWebhookSignature(
  _headers: Record<string, string | undefined>, 
  _body: string, 
  _webhookId?: string
): boolean {
  // TODO: Implementar validación de firma del webhook
  // PayPal envía un header 'PAYPAL-AUTH-ALGO' y 'PAYPAL-CERT-URL' para validación
  // Por ahora, en sandbox aceptamos todos los webhooks
  // En producción, deberías validar la firma usando la certificación de PayPal
  
  if (PAYPAL_MODE === 'sandbox') {
    console.log('⚠️ Webhook aceptado sin validación (modo sandbox)');
    return true;
  }

  // En producción, implementar validación real
  console.warn('⚠️ Validación de webhook no implementada para producción');
  return true;
}

