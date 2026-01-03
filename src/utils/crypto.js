// Helpers to convert between base64 and ArrayBuffer (browser-compatible)
function bufToBase64(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, sub);
  }
  return btoa(binary);
}

function base64ToBuf(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function generateSymmetricKeyBase64() {
  // Use browser crypto for randomness
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return bufToBase64(arr);
}

export async function encryptWithSymKey(symKeyBase64, plaintext) {
  const keyBuf = base64ToBuf(symKeyBase64);
  const key = await crypto.subtle.importKey("raw", keyBuf, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  return {
    ciphertext: bufToBase64(new Uint8Array(cipher)),
    iv: bufToBase64(iv)
  };
}

export async function decryptWithSymKey(symKeyBase64, ciphertextBase64, ivBase64) {
  const keyBuf = base64ToBuf(symKeyBase64);
  const key = await crypto.subtle.importKey("raw", keyBuf, { name: "AES-GCM" }, false, ["decrypt"]);
  const iv = base64ToBuf(ivBase64);
  const cipherBuf = base64ToBuf(ciphertextBase64);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBuf);
  return new TextDecoder().decode(plainBuf);
}

export async function encryptSymKeyWithPublicKey(pubKeyBase64, symKeyBase64) {
  // Dynamically import eth-sig-util in browser at runtime to avoid bundler issues
  const module = await import("@metamask/eth-sig-util");
  const enc = module.encrypt({ publicKey: pubKeyBase64, data: symKeyBase64, version: "x25519-xsalsa20-poly1305" });
  // store as JSON string so contract can store bytes
  return JSON.stringify(enc);
}

export async function decryptSymKeyWithWallet(encryptedSymKeyJson, account) {
  // Use MetaMask eth_decrypt - must be triggered by the recipient wallet
  if (!window.ethereum) throw new Error("No wallet available");
  const decrypted = await window.ethereum.request({
    method: "eth_decrypt",
    params: [encryptedSymKeyJson, account]
  });
  return decrypted; // base64 symmetric key
}

// Simple IPFS stub: in production replace with web3.storage or pinata
export async function uploadToIPFSStub(data) {
  // returns a fake CID-like string so that frontend flow can be tested without external API keys
  const arr = new TextEncoder().encode(data);
  const hex = Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  const fakeCid = `bafy${hex.slice(0, 20)}`;
  return fakeCid;
}
