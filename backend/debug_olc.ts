import OpenLocationCodeLib from 'open-location-code';
const OLC = OpenLocationCodeLib.OpenLocationCode;
console.log('OLC:', OLC);
console.log('OLC keys:', Object.keys(OLC));
try {
    console.log('OLC prototype keys:', Object.getOwnPropertyNames(OLC.prototype));
} catch (e) {
    console.log('No prototype');
}
const instance = new OLC();
console.log('Instance keys:', Object.keys(instance));
console.log('Instance prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
