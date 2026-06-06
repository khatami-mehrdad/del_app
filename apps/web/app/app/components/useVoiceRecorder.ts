"use client";

import { useCallback, useRef, useState } from "react";

interface VoiceRecorderState {
  recording: boolean;
  duration: number;
  blob: Blob | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useVoiceRecorder(): VoiceRecorderState {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(0);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const recorded = new Blob(chunks.current, { type: "audio/webm" });
        setBlob(recorded);
        stream.getTracks().forEach((t) => t.stop());
        if (timer.current) clearInterval(timer.current);
      };

      mediaRecorder.current = recorder;
      recorder.start();
      startTime.current = Date.now();
      setRecording(true);
      setBlob(null);
      setDuration(0);

      timer.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime.current) / 1000));
      }, 1000);
    } catch {
      // Permission denied or not supported
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.stop();
    }
    setRecording(false);
  }, []);

  const reset = useCallback(() => {
    setBlob(null);
    setDuration(0);
    setRecording(false);
  }, []);

  return { recording, duration, blob, start, stop, reset };
}
