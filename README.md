Gender Avenger Tally
===========

This application is a tool that makes it easy to create and share visual commentary on observed gender diversity in any setting.  Users submit information through a form which is then used to generate a visualization.  That visualization can then be shared through email or social media.

To learn more about how to contribute please check out [CONTRIBUTING.md](CONTRIBUTING.md).

Data is stored using [Google Firebase's Cloud Firestore](https://firebase.google.com/docs/firestore).

## DISCLAIMER

***This repository is currently in transition from JavaScript to TypeScript.***

This means that, for now, it might not behave the way you expect.  Any `.js` files and any documentation that is not in the `docs` directory is obsolete and only exists because it has not been converted yet to reflect the new code base.

## Development

To set up the development environment you will need [yarn](https://yarnpkg.com/).

```
yarn install
```

You can run tests by running:

```
yarn test
```

You can start the service locally by running:

```
yarn dev
```

If you want to run in a production environment you should build it and serve from the compiled files with your server of choice:

```
yarn build
```

You will also need to follow instructions to set up the [firebase emulator suite](https://firebase.google.com/docs/emulator-suite/install_and_configure).  This project uses Cloud Firestore, Cloud Functions, and Firebase Hosting.  Once that is done, populate your environment variables:

```
cp .env.template .env
edit .env
```

## Publishing

To publish manually you will need the [Firebase CLI](https://firebase.google.com/docs/cli) installed.

You can then run `firebase login` to authenticate.

Youc an then run `firebase deploy` to publish.
