import { useState, useEffect, useRef, useCallback } from "react";

export default function useTimer() {
    const [duration, setDuration] = useState(90);
    const [remaining, setRemaining] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isActive, setIsActive] = useState(false); // whether timer bar is shown
    const [label, setLabel] = useState(""); // e.g. "Panca Piana — Set 2"

    const intervalRef = useRef(null);
    const endTimeRef = useRef(null); // Timestamp of when the timer should end

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

    const triggerCompletion = useCallback(() => {
        setIsRunning(false);
        setIsFinished(true);
        setRemaining(0);
        endTimeRef.current = null;
        playSound();
        vibrate();
    }, [playSound, vibrate]);

    // Timer tick logic based on timestamp
    useEffect(() => {
        if (!isRunning || !endTimeRef.current) return;

        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const timeDiff = endTimeRef.current - now;

            if (timeDiff <= 0) {
                clearInterval(intervalRef.current);
                triggerCompletion();
            } else {
                setRemaining(Math.ceil(timeDiff / 1000));
            }
        }, 200); // Check frequently to be accurate

        return () => clearInterval(intervalRef.current);
    }, [isRunning, triggerCompletion]);

    // On mount or coming back to tab, check if timer finished
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isRunning && endTimeRef.current) {
                const now = Date.now();
                if (now >= endTimeRef.current) {
                    triggerCompletion();
                } else {
                    setRemaining(Math.ceil((endTimeRef.current - now) / 1000));
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isRunning, triggerCompletion]);

    const start = useCallback((seconds, timerLabel = "") => {
        clearInterval(intervalRef.current);
        setDuration(seconds);
        setRemaining(seconds);
        setIsRunning(true);
        setIsFinished(false);
        setIsActive(true);
        setLabel(timerLabel);
        endTimeRef.current = Date.now() + seconds * 1000;
    }, []);

    const pause = useCallback(() => {
        setIsRunning(false);
        endTimeRef.current = null; // Stored in 'remaining'
    }, []);

    const resume = useCallback(() => {
        if (remaining > 0) {
            setIsRunning(true);
            setIsFinished(false);
            endTimeRef.current = Date.now() + remaining * 1000;
        }
    }, [remaining]);

    const reset = useCallback(() => {
        setRemaining(duration);
        setIsRunning(true);
        setIsFinished(false);
        endTimeRef.current = Date.now() + duration * 1000;
    }, [duration]);

    const dismiss = useCallback(() => {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        setRemaining(0);
        setIsFinished(false);
        setIsActive(false);
        setLabel("");
        endTimeRef.current = null;
    }, []);

    const adjust = useCallback((secs) => {
        setRemaining((prev) => {
            const newRemaining = Math.max(0, prev + secs);
            if (newRemaining === 0) {
                setIsRunning(false);
                setIsFinished(true);
                endTimeRef.current = null;
                // Don't auto-dismiss, but trigger end if you subtract past 0
            } else {
                setIsFinished(false);
                setIsRunning(true);
                endTimeRef.current = Date.now() + newRemaining * 1000;
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
