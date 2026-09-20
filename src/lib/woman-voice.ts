const WANT = /female|woman|samantha|moira|victoria|karen|tessa|zira|fiona|serena|siri|jenny|aria|natasha/i;
const SKIP = /male|david|daniel|alex|fred|google uk english male/i;

export function pickWomanVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  const en = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
  return (
    en.find(v => WANT.test(v.name))
    || voices.find(v => WANT.test(v.name))
    || en.find(v => !SKIP.test(v.name))
    || en[0]
  );
}

export function speakAsWoman(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text.slice(0, 500));
  u.rate = 1.02;
  u.pitch = 1.08;
  const voice = pickWomanVoice();
  if (voice) u.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
