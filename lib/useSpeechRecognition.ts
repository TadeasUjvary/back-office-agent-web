"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/* Minimal types — Web Speech API isn't in standard TS lib.dom defs. */
type SpeechRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResult };
};
type SpeechRecognitionErrorEvent = { error: string };
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition({
  lang = "cs-CZ",
  onFinal,
  onInterim,
}: {
  lang?: string;
  onFinal?: (text: string) => void;
  onInterim?: (text: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalRef = useRef("");

  // Stable callback refs so we don't recreate the recognizer
  const onFinalRef = useRef(onFinal);
  const onInterimRef = useRef(onInterim);
  useEffect(() => { onFinalRef.current = onFinal; }, [onFinal]);
  useEffect(() => { onInterimRef.current = onInterim; }, [onInterim]);

  useEffect(() => {
    setSupported(getCtor() !== null);
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("Prohlížeč nepodporuje rozpoznávání řeči (zkuste Chrome).");
      return;
    }
    // Already running → toggle off
    if (recRef.current) {
      recRef.current.stop();
      return;
    }
    setError(null);
    finalRef.current = "";
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => setListening(true);
    rec.onerror = (e) => {
      if (e.error !== "aborted" && e.error !== "no-speech") {
        setError(
          e.error === "not-allowed"
            ? "Přístup k mikrofonu zamítnut."
            : `Chyba mikrofonu: ${e.error}`,
        );
      }
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const txt = r[0].transcript;
        if (r.isFinal) {
          finalRef.current += txt;
          onFinalRef.current?.(finalRef.current.trim());
        } else {
          interim += txt;
        }
      }
      if (interim) onInterimRef.current?.((finalRef.current + interim).trim());
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      // start() can throw if called twice quickly — ignore
    }
  }, [lang]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recRef.current?.abort();
    };
  }, []);

  return { supported, listening, error, start, stop };
}
