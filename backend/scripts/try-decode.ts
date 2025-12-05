import { OpenLocationCode } from '../src/dpi/grid-encoding';

const invalidCode = "LLL-LLL-LLLL";
const validCode = "87G8H7P3+2X"; // Known valid code from tests

console.log(`Attempting to decode: ${invalidCode}`);
try {
  const result = OpenLocationCode.decode(invalidCode);
  console.log("Result:", result);
} catch (error) {
  console.error("Error decoding invalid code:", error);
}

console.log(`\nAttempting to decode valid code: ${validCode}`);
try {
  const result = OpenLocationCode.decode(validCode);
  console.log("Result:", result);
} catch (error) {
  console.error("Error decoding valid code:", error);
}
