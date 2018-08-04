## Prerequisites
This code base is written in Node.JS and is designed to be deployable via Heroku.

It requires imagemagick in order to generate visualizations.

## Setting up (dev)

1. Make sure baseline project prerequisites are installed (Node.js, Git)

2. Install Imagemagick (homebrew, apt, or from binaries)

3. Clone the repository

4. Create and populate the credentials file: `cp creds.yaml.template creds.yaml`

5. Install npm dependencies `npm install`

## Starting the server

`npm start`
