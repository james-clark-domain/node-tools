export const note = (...args) => console.error(...args);
export const say = (...args) => console.log(...args);
export const output = (...args) => process.stdout.write(args.join(', ') + "\n");
export const die = (...args) => { console.error('Died:', ...args); process.exit(1) };

