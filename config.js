var yaml = require('yamljs');

function set(name, value) {
  if (!(name in process.env)) {
    process.env[name] = value;
  }
}

set('NODE_ENV', 'localDevelopment');
if (process.env.NODE_ENV == 'localDevelopment') {
  var creds = yaml.load('creds.yaml');
  set('IMGUR_API_KEY', creds['imgurApiKey'])
}