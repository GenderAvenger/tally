var yaml = require('yamljs');

function set(name, value) {
  if (!(name in process.env)) {
    process.env[name] = value;
  }
}

set('NODE_ENV', 'localDevelopment');
if (process.env.NODE_ENV == 'localDevelopment') {
  var creds = yaml.load('creds.yaml');
  set('IMGUR_API_KEY', creds['imgurApiKey']);
  set('RECAPTCHA_PUBLIC_KEY', creds['recaptchaPublicKey']);
  set('RECAPTCHA_PRIVATE_KEY', creds['recaptchaPrivateKey']);
  set('FIREBASE_CERT', creds['firebaseCert']);
  set('FIREBASE_STORE', creds['firebaseStore']);
  set('MANDRILL_APIKEY', creds['mandrillApiKey']);
  set('MANDRILL_USERNAME', creds['mandrillUsername']);
  set('ADMIN_EMAIL', creds['adminEmail']);
  set('NEW_RELIC_LICENSE_KEY', creds['newRelicLicenseKey']);
  set('AWS_SECRET', creds['awsSecret']);
  set('AWS_ID', creds['awsId']);
  set('COOKIE_SECRET', creds['cookieSecret']);
  set('SLACK_WEBHOOK', creds['slackWebhook']);
  set('BALLOT_LOOKUP_TOKEN', creds['ballotLookupToken'])
}
