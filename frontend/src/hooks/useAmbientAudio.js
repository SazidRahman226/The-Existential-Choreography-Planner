import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * useAmbientAudio — Manages ambient audio playback for session modes.
 *
 * Uses HTML5 Audio elements with looping. Supports play, stop,
 * volume control, and crossfading between tracks.
 */

const AUDIO_TRACKS = {
    lofi: '/audio/lofi.mp3',
    upbeat: '/audio/upbeat.mp3',
    nature: '/audio/nature.mp3',
    clock: '/audio/clock.mp3',
    cafe: '/audio/cafe.mp3'
}

export default function useAmbientAudio() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolumeState] = useState(0.5)
    const [currentTrack, setCurrentTrack] = useState(null)

    const audioRef = useRef(null)
    const fadeIntervalRef = useRef(null)

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
            if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current)
            }
        }
    }, [])

    // Fade out current audio, then start new track
    const crossfadeTo = useCallback((newTrackKey) => {
        const src = AUDIO_TRACKS[newTrackKey]
        if (!src) return

        const startNewTrack = () => {
            const audio = new Audio(src)
            audio.loop = true
            audio.volume = 0
            audioRef.current = audio

            audio.play().then(() => {
                setIsPlaying(true)
                setCurrentTrack(newTrackKey)

                // Fade in
                let vol = 0
                const targetVol = volume
                fadeIntervalRef.current = setInterval(() => {
                    vol = Math.min(vol + 0.05, targetVol)
                    if (audioRef.current) audioRef.current.volume = vol
                    if (vol >= targetVol) {
                        clearInterval(fadeIntervalRef.current)
                    }
                }, 50)
            }).catch(err => {
                console.warn('Audio playback failed (user interaction required):', err.message)
                setIsPlaying(false)
            })
        }

        // If currently playing, fade out first
        if (audioRef.current && isPlaying) {
            let vol = audioRef.current.volume
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)

            fadeIntervalRef.current = setInterval(() => {
                vol = Math.max(vol - 0.05, 0)
                if (audioRef.current) audioRef.current.volume = vol
                if (vol <= 0) {
                    clearInterval(fadeIntervalRef.current)
                    audioRef.current.pause()
                    audioRef.current = null
                    startNewTrack()
                }
            }, 30)
        } else {
            startNewTrack()
        }
    }, [isPlaying, volume])

    const play = useCallback((modeAudioKey) => {
        if (!modeAudioKey || !AUDIO_TRACKS[modeAudioKey]) return

        if (currentTrack === modeAudioKey && isPlaying) return // Already playing this track

        crossfadeTo(modeAudioKey)
    }, [currentTrack, isPlaying, crossfadeTo])

    const stop = useCallback(() => {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)

        if (audioRef.current) {
            // Fade out
            let vol = audioRef.current.volume
            fadeIntervalRef.current = setInterval(() => {
                vol = Math.max(vol - 0.05, 0)
                if (audioRef.current) audioRef.current.volume = vol
                if (vol <= 0) {
                    clearInterval(fadeIntervalRef.current)
                    if (audioRef.current) {
                        audioRef.current.pause()
                        audioRef.current = null
                    }
                    setIsPlaying(false)
                    setCurrentTrack(null)
                }
            }, 30)
        } else {
            setIsPlaying(false)
            setCurrentTrack(null)
        }
    }, [])

    const setVolume = useCallback((newVol) => {
        const clamped = Math.max(0, Math.min(1, newVol))
        setVolumeState(clamped)
        if (audioRef.current) {
            audioRef.current.volume = clamped
        }
    }, [])

    const toggleMute = useCallback(() => {
        if (audioRef.current) {
            if (audioRef.current.volume > 0) {
                audioRef.current.volume = 0
            } else {
                audioRef.current.volume = volume
            }
        }
    }, [volume])

    return {
        play,
        stop,
        setVolume,
        toggleMute,
        isPlaying,
        volume,
        currentTrack
    }
}
