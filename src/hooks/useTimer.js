import { useState, useEffect, useRef, useCallback } from "react";

export default function useTimer() {
    const [duration, setDuration] = useState(90);
    const [remaining, setRemaining] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isActive, setIsActive] = useState(false); // whether timer bar is shown
    const [label, setLabel] = useState(""); // e.g. "Panca Piana — Set 2"
    const intervalRef = useRef(null);

    const playSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const playTone = (freq, t, dur) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g);
                g.connect(ctx.destination);
                o.frequency.value = freq;
                o.type = "sine";
                g.gain.setValueAtTime(0.25, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + dur);
                o.start(t);
                o.stop(t + dur);
            };
            const t = ctx.currentTime;
            playTone(880, t, 0.12);
            playTone(1100, t + 0.13, 0.12);
            playTone(1320, t + 0.26, 0.22);
        } catch { }
    }, []);

    const vibrate = useCallback(() => {
        try {
            navigator.vibrate?.([150, 80, 250]);
        } catch { }
    }, []);

    useEffect(() => {
        if (isRunning && remaining > 0) {
            intervalRef.current = setInterval(() => {
                setRemaining((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        setIsFinished(true);
                        playSound();
                        vibrate();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning, remaining, playSound, vibrate]);

    // Start with a preset and optional label (e.g. exercise + set info)
    const start = useCallback((seconds, timerLabel = "") => {
        clearInterval(intervalRef.current);
        setDuration(seconds);
        setRemaining(seconds);
        setIsRunning(true);
        setIsFinished(false);
        setIsActive(true);
        setLabel(timerLabel);
    }, []);

    const pause = useCallback(() => setIsRunning(false), []);
    const resume = useCallback(() => {
        if (remaining > 0) {
            setIsRunning(true);
            setIsFinished(false);
        }
    }, [remaining]);

    const reset = useCallback(() => {
        setRemaining(duration);
        setIsRunning(true);
        setIsFinished(false);
    }, [duration]);

    const dismiss = useCallback(() => {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        setRemaining(0);
        setIsFinished(false);
        setIsActive(false);
        setLabel("");
    }, []);

    const adjust = useCallback((secs) => {
        setRemaining((prev) => {
            const newRemaining = Math.max(0, prev + secs);
            if (newRemaining === 0) {
                setIsRunning(false);
                setIsFinished(true);
            } else {
                setIsFinished(false);
            }
            return newRemaining;
        });
        setDuration((prev) => Math.max(0, prev + secs));
    }, []);

    const progress = duration > 0 ? (duration - remaining) / duration : 1;

    const formatTime = useCallback((s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    }, []);

    return {
        duration,
        remaining,
        isRunning,
        isFinished,
        isActive,
        label,
        progress,
        start,
        pause,
        resume,
        reset,
        dismiss,
        adjust,
        formatTime,
    };
}
