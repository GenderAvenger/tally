import { writable } from 'svelte/store';

export const whiteWomenCount = writable(0);
export const womenOfColorCount = writable(0);
export const whiteMenCount = writable(0);
export const menOfColorCount = writable(0);
export const whiteNonbinaryPeopleCount = writable(0);
export const nonbinaryPeopleOfColorCount = writable(0);
export const sessionText = writable('');
export const sessionDate = writable(new Date().toJSON().slice(0, 10));
export const sessionLocation = writable('');
export const chartPurpose = writable('none');
