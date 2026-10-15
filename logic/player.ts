import * as Tone from 'tone'
import type { CompositionResult, MusicEvent } from './composer'

export interface PlayerState {
  isPlaying: boolean
  isPaused: boolean
  currentNoteIndex: number
  currentTime: number
  totalDuration: number
  samplesLoaded: boolean
}

class MusicPlayer {
  // 采样器与乐器合成器
  private pianoSampler: Tone.Sampler | null = null
  private leadSynth: Tone.PolySynth | null = null
  private chordSynth: Tone.PolySynth | null = null
  private padSynth: Tone.PolySynth | null = null
  private bassSynth: Tone.MonoSynth | null = null
  private counterSynth: Tone.PolySynth | null = null

  // 现代工业化鼓组 (Drums Section)
  private kickSynth: Tone.MembraneSynth | null = null
  private snareSynth: Tone.NoiseSynth | null = null
  private hihatSynth: Tone.MetalSynth | null = null

  // 母带与空间音效链
  private reverb: Tone.Reverb | null = null
  private delay: Tone.PingPongDelay | null = null
  private compressor: Tone.Compressor | null = null
  private widener: Tone.StereoWidener | null = null

  private isInitialized = false
  private currentComposition: CompositionResult | null = null
  private progressInterval: any = null

  public state = reactive<PlayerState>({
    isPlaying: false,
    isPaused: false,
    currentNoteIndex: -1,
    currentTime: 0,
    totalDuration: 0,
    samplesLoaded: false,
  })

  private async initAudioChain() {
    if (this.isInitialized || typeof window === 'undefined')
      return

    await Tone.start()

    // 1. 母带级动态压限器 (让混音饱满紧实不破音)
    this.compressor = new Tone.Compressor({
      threshold: -16,
      ratio: 3.5,
      attack: 0.012,
      release: 0.25,
    }).toDestination()

    // 2. 3D 声场展宽器
    this.widener = new Tone.StereoWidener(0.6).connect(this.compressor)

    // 3. 音乐厅长混响 (深远水墨空间)
    this.reverb = new Tone.Reverb({
      decay: 2.8,
      preDelay: 0.03,
      wet: 0.28,
    }).connect(this.widener)

    // 4. 乒乓立体声延迟
    this.delay = new Tone.PingPongDelay({
      delayTime: '8n.',
      feedback: 0.16,
      wet: 0.14,
    }).connect(this.reverb)

    // 5. 施坦威大三角钢琴真实采样器
    try {
      this.pianoSampler = new Tone.Sampler({
        urls: {
          A0: 'A0.mp3',
          C1: 'C1.mp3',
          'D#1': 'Ds1.mp3',
          'F#1': 'Fs1.mp3',
          A1: 'A1.mp3',
          C2: 'C2.mp3',
          'D#2': 'Ds2.mp3',
          'F#2': 'Fs2.mp3',
          A2: 'A2.mp3',
          C3: 'C3.mp3',
          'D#3': 'Ds3.mp3',
          'F#3': 'Fs3.mp3',
          A3: 'A3.mp3',
          C4: 'C4.mp3',
          'D#4': 'Ds4.mp3',
          'F#4': 'Fs4.mp3',
          A4: 'A4.mp3',
          C5: 'C5.mp3',
          'D#5': 'Ds5.mp3',
          'F#5': 'Fs5.mp3',
          A5: 'A5.mp3',
          C6: 'C6.mp3',
          'D#6': 'Ds6.mp3',
          'F#6': 'Fs6.mp3',
          A6: 'A6.mp3',
          C7: 'C7.mp3',
          'D#7': 'Ds7.mp3',
          'F#7': 'Fs7.mp3',
          A7: 'A7.mp3',
          C8: 'C8.mp3',
        },
        baseUrl: 'https://tonejs.github.io/audio/salamander/',
        onload: () => {
          this.state.samplesLoaded = true
        },
      }).connect(this.delay)
    }
    catch (e) {
      console.warn('Sampler fallback active:', e)
    }

    // 6. 主旋律备用柔和钢琴音色
    this.leadSynth = new Tone.PolySynth(Tone.Synth, {
      volume: 1,
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.015, decay: 1.6, sustain: 0.22, release: 1.0 },
    }).connect(this.delay)

    // 7. 和弦与伴奏音色
    this.chordSynth = new Tone.PolySynth(Tone.Synth, {
      volume: -4,
      oscillator: { type: 'fatsine', count: 2, spread: 10 },
      envelope: { attack: 0.02, decay: 1.8, sustain: 0.18, release: 1.2 },
    }).connect(this.delay)

    // 8. 氛围和声垫音 Pad
    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      volume: -14,
      oscillator: { type: 'fatsawtooth', count: 3, spread: 20 },
      envelope: { attack: 0.4, decay: 2.2, sustain: 0.5, release: 2.0 },
    }).connect(this.reverb)

    // 9. 扎实浑厚的低音 Bass
    this.bassSynth = new Tone.MonoSynth({
      volume: -6,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.03, decay: 1.5, sustain: 0.4, release: 1.0 },
      filterEnvelope: { attack: 0.04, decay: 0.4, sustain: 0.3, release: 0.8, baseFrequency: 110, octaves: 2 },
    }).connect(this.compressor)

    // 10. 副旋律与过门加花 Counterpoint
    this.counterSynth = new Tone.PolySynth(Tone.Synth, {
      volume: -2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 1.4, sustain: 0.2, release: 1.2 },
    }).connect(this.delay)

    // 11. 现代工业化鼓点：底鼓 Kick
    this.kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.35 },
    }).connect(this.compressor)

    // 12. 现代军鼓 / 响指 Snare
    this.snareSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
    }).connect(this.compressor)

    // 13. 踩镲 / 碎音 Hi-hat
    this.hihatSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.06, release: 0.06 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
    }).connect(this.compressor)

    this.isInitialized = true
  }

  private triggerLead(pitch: string, duration: number, time: number, velocity: number) {
    if (this.pianoSampler && this.state.samplesLoaded) {
      this.pianoSampler.triggerAttackRelease(pitch, duration, time, velocity * 1.05)
    }
    else if (this.leadSynth) {
      this.leadSynth.triggerAttackRelease(pitch, duration, time, velocity)
    }
  }

  private triggerChord(pitch: string, duration: number, time: number, velocity: number) {
    if (this.pianoSampler && this.state.samplesLoaded) {
      this.pianoSampler.triggerAttackRelease(pitch, duration, time, velocity * 0.85)
    }
    else if (this.chordSynth) {
      this.chordSynth.triggerAttackRelease(pitch, duration, time, velocity)
    }
  }

  private scheduleEvents(comp: CompositionResult) {
    const transport = Tone.getTransport()
    transport.stop()
    transport.position = 0
    transport.cancel()

    comp.events.forEach((e: MusicEvent) => {
      transport.schedule((time) => {
        if (e.track === 'melody') {
          this.triggerLead(e.pitch, e.duration, time, e.velocity)
          if (typeof e.noteIndex === 'number' && !e.isOrnament && !e.isMelisma) {
            Tone.getDraw().schedule(() => {
              this.state.currentNoteIndex = e.noteIndex!
            }, time)
          }
        }
        else if (e.track === 'chord') {
          this.triggerChord(e.pitch, e.duration, time, e.velocity)
        }
        else if (e.track === 'counter' && this.counterSynth) {
          this.counterSynth.triggerAttackRelease(e.pitch, e.duration, time, e.velocity)
        }
        else if (e.track === 'pad' && this.padSynth) {
          this.padSynth.triggerAttackRelease(e.pitch, e.duration, time, e.velocity)
        }
        else if (e.track === 'bass' && this.bassSynth) {
          this.bassSynth.triggerAttackRelease(e.pitch, e.duration, time, e.velocity)
        }
        else if (e.track === 'kick' && this.kickSynth) {
          this.kickSynth.triggerAttackRelease(e.pitch || 'C1', e.duration, time, e.velocity)
        }
        else if (e.track === 'snare' && this.snareSynth) {
          this.snareSynth.triggerAttackRelease(e.duration, time, e.velocity)
        }
        else if (e.track === 'hihat' && this.hihatSynth) {
          this.hihatSynth.triggerAttackRelease(e.duration, time, e.velocity)
        }
      }, e.time)
    })

    transport.schedule(() => {
      Tone.getDraw().schedule(() => {
        this.stop()
      }, Tone.now())
    }, comp.durationTotal)
  }

  public loadComposition(comp: CompositionResult) {
    this.stop()
    this.currentComposition = comp
    this.state.totalDuration = comp.durationTotal
    this.state.currentTime = 0
  }

  public async play(comp?: CompositionResult) {
    if (typeof window === 'undefined')
      return

    if (comp) {
      this.currentComposition = comp
      this.state.totalDuration = comp.durationTotal
    }

    if (!this.currentComposition)
      return

    await this.initAudioChain()

    const transport = Tone.getTransport()

    if (!this.state.isPaused) {
      this.scheduleEvents(this.currentComposition)
    }

    transport.start()
    this.state.isPlaying = true
    this.state.isPaused = false
    this.startProgressTracker()
  }

  public pause() {
    if (typeof window === 'undefined')
      return

    const transport = Tone.getTransport()
    transport.pause()

    this.silenceAllVoices()

    this.state.isPlaying = false
    this.state.isPaused = true

    this.stopProgressTracker()
  }

  public stop() {
    if (typeof window === 'undefined')
      return

    const transport = Tone.getTransport()
    transport.stop()
    transport.position = 0

    this.silenceAllVoices()

    this.state.isPlaying = false
    this.state.isPaused = false
    this.state.currentNoteIndex = -1
    this.state.currentTime = 0

    this.stopProgressTracker()
  }

  public async togglePlay(comp?: CompositionResult) {
    if (this.state.isPlaying) {
      this.pause()
    }
    else {
      await this.play(comp)
    }
  }

  public seek(timeSeconds: number) {
    if (typeof window === 'undefined')
      return

    const t = Math.max(0, Math.min(this.state.totalDuration, timeSeconds))
    this.state.currentTime = Number(t.toFixed(1))

    this.silenceAllVoices()

    const transport = Tone.getTransport()
    transport.seconds = t

    if (this.currentComposition) {
      const found = this.currentComposition.lyricNotes.slice().reverse().find(n => n.time <= t + 0.1)
      this.state.currentNoteIndex = found ? found.index : -1
    }
  }

  private silenceAllVoices() {
    try {
      this.pianoSampler?.releaseAll()
      this.leadSynth?.releaseAll()
      this.chordSynth?.releaseAll()
      this.counterSynth?.releaseAll()
      this.padSynth?.releaseAll()
      this.bassSynth?.triggerRelease()
    }
    catch {
      // 容错
    }
  }

  private startProgressTracker() {
    this.stopProgressTracker()
    this.progressInterval = setInterval(() => {
      if (this.state.isPlaying) {
        this.state.currentTime = Number(Tone.getTransport().seconds.toFixed(1))
      }
    }, 100)
  }

  private stopProgressTracker() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
  }
}

export const musicPlayer = new MusicPlayer()
