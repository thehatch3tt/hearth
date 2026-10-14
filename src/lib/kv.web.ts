/** On the web (for checking screens in a browser), the browser's own storage. */
export const getItem = (key: string) => window.localStorage.getItem(key);
export const setItem = (key: string, value: string) => window.localStorage.setItem(key, value);
