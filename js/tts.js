const EPS_SPEECH_RATE = 0.72;

window.EPSTTS = (() => {
  let voices = [];

  function refreshVoices() {
    if (!('speechSynthesis' in window)) {
      return [];
    }

    voices = window.speechSynthesis
      .getVoices()
      .filter(voice =>
        String(voice.lang || '')
          .toLowerCase()
          .startsWith('ko')
      );

    return voices;
  }

  function getVoice(speaker) {
    refreshVoices();

    if (!voices.length) {
      return null;
    }

    const femaleNames = [
      'sunhi',
      'sun hi',
      '선히',
      'heami',
      'female',
      'woman'
    ];

    const maleNames = [
      'injoon',
      'in joon',
      '인준',
      'male',
      'man'
    ];

    const findByNames = names =>
      voices.find(voice => {
        const name =
          String(voice.name || '').toLowerCase();

        return names.some(item =>
          name.includes(item.toLowerCase())
        );
      });

    const femaleVoice =
      findByNames(femaleNames) ||
      voices[0] ||
      null;

    let maleVoice =
      findByNames(maleNames) ||
      null;

    // If no named male voice exists, prefer a different Korean voice.
    if (!maleVoice && femaleVoice) {
      maleVoice =
        voices.find(voice =>
          voice.voiceURI !== femaleVoice.voiceURI &&
          voice.name !== femaleVoice.name
        ) ||
        null;
    }

    if (speaker === 'female') {
      return femaleVoice;
    }

    if (speaker === 'male') {
      return maleVoice || femaleVoice;
    }

    return femaleVoice;
  }

  function utter(
    text,
    {
      speaker = null
    } = {}
  ) {
    const u =
      new SpeechSynthesisUtterance(text);

    u.lang = 'ko-KR';
    u.volume = 1;

    const voice = getVoice(speaker);

    if (voice) {
      u.voice = voice;
    }

    // Keep the two speakers distinguishable even when the device exposes
    // only one Korean voice. JSON rates remain backwards-compatible but
    // cannot override the global practice-test speed.
    if (speaker === 'female') {
      u.rate = EPS_SPEECH_RATE;
      u.pitch = 1.15;
    } else if (speaker === 'male') {
      u.rate = Math.max(0.6, EPS_SPEECH_RATE - 0.03);
      u.pitch = 0.78;
    } else {
      u.rate = EPS_SPEECH_RATE;
      u.pitch = 1;
    }

    return u;
  }

  function cancel() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  function logVoices() {
    refreshVoices();

    console.table(
      voices.map((voice, index) => ({
        index,
        name: voice.name,
        lang: voice.lang,
        voiceURI: voice.voiceURI,
        localService: voice.localService
      }))
    );
  }

  function sequence(
    items,
    {
      rate = 0.86,
      pauseMs = 400,
      onEnd,
      onError
    } = {}
  ) {
    if (!('speechSynthesis' in window)) {
      onError?.();
      return;
    }

    cancel();

    let index = 0;

    function next() {
      if (index >= items.length) {
        onEnd?.();
        return;
      }

      const item = items[index];

      const u = utter(item.text, {
        rate: item.rate ?? rate,
        speaker: item.speaker ?? null
      });

      u.onerror = () => {
        onError?.();
      };

      u.onend = () => {
        index++;

        if (index < items.length) {
          setTimeout(
            next,
            item.pauseMs ?? pauseMs
          );
        } else {
          onEnd?.();
        }
      };

      window.speechSynthesis.speak(u);
    }

    next();
  }

  function speak(audio, callbacks = {}) {
    if (!audio) return;

    const opts = {
      rate: audio.rate ?? 0.86,
      pauseMs: audio.pauseMs ?? 400,
      ...callbacks
    };

    // Q33 / Q38 / Q39 / Q40
    if (audio.mode === 'dialogue') {
      return sequence(
        audio.dialogue || [],
        opts
      );
    }

    // Other segmented audio
    if (audio.mode === 'segments') {
      return sequence(
        audio.segments || [],
        opts
      );
    }

    // Q28-Q32:
    // Main Play button speaks ONLY question.
    if (audio.mode === 'question_and_options') {
      return sequence(
        [{
          text: audio.text || ''
        }],
        opts
      );
    }

    return sequence(
      [{
        text: audio.text || ''
      }],
      opts
    );
  }

  // Q28-Q32 option audio
  function speakOption(
    text,
    {
      rate = 0.86,
      onEnd,
      onError
    } = {}
  ) {
    if (!text) return;

    sequence(
      [{
        text
      }],
      {
        rate,
        pauseMs: 0,
        onEnd,
        onError
      }
    );
  }

  if ('speechSynthesis' in window) {
    refreshVoices();

    window.speechSynthesis.onvoiceschanged =
      refreshVoices;

    setTimeout(refreshVoices, 250);
  }

  return {
    refreshVoices,
    logVoices,
    speak,
    speakOption,
    cancel
  };
})();
