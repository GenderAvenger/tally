import { writable } from 'svelte/store';

export const womenCount = writable(20);
export const womenOfColorCount = writable(15);
export const menCount = writable(2);
export const menOfColorCount = writable(1);
export const nonbinaryPeopleCount = writable(2);
export const nonbinaryPeopleOfColorCount = writable(1);
export const sessionText = writable('A session');
export const hashtag = writable('Hashtag');
