
export const decodeAudioData = async (
  base64String: string,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  // Ensure even length for Int16, although PCM should be aligned.
  const safeLen = len - (len % 2);

  const bytes = new Uint8Array(safeLen);
  for (let i = 0; i < safeLen; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Gemini returns raw PCM 24kHz mono (usually)
  // We need to convert raw bytes to AudioBuffer
  // Assuming 16-bit PCM, little-endian
  const int16Data = new Int16Array(bytes.buffer);
  const float32Data = new Float32Array(int16Data.length);
  
  for (let i = 0; i < int16Data.length; i++) {
    float32Data[i] = int16Data[i] / 32768.0;
  }

  const buffer = audioContext.createBuffer(1, float32Data.length, 24000);
  buffer.getChannelData(0).set(float32Data);
  
  return buffer;
};
