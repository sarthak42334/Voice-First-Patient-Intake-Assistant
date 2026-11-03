import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Play, RefreshCw, Volume2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { transcribeAudio } from '../api/client';

interface AudioCaptureProps {
  patientDisplayId: string;
  setPatientDisplayId: (id: string) => void;
  onTranscriptionComplete: (transcript: string, language: string, isDemo: boolean, provider: string) => void;
  forceDemo: boolean;
  onOpenPresets: () => void;
}

export const AudioCapture: React.FC<AudioCaptureProps> = ({
  patientDisplayId,
  setPatientDisplayId,
  onTranscriptionComplete,
  forceDemo,
  onOpenPresets,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [languageCode, setLanguageCode] = useState<string>('hi-IN');
  const [audioFileName, setAudioFileName] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate random non-identifying patient ID if empty
  const handleGenerateId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setPatientDisplayId(`PT-${randomNum}`);
  };

  // Start browser mic recording
  const startRecording = async () => {
    setTranscribeError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Prefer audio/webm or audio/wav
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = ''; // browser default
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        setAudioBlob(fullBlob);
        setAudioUrl(URL.createObjectURL(fullBlob));
        setAudioFileName(`recording_${patientDisplayId || 'intake'}.webm`);
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250); // collect chunks every 250ms
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setTranscribeError(`Microphone access error: ${err.message || 'Please grant microphone permissions in browser.'}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Handle uploaded audio file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTranscribeError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setTranscribeError('File exceeds 25 MB limit. Please upload a shorter audio snippet.');
      return;
    }

    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    setAudioFileName(file.name);
  };

  // Transcribe audio using Sarvam Saaras API (or demo fallback)
  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    setTranscribeError(null);

    try {
      const res = await transcribeAudio(
        audioBlob,
        audioFileName || 'recording.webm',
        languageCode,
        forceDemo
      );
      onTranscriptionComplete(res.transcript, res.language_code || languageCode, res.is_demo, res.provider);
    } catch (err: any) {
      setTranscribeError(err.message || 'Failed to transcribe audio. You can retry or switch to demo mode.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Format seconds as MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 block mb-0.5">
            Step 1 • Intake Initialization
          </span>
          <h2 className="text-lg font-bold text-slate-900">Audio Intake & Non-Identifying ID</h2>
          <p className="text-xs text-slate-500">
            Generate an anonymous patient ID, record dialogue via browser mic or upload audio file.
          </p>
        </div>

        {/* Patient ID block */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <label htmlFor="patient-id" className="text-xs font-semibold text-slate-600">
            Patient ID:
          </label>
          <input
            id="patient-id"
            type="text"
            value={patientDisplayId}
            onChange={(e) => setPatientDisplayId(e.target.value)}
            placeholder="e.g. PT-4102"
            className="w-28 text-xs font-mono font-bold text-teal-700 bg-white border border-slate-300 rounded px-2 py-1 focus:outline-teal-500"
          />
          <button
            onClick={handleGenerateId}
            type="button"
            className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-all"
            title="Generate random non-identifying ID"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Random</span>
          </button>
        </div>
      </div>

      {/* Language & Privacy notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <span className="font-semibold">Expected Speech Language:</span>
          <select
            value={languageCode}
            onChange={(e) => setLanguageCode(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-teal-500 cursor-pointer"
          >
            <option value="hi-IN">Hindi (हिंदी) / Hinglish</option>
            <option value="en-IN">Indian English</option>
            <option value="bn-IN">Bengali (বাংলা)</option>
            <option value="te-IN">Telugu (తెలుగు)</option>
            <option value="ta-IN">Tamil (தமிழ்)</option>
            <option value="mr-IN">Marathi (मराठी)</option>
            <option value="gu-IN">Gujarati (ગુજરાતી)</option>
            <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
            <option value="ml-IN">Malayalam (മലയാളം)</option>
            <option value="pa-IN">Punjabi (ਪੰਜਾਬੀ)</option>
            <option value="od-IN">Odia (ଓଡ଼ିଆ)</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/70 border border-emerald-200/80 rounded-md px-3 py-1.5 self-start md:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Ephemeral Audio:</strong> Source audio is processed in-memory for speech-to-text and is NOT retained on server disk.
          </span>
        </div>
      </div>

      {/* Audio Capture Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {/* Record with Mic */}
        <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50/50">
          <div className="mb-2">
            {isRecording ? (
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-red-500 animate-ping absolute inset-0 opacity-40"></div>
                <button
                  onClick={stopRecording}
                  type="button"
                  className="relative w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-all cursor-pointer"
                  title="Stop Recording"
                >
                  <Square className="w-6 h-6 fill-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={startRecording}
                type="button"
                className="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md hover:bg-teal-700 transition-all cursor-pointer hover:scale-105"
                title="Start Microphone Recording"
              >
                <Mic className="w-7 h-7" />
              </button>
            )}
          </div>

          <div className="font-semibold text-slate-800 text-sm">
            {isRecording ? `Recording... (${formatTime(recordingSeconds)})` : 'Click to Record Voice Intake'}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            {isRecording
              ? 'Speak clearly into the microphone. Press square when finished.'
              : 'Direct browser capture via Sarvam Saaras Indian speech recognition.'}
          </p>

          {isRecording && (
            <div className="flex items-center gap-1 mt-3">
              <span className="w-1.5 h-4 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-6 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-8 bg-teal-700 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-6 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-4 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            </div>
          )}
        </div>

        {/* Upload Audio File OR Load Preset */}
        <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50/50">
          <input
            ref={fileInputRef}
            type="file"
            accept=".wav,.mp3,.m4a,.ogg,.webm,.aac"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-300 transition-all cursor-pointer mb-2"
            title="Upload audio file"
          >
            <Upload className="w-5 h-5" />
          </button>

          <div className="font-semibold text-slate-800 text-sm">Or Upload Audio File</div>
          <p className="text-xs text-slate-500 mt-1">Supports WAV, MP3, M4A, WEBM, OGG (Max 25MB)</p>

          <div className="mt-3 pt-3 border-t border-slate-200/80 w-full flex items-center justify-center gap-2">
            <span className="text-xs text-slate-500">Need instant testing?</span>
            <button
              onClick={onOpenPresets}
              type="button"
              className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Load Synthetic Demo Case</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audio Playback & Transcribe Action */}
      {audioUrl && (
        <div className="mt-4 p-4 rounded-xl bg-teal-50/40 border border-teal-200 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-teal-950 block">Audio Ready: {audioFileName}</span>
              <audio src={audioUrl} controls className="h-8 max-w-xs mt-1" />
            </div>
          </div>

          <button
            onClick={handleTranscribe}
            disabled={isTranscribing}
            type="button"
            className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isTranscribing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Transcribing via Sarvam Saaras...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Transcribe Audio (Sarvam Saaras)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error state */}
      {transcribeError && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{transcribeError}</span>
        </div>
      )}
    </div>
  );
};

