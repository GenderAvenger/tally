var yaml = require('yamljs');

function set(name, value) {
  if (!(name in process.env)) {
    process.env[name] = value;
  }
}

var creds = yaml.load('creds.yaml');
set('IMGUR_API_KEY', creds['imgurApiKey'])