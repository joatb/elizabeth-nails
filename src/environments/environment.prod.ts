export const environment = {
  production: true,
  endpoint: process.env['NG_APP_ENDPOINT'] || 'https://cloud.appwrite.io/v1',
  whatsappAccessToken: process.env['NG_APP_WHATSAPP_ACCESS_TOKEN'] || '',
  whatsappPhoneNumberId: process.env['NG_APP_WHATSAPP_PHONE_NUMBER_ID'] || '',
};
