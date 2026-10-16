declare module 'abcjs' {
  export interface AbcVisualOptions {
    responsive?: 'resize' | boolean
    scale?: number
    staffwidth?: number
    paddingtop?: number
    paddingbottom?: number
    paddingright?: number
    paddingleft?: number
    add_classes?: boolean
    foregroundColor?: string
    selectionColor?: string
    selectTypes?: boolean | string[]
    [key: string]: any
  }

  export function renderAbc(
    target: string | HTMLElement,
    abcString: string,
    options?: AbcVisualOptions,
  ): any[]

  export namespace synth {
    export function supportsAudio(): boolean
    export class CreateSynth {
      init(options: any): Promise<any>
      prime(): Promise<any>
      start(): void
      pause(): void
      stop(): void
    }
    export class AudioContext {}
  }
}

declare module 'midi-writer-js' {
  export class NoteEvent {
    constructor(options: {
      pitch: string[] | string
      duration: string | string[]
      velocity?: number
      sequential?: boolean
      channel?: number
    })
  }

  export class Track {
    constructor()
    addEvent(event: any): this
    setTempo(bpm: number): this
    setTimeSignature(numerator: number, denominator: number): this
    addTrackName(name: string): this
    addInstrumentName(name: string): this
  }

  export class Writer {
    constructor(tracks: Track | Track[])
    buildFile(): Uint8Array
    base64(): string
    dataUri(): string
  }

  const MidiWriter: {
    NoteEvent: typeof NoteEvent
    Track: typeof Track
    Writer: typeof Writer
  }

  export default MidiWriter
}
