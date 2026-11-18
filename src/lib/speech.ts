/** Pronounce English vocabulary using an installed browser/system voice. */
export function speakEnglish(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  const voice = voices.find((item) => item.lang === "en-US")
    ?? voices.find((item) => item.lang.startsWith("en"));
  const spokenText = text.replace(/\bsb\b/g, "somebody").replace(/\bsth\b/g, "something").replace(/\//g, " or ");
  const utterance = new SpeechSynthesisUtterance(spokenText);
  utterance.lang = voice?.lang ?? "en-US";
  utterance.rate = 0.85;
  if (voice) utterance.voice = voice;
  synth.cancel();
  synth.speak(utterance);
  return true;
}
