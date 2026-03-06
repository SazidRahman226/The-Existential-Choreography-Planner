import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * useAmbientAudio — Manages ambient audio playback via YouTube IFrame API.
 *
 * Plays audio from a YouTube playlist URL. Supports play, stop, and volume control.
 * Falls back silently if YouTube API fails or no URL is provided.
 */

let ytApiLoaded = false
let ytApiLoadPromise = null

function loadYouTubeAPI() {
    if (ytApiLoaded) return Promise.resolve()
    if (ytApiLoadPromise) return ytApiLoadPromise

    ytApiLoadPromise = new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
            ytApiLoaded = true
            resolve()
            return
        }

        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)

        window.onYouTubeIframeAPIReady = () => {
            ytApiLoaded = true
            resolve()
        }
    })

    return ytApiLoadPromise
}

function extractPlaylistId(url) {
    if (!url) return null
    try {
        const parsed = new URL(url)
        return parsed.searchParams.get('list') || null
    } catch {
        // Try to extract from non-standard formats
        const match = url.match(/[?&]list=([^&]+)/)
        return match ? match[1] : null
    }
}

function extractVideoId(url) {
    if (!url) return null
    try {
        const parsed = new URL(url)
        if (parsed.hostname.includes('youtu.be')) {
            return parsed.pathname.slice(1)
        }
        return parsed.searchParams.get('v') || null
    } catch {
        return null
    }
}

export default function useAmbientAudio() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolumeState] = useState(50)
    const [currentUrl, setCurrentUrl] = useState(null)

    const playerRef = useRef(null)
    const containerRef = useRef(null)

    // Create hidden container for YouTube player
    useEffect(() => {
        if (!containerRef.current) {
            const div = document.createElement('div')
            div.id = 'yt-audio-player'
            div.style.position = 'fixed'
            div.style.top = '-9999px'
            div.style.left = '-9999px'
            div.style.width = '1px'
            div.style.height = '1px'
            div.style.opacity = '0'
            div.style.pointerEvents = 'none'
            document.body.appendChild(div)
            containerRef.current = div
        }

        return () => {
            if (playerRef.current) {
                try { playerRef.current.destroy() } catch (e) { /* ignore */ }
                playerRef.current = null
            }
            if (containerRef.current) {
                containerRef.current.remove()
                containerRef.current = null
            }
        }
    }, [])

    const play = useCallback(async (youtubeUrl) => {
        if (!youtubeUrl) return
        if (currentUrl === youtubeUrl && isPlaying) return

        try {
            await loadYouTubeAPI()
        } catch {
            console.warn('YouTube API failed to load')
            return
        }

        // Destroy old player
        if (playerRef.current) {
            try { playerRef.current.destroy() } catch (e) { /* ignore */ }
            playerRef.current = null
        }

        // Ensure container exists
        if (!containerRef.current) return

        // Reset container
        containerRef.current.innerHTML = ''
        const playerDiv = document.createElement('div')
        playerDiv.id = 'yt-audio-inner'
        containerRef.current.appendChild(playerDiv)

        const playlistId = extractPlaylistId(youtubeUrl)
        const videoId = extractVideoId(youtubeUrl)

        const playerVars = {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0
        }

        if (playlistId) {
            playerVars.listType = 'playlist'
            playerVars.list = playlistId
            playerVars.loop = 1
        }

        playerRef.current = new window.YT.Player('yt-audio-inner', {
            height: '1',
            width: '1',
            videoId: playlistId ? undefined : (videoId || undefined),
            playerVars,
            events: {
                onReady: (event) => {
                    event.target.setVolume(volume)
                    event.target.playVideo()
                    setIsPlaying(true)
                    setCurrentUrl(youtubeUrl)
                },
                onStateChange: (event) => {
                    // Loop single video if no playlist
                    if (!playlistId && event.data === window.YT.PlayerState.ENDED) {
                        event.target.seekTo(0)
                        event.target.playVideo()
                    }
                },
                onError: () => {
                    console.warn('YouTube player error — falling back to silence')
                    setIsPlaying(false)
                }
            }
        })
    }, [currentUrl, isPlaying, volume])

    const stop = useCallback(() => {
        if (playerRef.current) {
            try {
                playerRef.current.stopVideo()
                playerRef.current.destroy()
            } catch (e) { /* ignore */ }
            playerRef.current = null
        }
        setIsPlaying(false)
        setCurrentUrl(null)
    }, [])

    const setVolume = useCallback((newVol) => {
        const clamped = Math.max(0, Math.min(100, Math.round(newVol)))
        setVolumeState(clamped)
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(clamped)
        }
    }, [])

    return {
        play,
        stop,
        setVolume,
        isPlaying,
        volume,
        currentUrl
    }
}
