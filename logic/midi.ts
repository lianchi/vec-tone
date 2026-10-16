import MidiWriter from 'midi-writer-js'

export interface MidiEventLike {
  time: number
  pitch: string
  duration: number
  velocity: number
  track: string
}

/**
 * 将乐曲多轨事件导出为标准多轨 MIDI Base64 编码
 * 包含：旋律轨 (Lead Melody + 琴声呼应)、和弦轨 (Accompaniment + Pad)、贝斯轨 (Bass)
 */
export function exportMidi(events: MidiEventLike[], bpm: number): string {
  const beatSec = 60 / bpm

  const melodyTrack = new MidiWriter.Track()
  melodyTrack.setTempo(bpm)
  melodyTrack.setTimeSignature(4, 4)
  melodyTrack.addTrackName('Lead Melody')

  const chordTrack = new MidiWriter.Track()
  chordTrack.setTempo(bpm)
  chordTrack.addTrackName('Accompaniment')

  const bassTrack = new MidiWriter.Track()
  bassTrack.setTempo(bpm)
  bassTrack.addTrackName('Bass')

  const sortedEvents = [...events].sort((a, b) => a.time - b.time)

  function addEventsToTrack(track: any, evts: MidiEventLike[]) {
    let curTick = 0
    // 将同一时间点（15ms 内）的音符聚合为一个和弦/合音事件，防止串行累加导致时间轴漂移
    const timeGroups: { time: number, events: MidiEventLike[] }[] = []
    evts.forEach((e) => {
      const existing = timeGroups.find(g => Math.abs(g.time - e.time) < 0.015)
      if (existing) {
        existing.events.push(e)
      }
      else {
        timeGroups.push({ time: e.time, events: [e] })
      }
    })

    timeGroups.sort((a, b) => a.time - b.time).forEach((g) => {
      // 128 ticks = 1 拍 (quarter note)，严格按秒数折算为标准 MIDI Ticks
      const startTick = Math.round((g.time / beatSec) * 128)
      const maxDur = Math.max(...g.events.map(e => e.duration))
      const durTick = Math.max(16, Math.round((maxDur / beatSec) * 128))
      const waitTick = Math.max(0, startTick - curTick)
      const pitches = Array.from(new Set(g.events.map(e => e.pitch)))
      const vel = Math.round((g.events[0]?.velocity || 0.8) * 127)

      track.addEvent(new (MidiWriter.NoteEvent as any)({
        pitch: pitches,
        duration: `T${durTick}`,
        wait: waitTick > 0 ? `T${waitTick}` : undefined,
        velocity: vel,
      }))
      curTick = startTick + durTick
    })
  }

  addEventsToTrack(melodyTrack, sortedEvents.filter(e => e.track === 'melody' || e.track === 'counter'))
  addEventsToTrack(chordTrack, sortedEvents.filter(e => e.track === 'chord' || e.track === 'pad'))
  addEventsToTrack(bassTrack, sortedEvents.filter(e => e.track === 'bass'))

  const writer = new MidiWriter.Writer([melodyTrack, chordTrack, bassTrack])
  return writer.base64()
}
