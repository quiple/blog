import {milliseconds, type Song, type SourceKey} from './model.ts'

export function sourceOffset(song: Song, key: SourceKey) {
  return milliseconds(song.offsets?.[key] ?? 0)
}

export function canPlayTime(song: Song, key: SourceKey, lyricTime: number, duration = 0) {
  return duration <= 0 || lyricTime + sourceOffset(song, key) < duration
}

export function switchPosition(song: Song, target: SourceKey, lyricTime: number, duration = 0) {
  const restarted = !canPlayTime(song, target, lyricTime, duration)
  return {position: Math.max(0, (restarted ? 0 : lyricTime) + sourceOffset(song, target)), restarted}
}
