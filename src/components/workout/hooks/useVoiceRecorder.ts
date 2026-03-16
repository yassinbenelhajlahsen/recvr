import { useState, useRef, useCallback, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetch";
import type { VoiceTranscribeResponse } from "@/types/voice";

export type VoiceState = "idle" | "requesting" | "recording" | "processing" | "done" | "error";

const MAX_DURATION = 120; // seconds
const BAR_COUNT = 20;

// SpeechRecognition browser type shim
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } };
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function useVoiceRecorder() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceTranscribeResponse | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(BAR_COUNT).fill(0));
  const [liveTranscript, setLiveTranscript] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const blobResolveRef = useRef<((blob: Blob) => void) | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTextRef = useRef("");

  const stopAnalyser = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevels(Array(BAR_COUNT).fill(0));
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    finalTextRef.current = "";
  }, []);

  const cleanup = useCallback(() => {
    stopAnalyser();
    stopRecognition();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, [stopAnalyser, stopRecognition]);

  useEffect(() => cleanup, [cleanup]);

  const startRecording = useCallback(async () => {
    setVoiceState("requesting");
    setError(null);
    setTranscript(null);
    setResult(null);
    setElapsed(0);
    setLiveTranscript("");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setVoiceState("error");
      setError("Microphone access denied");
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    finalTextRef.current = "";

    // Web Audio analyser for bar visualization
    try {
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const step = Math.floor(dataArray.length / BAR_COUNT);
        const levels = Array.from({ length: BAR_COUNT }, (_, i) => {
          const val = dataArray[Math.max(1, i * step)] / 255;
          return Math.max(val, 0.04);
        });
        setAudioLevels(levels);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // AudioContext unavailable — visualization degrades gracefully
    }

    // SpeechRecognition for live transcript preview
    const SR = getSpeechRecognition();
    if (SR) {
      try {
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (e: SpeechRecognitionEvent) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
              finalTextRef.current += t + " ";
            } else {
              interim = t;
            }
          }
          setLiveTranscript((finalTextRef.current + interim).trimStart());
        };

        recognition.onerror = () => {/* ignore — live transcript is best-effort */};

        // Auto-restart on end so continuous mode survives browser cuts
        recognition.onend = () => {
          if (recognitionRef.current === recognition) {
            try { recognition.start(); } catch { /* already stopped */ }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        // SpeechRecognition failed to start — continue without live transcript
      }
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (blobResolveRef.current) {
        blobResolveRef.current(blob);
        blobResolveRef.current = null;
      }
    };

    recorder.start(250);
    setVoiceState("recording");

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= MAX_DURATION) {
          recorder.stop();
          if (timerRef.current) clearInterval(timerRef.current);
          return MAX_DURATION;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    stopAnalyser();
    stopRecognition();
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(new Blob());
        return;
      }

      blobResolveRef.current = resolve;
      recorder.stop();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    });
  }, [stopAnalyser, stopRecognition]);

  const processAudio = useCallback(async (blob: Blob) => {
    setVoiceState("processing");

    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");

    try {
      const res = await fetchWithAuth("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Transcription failed (${res.status})`);
      }

      const data: VoiceTranscribeResponse = await res.json();
      setTranscript(data.transcript);
      setResult(data);
      setVoiceState("done");
      return data;
    } catch (err) {
      setVoiceState("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
      return null;
    }
  }, []);

  const reparse = useCallback(async (text: string) => {
    setVoiceState("processing");
    setError(null);

    try {
      const res = await fetchWithAuth("/api/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Parse failed (${res.status})`);
      }

      const data: VoiceTranscribeResponse = await res.json();
      setTranscript(data.transcript);
      setResult(data);
      setVoiceState("done");
      return data;
    } catch (err) {
      setVoiceState("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setVoiceState("idle");
    setError(null);
    setElapsed(0);
    setLiveTranscript("");
    setTranscript(null);
    setResult(null);
  }, [cleanup]);

  return {
    voiceState,
    error,
    elapsed,
    audioLevels,
    liveTranscript,
    transcript,
    result,
    startRecording,
    stopRecording,
    processAudio,
    reparse,
    reset,
  };
}
