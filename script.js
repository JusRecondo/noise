const stWnBtn = document.querySelector('#st-wn');
const spWnBtn = document.querySelector('#sp-wn');
const wnGain = document.querySelector('#wn-gain-control');
const stPnBtn = document.querySelector('#st-pn');
const spPnBtn = document.querySelector('#sp-pn');
const pnGain = document.querySelector('#pn-gain-control');
const stBnBtn = document.querySelector('#st-bn');
const spBnBtn = document.querySelector('#sp-bn');
const bnGain = document.querySelector('#bn-gain-control');
const stOscBtn = document.querySelector('#st-osc');
const spOscBtn = document.querySelector('#sp-osc');
const oscTypeSelect = document.querySelector('#osc-type-select');
const oscGainControl = document.querySelector('#osc-gain-control');
const oscFreqControl = document.querySelector('#osc-freq-control');
const stLFOBtn = document.querySelector('#st-lfo');
const spLFOBtn = document.querySelector('#sp-lfo');
const lfoTypeSelect = document.querySelector('#lfo-type-select');
const lfoGainControl = document.querySelector('#lfo-gain-control');
const lfoFreqControl = document.querySelector('#lfo-freq-control');
const filterCutInput = document.querySelector('#filter-cut');
const filterResInput = document.querySelector('#filter-res');

const audioContext = new (window.AudioContext ||
  window.webkitAudioContext)();


//Filter
const filter = audioContext.createBiquadFilter();
filter.frequency.setTargetAtTime(5000, audioContext.currentTime, 0.1);
filter.Q.setTargetAtTime(1, audioContext.currentTime, 0.1);
filter.connect(audioContext.destination);

//Filter controls
filterCutInput.addEventListener('input', (e) => {
	let cut = parseFloat(e.target.value);

	if(audioContext && filter) {
        filter.frequency.exponentialRampToValueAtTime(
		cut,
		audioContext.currentTime + 0.2
	);
    }
});

filterResInput.addEventListener('input', (e) => {
	let res = parseFloat(e.target.value);

	if(audioContext && filter) {
		filter.Q.value = res;
    }
});

//White Noise
let whiteNoise;
//White Noise gain control
const wnGainNode = audioContext.createGain();
wnGainNode.gain.setTargetAtTime(0.2, audioContext.currentTime, 0);
wnGainNode.connect(filter);

const createWhiteNoise = () => {
  const bufferSize = 2 * audioContext.sampleRate;
  const noiseBuffer = audioContext.createBuffer(2, bufferSize, audioContext.sampleRate);
  
  for (let channel = 0; channel < noiseBuffer.numberOfChannels; channel++) {
    const output = noiseBuffer.getChannelData(channel);
  
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }
  
  whiteNoise = audioContext.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;
  whiteNoise.connect(wnGainNode);
  whiteNoise.start(0);
  
}

//White Noise UI
stWnBtn.onclick = () => createWhiteNoise();
spWnBtn.onclick = () => whiteNoise.stop();

wnGain.oninput = (e) => {
  let value = parseFloat(e.target.value);
  wnGainNode.gain.linearRampToValueAtTime(value, audioContext.currentTime + 0.01);
}

//Pink Noise
let pinkNoise;
//Pink Noise gain control
const pnGainNode = audioContext.createGain();
pnGainNode.gain.setTargetAtTime(0.2, audioContext.currentTime, 0);
pnGainNode.connect(filter);

const createPinkNoise = () => {
  const bufferSize = 4096;
  let b0, b1, b2, b3, b4, b5, b6;
  b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
  pinkNoise = audioContext.createScriptProcessor(bufferSize, 1, 1);
  pinkNoise.onaudioprocess = function(e) {
    let output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // (roughly) compensate for gain
      b6 = white * 0.115926;
    }
  }
  pinkNoise.connect(pnGainNode);
};

//Pink Noise UI  
stPnBtn.onclick = () => createPinkNoise();
spPnBtn.onclick = () => pinkNoise.disconnect(pnGainNode);

pnGain.oninput = (e) => {
  let value = parseFloat(e.target.value);
  pnGainNode.gain.linearRampToValueAtTime(value, audioContext.currentTime + 0.01);
}

//Brown Noise
let brownNoise;
//Brown Noise gain control
const bnGainNode = audioContext.createGain();
bnGainNode.gain.setTargetAtTime(0.2, audioContext.currentTime, 0);
bnGainNode.connect(filter);

const createBrownNoise = (function() {
    const bufferSize = 4096;
    let lastOut = 0.0;
    brownNoise = audioContext.createScriptProcessor(bufferSize, 1, 1);
    brownNoise.onaudioprocess = function(e) {
        let output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // (roughly) compensate for gain
        }
    }
  brownNoise.connect(bnGainNode);
});

//Brown Noise UI
stBnBtn.onclick = () => createBrownNoise();
spBnBtn.onclick = () => brownNoise.disconnect(bnGainNode);

bnGain.oninput = (e) => {
  let value = parseFloat(e.target.value);
  bnGainNode.gain.linearRampToValueAtTime(value, audioContext.currentTime + 0.01);
}

//Modulation tests
let osc;
const oscGainNode = audioContext.createGain();
oscGainNode.gain.setTargetAtTime(0.2, audioContext.currentTime, 0);
oscGainNode.connect(audioContext.destination);

const createOsc = (freq, connection) => {
  let osc = audioContext.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  osc.start();
  osc.connect(connection);

  return osc;
}

//Oscillator UI
stOscBtn.onclick = () => osc = createOsc(220, oscGainNode);
spOscBtn.onclick = () => osc.stop();
oscTypeSelect.onchange = (e) => {
  if(osc) {
    osc.type = e.target.value;   
  }
}

oscGainControl.oninput = (e) => {
  let value = parseFloat(e.target.value);
  oscGainNode.gain.linearRampToValueAtTime(value, audioContext.currentTime + 0.01);
}

oscFreqControl.oninput = (e) => {
    let freq = e.target.value;
    osc.frequency.value = freq;
}

wnGainNode.connect(oscGainNode.gain);
pnGainNode.connect(oscGainNode.gain);
bnGainNode.connect(oscGainNode.gain);

//LFO 
let lfo;
const lfoGainNode = audioContext.createGain();
lfoGainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0);
lfoGainNode.connect(audioContext.destination);

stLFOBtn.onclick = () => lfo = createOsc(1, lfoGainNode);
spLFOBtn.onclick = () => lfo.stop();
lfoTypeSelect.onchange = (e) => {
  if(lfo) {
    lfo.type = e.target.value;   
  }
}

lfoGainControl.oninput = (e) => {
  let value = parseFloat(e.target.value);
  lfoGainNode.gain.linearRampToValueAtTime(value, audioContext.currentTime + 0.01);
}

lfoFreqControl.oninput = (e) => {
    let freq = e.target.value;
    lfo.frequency.value = freq;
}

lfoGainNode.connect(wnGainNode.gain);
lfoGainNode.connect(pnGainNode.gain);
lfoGainNode.connect(bnGainNode.gain);