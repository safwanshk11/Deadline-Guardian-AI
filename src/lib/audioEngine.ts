// Procedural Audio Engine for Focus Room Background Sounds
// Synthesizes high-quality, continuous ambient soundscapes natively via Web Audio API.
// No external assets or network requests required.

export type SoundType = "none" | "rain" | "binaural" | "ocean";

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private currentType: SoundType = "none";
  private globalVolume = 0.5;

  // Master nodes
  private masterGain: GainNode | null = null;

  // Sound source nodes
  private noiseSource: AudioBufferSourceNode | null = null;
  private oscL: OscillatorNode | null = null;
  private oscR: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private rainTimer: any = null;

  // Cached buffers to avoid re-generating
  private brownBuffer: AudioBuffer | null = null;
  private pinkBuffer: AudioBuffer | null = null;

  constructor() {
    // Lazy-initialized on first interaction due to browser autoplay policies
  }

  private initContext() {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("Web Audio API is not supported in this browser.");
      return;
    }

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.globalVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Generate noise buffers
    this.generateBuffers();
  }

  private generateBuffers() {
    if (!this.ctx) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2; // 2 seconds loop

    // 1. Brown Noise Buffer
    this.brownBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const brownData = this.brownBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // First-order filter to decrease power by 6dB/octave
      brownData[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = brownData[i];
      brownData[i] *= 3.5; // Volume compensation
    }

    // 2. Pink Noise Buffer (Paul Kellet's refined method)
    this.pinkBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const pinkData = this.pinkBuffer.getChannelData(0);
    let b0 = 0.0, b1 = 0.0, b2 = 0.0, b3 = 0.0, b4 = 0.0, b5 = 0.0, b6 = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pinkData[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      pinkData[i] *= 0.11; // Volume compensation
      b6 = white * 0.115926;
    }
  }

  public setVolume(volume: number) {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.globalVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.globalVolume;
  }

  public getType(): SoundType {
    return this.currentType;
  }

  public stop() {
    this.cleanupNodes();
    this.currentType = "none";
  }

  private cleanupNodes() {
    try {
      if (this.rainTimer) {
        clearTimeout(this.rainTimer);
        this.rainTimer = null;
      }
      if (this.noiseSource) {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
        this.noiseSource = null;
      }
      if (this.oscL) {
        this.oscL.stop();
        this.oscL.disconnect();
        this.oscL = null;
      }
      if (this.oscR) {
        this.oscR.stop();
        this.oscR.disconnect();
        this.oscR = null;
      }
      if (this.lfo) {
        this.lfo.stop();
        this.lfo.disconnect();
        this.lfo = null;
      }
      if (this.filterNode) {
        this.filterNode.disconnect();
        this.filterNode = null;
      }
    } catch (e) {
      // Ignore errors from stopping nodes that weren't started or already stopped
    }
  }

  public play(type: SoundType) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    // Resume context if suspended (common browser requirement)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    if (this.currentType === type) return;

    this.cleanupNodes();
    this.currentType = type;

    if (type === "none") return;

    const now = this.ctx.currentTime;

    if (type === "rain" && this.pinkBuffer) {
      // 1. Play Synthesized Steady Forest Rain
      // Layer A: Soft, slow-breathing background forest canopy wind and wash
      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = this.pinkBuffer;
      this.noiseSource.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.setValueAtTime(450, now); // Soft, deep forest wash (no harsh high frequencies)

      const washGain = this.ctx.createGain();
      washGain.gain.setValueAtTime(0.06, now); // Distant background volume level

      // Add a very slow LFO to simulate light wind shifting the rain canopy (0.04Hz, i.e., 25 second swell)
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = "sine";
      this.lfo.frequency.setValueAtTime(0.04, now);

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(150, now); // Frequency modulation depth in Hz
      
      const lfoGainVol = this.ctx.createGain();
      lfoGainVol.gain.setValueAtTime(0.02, now); // Volume modulation depth

      this.lfo.connect(lfoGain);
      this.lfo.connect(lfoGainVol);
      lfoGain.connect(this.filterNode.frequency);
      lfoGainVol.connect(washGain.gain);

      this.noiseSource.connect(this.filterNode);
      this.filterNode.connect(washGain);
      washGain.connect(this.masterGain);

      this.noiseSource.start(0);
      this.lfo.start(0);

      // Layer B: Procedural pitter-patter leaf droplets
      // Schedules randomized, high-frequency "drops" of varying pitch, duration, and resonant brightness.
      const spawnDrop = () => {
        if (!this.ctx || this.currentType !== "rain") return;

        const dropTime = this.ctx.currentTime;
        if (this.pinkBuffer) {
          const dropSource = this.ctx.createBufferSource();
          dropSource.buffer = this.pinkBuffer;
          // Randomize playback speed (pitch/speed variation)
          dropSource.playbackRate.setValueAtTime(0.7 + Math.random() * 0.7, dropTime);

          const dropFilter = this.ctx.createBiquadFilter();
          dropFilter.type = "bandpass";
          // Leaf/ground raindrop sweet spot (1200Hz to 3200Hz)
          dropFilter.frequency.setValueAtTime(1300 + Math.random() * 1800, dropTime);
          // Moderate-to-high Q resonant peaks make drops sound wet/organic
          dropFilter.Q.setValueAtTime(3 + Math.random() * 6, dropTime);

          const dropGain = this.ctx.createGain();
          dropGain.gain.setValueAtTime(0, dropTime);
          // Dynamic drop volume
          const peakGain = 0.012 + Math.random() * 0.018;
          // Super-fast attack impulse
          dropGain.gain.linearRampToValueAtTime(peakGain, dropTime + 0.002);
          // Rapid decay to simulate impact
          dropGain.gain.exponentialRampToValueAtTime(0.0001, dropTime + 0.025 + Math.random() * 0.065);

          dropSource.connect(dropFilter);
          dropFilter.connect(dropGain);
          if (this.masterGain) {
            dropGain.connect(this.masterGain);
          }

          // Start from a random position in the buffer, play for a short duration
          dropSource.start(dropTime, Math.random() * 1.5, 0.12);

          // Fast node garbage collection
          setTimeout(() => {
            try {
              dropSource.stop();
              dropSource.disconnect();
              dropFilter.disconnect();
              dropGain.disconnect();
            } catch (e) {}
          }, 150);
        }

        // Schedule next drop at a random interval (25ms to 95ms for perfect texture density)
        const nextInterval = 25 + Math.random() * 70;
        this.rainTimer = setTimeout(spawnDrop, nextInterval);
      };

      // Boot up the scheduler
      spawnDrop();

    } else if (type === "binaural" && this.brownBuffer) {
      // 3. Binaural Beat (100Hz Carrier + 6Hz Theta Entrainment)
      // Play stereo sine waves alongside a soft brown noise blanket for immersion
      const merger = this.ctx.createChannelMerger(2);

      this.oscL = this.ctx.createOscillator();
      this.oscL.type = "sine";
      this.oscL.frequency.setValueAtTime(100, now); // Left channel: 100 Hz

      this.oscR = this.ctx.createOscillator();
      this.oscR.type = "sine";
      this.oscR.frequency.setValueAtTime(106, now); // Right channel: 106 Hz (6Hz Theta)

      const oscGainL = this.ctx.createGain();
      const oscGainR = this.ctx.createGain();
      oscGainL.gain.setValueAtTime(0.2, now); // Lower oscillator volume
      oscGainR.gain.setValueAtTime(0.2, now);

      this.oscL.connect(oscGainL);
      this.oscR.connect(oscGainR);

      oscGainL.connect(merger, 0, 0); // Route Left
      oscGainR.connect(merger, 0, 1); // Route Right

      // Add soft brown noise background
      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = this.brownBuffer;
      this.noiseSource.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.setValueAtTime(300, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.15, now);

      this.noiseSource.connect(this.filterNode);
      this.filterNode.connect(noiseGain);
      
      // Connect merger and noise blanket to master output
      merger.connect(this.masterGain);
      noiseGain.connect(this.masterGain);

      this.oscL.start(0);
      this.oscR.start(0);
      this.noiseSource.start(0);

    } else if (type === "ocean" && this.brownBuffer) {
      // 4. Synthesized Ocean Waves (LFO modulating pink/brown noise volume & filter cut)
      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = this.brownBuffer;
      this.noiseSource.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.setValueAtTime(350, now);

      const oceanGain = this.ctx.createGain();
      oceanGain.gain.setValueAtTime(0.2, now);

      // LFO to modulate volume slow swell (0.07Hz = ~14 second cycle)
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = "sine";
      this.lfo.frequency.setValueAtTime(0.07, now);

      const lfoGainVolume = this.ctx.createGain();
      lfoGainVolume.gain.setValueAtTime(0.12, now); // Modulation depth

      const lfoGainFilter = this.ctx.createGain();
      lfoGainFilter.gain.setValueAtTime(200, now); // Filter frequency modulation depth (Hz)

      this.lfo.connect(lfoGainVolume);
      this.lfo.connect(lfoGainFilter);

      lfoGainVolume.connect(oceanGain.gain); // Modulates volume
      lfoGainFilter.connect(this.filterNode.frequency); // Modulates brightness!

      this.noiseSource.connect(this.filterNode);
      this.filterNode.connect(oceanGain);
      oceanGain.connect(this.masterGain);

      this.lfo.start(0);
      this.noiseSource.start(0);
    }
  }
}
