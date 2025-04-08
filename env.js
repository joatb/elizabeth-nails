const fs = require('fs');
const path = require('path');
const successColor = '\x1b[32m%s\x1b[0m';
const checkSign = '\u{2705}';

const envDevelopmentFile = `export const environment = {
    production: false,
    endpoint: '${process.env.NG_APP_ENDPOINT}',
    whatsappAccessToken: '${process.env.NG_APP_WHATSAPP_ACCESS_TOKEN}',
    whatsappPhoneNumberId: '${process.env.NG_APP_WHATSAPP_PHONE_NUMBER_ID}',
};
`;
const targetPathDevelopment = path.join(__dirname, './src/environments/environment.ts');
fs.writeFile(targetPathDevelopment, envDevelopmentFile, (err) => {
    if (err) {
        console.error(err);
        throw err;
    } else {
        console.log(successColor, `${checkSign} Successfully generated environment.ts`);
    }
});

const envProductionFile = `export const environment = {
    production: true,
    endpoint: '${process.env.NG_APP_ENDPOINT}',
    whatsappAccessToken: '${process.env.NG_APP_WHATSAPP_ACCESS_TOKEN}',
    whatsappPhoneNumberId: '${process.env.NG_APP_WHATSAPP_PHONE_NUMBER_ID}',
};
`;
const targetPathProduction = path.join(__dirname, './src/environments/environment.prod.ts');
fs.writeFile(targetPathProduction, envProductionFile, (err) => {
    if (err) {
        console.error(err);
        throw err;
    } else {
        console.log(successColor, `${checkSign} Successfully generated environment.prod.ts`);
    }
});