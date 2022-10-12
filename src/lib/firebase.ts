// NOTE: If you edit this file while in `dev` mode it will cause the application to
// break.  This is because of the way hot loading works in combination with firebase
// and the only solution I'm aware of right now is to manually restart.
//
// See https://github.com/jthegedus/svelte-adapter-firebase/issues/189
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

export const getCollection = (collectionName: string) => {
	return db.collection(collectionName);
};
