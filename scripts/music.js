const FOCUS_MUSIC_KEY="pppFocusMusic_v1";
function loadFocusMusic(){
  const fallback={preset:"deep",volume:35,withTimer:true};
  try{const saved=JSON.parse(localStorage.getItem(FOCUS_MUSIC_KEY)||"null")||{};return {...fallback,...saved,preset:["deep","brown","rain"].includes(saved.preset)?saved.preset:"deep",volume:clamp(Number(saved.volume??35),0,100),withTimer:saved.withTimer!==false}}catch(e){return fallback}
}
let focusMusic=loadFocusMusic(),focusAudioContext=null,focusAudioMaster=null,focusAudioNodes=[],focusMusicPlaying=false;
function saveFocusMusic(){localStorage.setItem(FOCUS_MUSIC_KEY,JSON.stringify(focusMusic))}
function setMusicStatus(message){const element=document.getElementById("musicStatus");if(element)element.textContent=message}
function focusSoundLabel(){return {deep:"Deep Focus",brown:"Brown Noise",rain:"Soft Rain"}[focusMusic.preset]||"Deep Focus"}
function renderMusicControls(){
  const preset=document.getElementById("musicPreset"),toggle=document.getElementById("musicWithTimer"),volume=document.getElementById("musicVolume"),value=document.getElementById("musicVolumeValue"),button=document.getElementById("musicPlayPause"),panel=document.getElementById("focusMusicPanel");
  if(!preset)return;if(document.activeElement!==preset)preset.value=focusMusic.preset;toggle.checked=focusMusic.withTimer;volume.value=focusMusic.volume;value.textContent=`${focusMusic.volume}%`;button.textContent=focusMusicPlaying?"Ⅱ Pause Sound":"▶ Play Sound";panel.classList.toggle("music-playing",focusMusicPlaying);
}
function getFocusAudioContext(){const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)throw new Error("Web Audio is not supported in this browser.");if(!focusAudioContext||focusAudioContext.state==="closed")focusAudioContext=new AudioContextClass();return focusAudioContext}
function makeNoiseBuffer(context,kind="white"){
  const seconds=3,length=Math.max(1,Math.floor(context.sampleRate*seconds)),buffer=context.createBuffer(2,length,context.sampleRate);
  for(let channel=0;channel<buffer.numberOfChannels;channel++){const data=buffer.getChannelData(channel);let brown=0;for(let i=0;i<length;i++){const white=Math.random()*2-1;if(kind==="brown"){brown=(brown+.02*white)/1.02;data[i]=clamp(brown*3.5,-1,1)}else data[i]=white}}
  return buffer;
}
function registerFocusNode(node){focusAudioNodes.push(node);return node}
function stopFocusAudioNodes(){focusAudioNodes.forEach(node=>{try{if(typeof node.stop==="function")node.stop()}catch(e){}try{node.disconnect()}catch(e){}});focusAudioNodes=[];if(focusAudioMaster){try{focusAudioMaster.disconnect()}catch(e){}focusAudioMaster=null}}
function connectNoise(context,master,kind,lowpass,highpass,gainValue){
  const source=registerFocusNode(context.createBufferSource());source.buffer=makeNoiseBuffer(context,kind);source.loop=true;let current=source;
  if(highpass){const filter=registerFocusNode(context.createBiquadFilter());filter.type="highpass";filter.frequency.value=highpass;current.connect(filter);current=filter}
  if(lowpass){const filter=registerFocusNode(context.createBiquadFilter());filter.type="lowpass";filter.frequency.value=lowpass;current.connect(filter);current=filter}
  const gain=registerFocusNode(context.createGain());gain.gain.value=gainValue;current.connect(gain);gain.connect(master);source.start();
}
function connectTone(context,master,frequency,gainValue){const oscillator=registerFocusNode(context.createOscillator()),gain=registerFocusNode(context.createGain());oscillator.type="sine";oscillator.frequency.value=frequency;gain.gain.value=gainValue;oscillator.connect(gain);gain.connect(master);oscillator.start()}
async function startFocusMusic(manual=false){
  if(!manual&&!focusMusic.withTimer)return;
  try{const context=getFocusAudioContext();if(context.state==="suspended")await context.resume();stopFocusAudioNodes();focusAudioMaster=context.createGain();focusAudioMaster.gain.value=(focusMusic.volume/100)*.34;focusAudioMaster.connect(context.destination);if(focusMusic.preset==="rain"){connectNoise(context,focusAudioMaster,"white",7200,650,.42);connectNoise(context,focusAudioMaster,"brown",1200,0,.16)}else if(focusMusic.preset==="brown")connectNoise(context,focusAudioMaster,"brown",950,0,.72);else{connectNoise(context,focusAudioMaster,"brown",780,0,.48);connectTone(context,focusAudioMaster,55,.035);connectTone(context,focusAudioMaster,82.41,.018)}focusMusicPlaying=true;setMusicStatus(`${focusSoundLabel()} is playing${manual?".":" with your focus session."}`)}catch(error){focusMusicPlaying=false;setMusicStatus(error?.message||"Focus sound could not start. Press Play again.")}renderMusicControls();
}
function pauseFocusMusic(message="Focus sound paused with the timer."){stopFocusAudioNodes();focusMusicPlaying=false;setMusicStatus(message);renderMusicControls()}
function toggleFocusMusic(){focusMusicPlaying?pauseFocusMusic("Focus sound paused."):startFocusMusic(true)}
function changeFocusSound(preset){if(!["deep","brown","rain"].includes(preset))return;const wasPlaying=focusMusicPlaying;focusMusic.preset=preset;saveFocusMusic();if(wasPlaying)startFocusMusic(true);else setMusicStatus(`${focusSoundLabel()} selected. Press Play or start the timer.`);renderMusicControls()}
