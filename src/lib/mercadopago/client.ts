import { MercadoPagoConfig, Preference, Payment, PreApproval } from "mercadopago";

function getConfig() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  return new MercadoPagoConfig({ accessToken });
}

export function getPreference() {
  return new Preference(getConfig());
}

export function getPayment() {
  return new Payment(getConfig());
}

export function getPreApproval() {
  return new PreApproval(getConfig());
}
