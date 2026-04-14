"use client";

import { useState, useRef, useCallback } from "react";

export function useVoiceNote() {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setBlob(audioBlob);
        setPreviewUrl(URL.createObjectURL(audioBlob));
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setDuration(0);
      setBlob(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      // Permission denied or no microphone
    }
  }, [previewUrl]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
    recorderRef.current?.stop();
    recorderRef.current = null;
  }, []);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setBlob(null);
    setPreviewUrl(null);
    setDuration(0);
  }, [previewUrl]);

  return { recording, duration, blob, previewUrl, startRecording, stopRecording, reset };
}
