/* This file is checked in because we may decide to use anonymous auth instead of admin SDK */

// NOTE: If you edit this file while in `dev` mode it will cause the application to
// break.  This is because of the way hot loading works in combination with firebase
// and the only solution I'm aware of right now is to manually restart.
//
// See https://github.com/jthegedus/svelte-adapter-firebase/issues/189
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, connectFirestoreEmulator } from 'firebase/firestore';
import { env } from '$env/dynamic/private';

const firebaseConfig = {
	apiKey: 'AIzaSyB3_sh7-_w_QniKnBz-0FwTyxeJS2isyyY',
	authDomain: 'speaker-equity-assessor.firebaseapp.com',
	projectId: 'speaker-equity-assessor',
	storageBucket: 'speaker-equity-assessor.appspot.com',
	messagingSenderId: '767819808245',
	appId: '1:767819808245:web:c86977193faca1034774bc',
	measurementId: 'G-FQL73BD49R'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
if (env.FIRESTORE_EMULATOR_HOST !== undefined && env.FIRESTORE_EMULATOR_PORT !== undefined) {
	console.log('Using Firestore Emulator');
	connectFirestoreEmulator(
		db,
		env.FIRESTORE_EMULATOR_HOST,
		Number.parseInt(env.FIRESTORE_EMULATOR_PORT, 10)
	);
}

export const getCollection = (collectionName: string) => {
	return collection(db, collectionName);
};
