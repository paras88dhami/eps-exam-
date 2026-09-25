(()=>{
  const RESULT_KEY='epsTopik100ResultV2';
  const state={set:null,questions:[],index:0,answers:{},plays:{},seconds:50*60,timer:null,submitted:false};
  const $=id=>document.getElementById(id);
  const el={sectionTitle:$('sectionTitle'),answeredCount:$('answeredCount'),timer:$('timer'),readingNav:$('readingNav'),listeningNav:$('listeningNav'),questionNumber:$('questionNumber'),sectionBadge:$('sectionBadge'),progressLabel:$('progressLabel'),progressBar:$('progressBar'),prompt:$('prompt'),mediaWrap:$('mediaWrap'),audioWrap:$('audioWrap'),audioButton:$('audioButton'),audioCount:$('audioCount'),stem:$('stem'),options:$('options'),prev:$('prevButton'),next:$('nextButton'),modal:$('submitModal'),submitStatus:$('submitStatus'),cancelSubmit:$('cancelSubmit'),confirmSubmit:$('confirmSubmit')};

  async function fetchJson(url){
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok)throw new Error(`Unable to load ${url}`);
    return response.json();
  }

  async function load(){
    const setId=new URLSearchParams(location.search).get('set');
    if(!setId){
      location.href='index.html';
      return;
    }

    const sets=await fetchJson('data/sets.json');
    const selectedSet=sets.find(item=>item.id===setId);
    if(!selectedSet)throw new Error('Test set not found');

    state.set=selectedSet;
    state.seconds=(selectedSet.durationMinutes||50)*60;
    const [reading,listening]=await Promise.all([
      fetchJson(selectedSet.reading),
      fetchJson(selectedSet.listening)
    ]);
    state.questions=[...reading,...listening];
    document.title=`${selectedSet.title} - EPS-TOPIK`;
    render();
    startTimer();
  }

  const current=()=>state.questions[state.index];
  const label=q=>q.section==='reading'?'읽기 · Reading':'듣기 · Listening';

  function render(){
    const q=current();
    if(!q)return;
    EPSTTS.cancel();
    el.sectionTitle.textContent=`${state.set.title} · ${label(q)}`;
    el.questionNumber.textContent=q.id;
    el.sectionBadge.textContent=label(q);
    el.progressLabel.textContent=`${state.index+1} / ${state.questions.length}`;
    el.progressBar.style.width=`${((state.index+1)/state.questions.length)*100}%`;
    el.prompt.textContent=q.prompt||'';
    renderMedia(q);
    renderAudio(q);
    renderStem(q);
    renderOptions(q);
    renderNav();
    el.prev.disabled=state.index===0;
    el.next.textContent=state.index===state.questions.length-1?'제출 · Submit':'다음 · Next';
    el.answeredCount.textContent=`답변 · Answered ${Object.keys(state.answers).length} / ${state.questions.length}`;
  }

  function renderMedia(q){
    el.mediaWrap.innerHTML='';
    if(!q.media){
      el.mediaWrap.classList.add('hidden');
      return;
    }
    const image=document.createElement('img');
    image.src=q.media;
    image.alt='';
    el.mediaWrap.appendChild(image);
    el.mediaWrap.classList.remove('hidden');
  }

  function renderStem(q){
    if(!q.stem){
      el.stem.textContent='';
      el.stem.classList.add('hidden');
      return;
    }
    el.stem.textContent=q.stem;
    el.stem.classList.remove('hidden');
  }

  const maxPlays=q=>Number(q.audio?.maxPlays??2);

  function renderAudio(q){
    if(q.section!=='listening'||!q.audio){
      el.audioWrap.classList.add('hidden');
      return;
    }
    el.audioWrap.classList.remove('hidden');
    const used=state.plays[q.id]||0;
    const maximum=maxPlays(q);
    const remaining=Math.max(maximum-used,0);
    el.audioCount.textContent=`${remaining} / ${maximum}`;
    el.audioButton.disabled=remaining<=0;
    el.audioButton.querySelector('span:last-child').textContent='듣기 · Play Audio';
  }

function renderOptions(q) {
  el.options.innerHTML = '';
  el.options.className = 'options-grid';

  const images = q.options.every(
    option =>
      typeof option === 'object' &&
      option.image
  );

  const audioOnly =
    q.type === 'audio_only_options';

  const numeric = [
    'audio_only_options',
    'picture_audio_options'
  ].includes(q.type);

  if (images) {
    el.options.classList.add('image-options');
  }

  if (numeric) {
    el.options.classList.add('numeric-only');
  }

  q.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';

    if (images) {
      button.className = 'image-option';

      const image = document.createElement('img');
      image.src = option.image;
      image.alt = '';

      const optionIndex = document.createElement('span');
      optionIndex.className = 'option-index';
      optionIndex.textContent = index + 1;

      button.append(image, optionIndex);
    } else {
      button.className = 'option-btn';

      const optionIndex = document.createElement('span');
      optionIndex.className = 'option-index';
      optionIndex.textContent = index + 1;

      const optionLabel = document.createElement('span');
      optionLabel.className = 'option-label';

      // Q28-Q32:
      // Never display the hidden spoken answer.
      optionLabel.textContent =
        audioOnly
          ? ''
          : typeof option === 'string'
            ? option
            : '';

      button.append(
        optionIndex,
        optionLabel
      );
    }

    if (state.answers[q.id] === index) {
      button.classList.add('selected');
    }

    button.addEventListener('click', () => {
      state.answers[q.id] = index;

      // Q28-Q32:
      // Tap option = select + speak only that option.
      if (
        audioOnly &&
        Array.isArray(q.audio?.optionsAudio)
      ) {
        const optionAudio =
          q.audio.optionsAudio[index];

        if (optionAudio) {
          EPSTTS.speakOption(optionAudio, {
            rate: q.audio.rate ?? 0.86
          });
        }
      }

      // Do NOT call render() here.
      // render() would cancel the option audio.
      Array.from(el.options.children)
        .forEach((child, childIndex) => {
          child.classList.toggle(
            'selected',
            childIndex === index
          );
        });

      renderNav();

      el.answeredCount.textContent =
        `답변 · Answered ${
          Object.keys(state.answers).length
        } / ${state.questions.length}`;
    });

    el.options.appendChild(button);
  });
}

  function renderNav(){
    el.readingNav.innerHTML='';
    el.listeningNav.innerHTML='';
    state.questions.forEach((q,index)=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='nav-btn';
      button.textContent=q.id;
      if(state.answers[q.id]!==undefined)button.classList.add('answered');
      if(index===state.index)button.classList.add('current');
      button.addEventListener('click',()=>{
        state.index=index;
        render();
      });
      (q.section==='reading'?el.readingNav:el.listeningNav).appendChild(button);
    });
  }

  function play(){
    const q=current();
    if(!q?.audio)return;
    const used=state.plays[q.id]||0;
    if(used>=maxPlays(q))return;
    state.plays[q.id]=used+1;
    renderAudio(q);
    el.audioButton.disabled=true;
    el.audioButton.querySelector('span:last-child').textContent='재생 중 · Playing';
    EPSTTS.speak(q.audio,{onEnd:()=>renderAudio(q),onError:()=>renderAudio(q)});
  }

  function next(){
    EPSTTS.cancel();
    if(state.index<state.questions.length-1){
      state.index++;
      render();
    }else{
      openSubmit();
    }
  }

  function prev(){
    EPSTTS.cancel();
    if(state.index>0){
      state.index--;
      render();
    }
  }

  function openSubmit(){
    const answered=Object.keys(state.answers).length;
    el.submitStatus.textContent=`${state.questions.length}문항 중 ${answered}문항에 답했습니다. · Answered ${answered} of ${state.questions.length} questions.`;
    el.modal.classList.remove('hidden');
  }

  function closeSubmit(){
    el.modal.classList.add('hidden');
  }

  function submit(){
    if(state.submitted)return;
    state.submitted=true;
    clearInterval(state.timer);
    EPSTTS.cancel();

    let readingCorrect=0;
    let listeningCorrect=0;
    const wrongAnswers=[];

    state.questions.forEach(q=>{
      const hasAnswer=Object.prototype.hasOwnProperty.call(state.answers,q.id);
      const userAnswer=hasAnswer?state.answers[q.id]:null;
      if(userAnswer===q.answer){
        if(q.section==='reading')readingCorrect++;
        else listeningCorrect++;
      }else{
        wrongAnswers.push({id:q.id,userAnswer});
      }
    });

    const correct=readingCorrect+listeningCorrect;
    const result={
      setId:state.set.id,
      setNumber:state.set.number,
      setTitle:state.set.title,
      total:state.questions.length,
      readingCorrect,
      listeningCorrect,
      correct,
      wrong:state.questions.length-correct,
      percentage:Math.round(correct/state.questions.length*100),
      answered:Object.keys(state.answers).length,
      wrongAnswers,
      submittedAt:new Date().toISOString()
    };

    localStorage.setItem(RESULT_KEY,JSON.stringify(result));
    location.href='result.html';
  }

  function startTimer(){
    tick();
    state.timer=setInterval(()=>{
      state.seconds--;
      tick();
      if(state.seconds<=0){
        clearInterval(state.timer);
        submit();
      }
    },1000);
  }

  function tick(){
    const seconds=Math.max(0,state.seconds);
    const minutes=Math.floor(seconds/60);
    const remainder=seconds%60;
    el.timer.textContent=`${String(minutes).padStart(2,'0')}:${String(remainder).padStart(2,'0')}`;
  }

  el.audioButton.onclick=play;
  el.next.onclick=next;
  el.prev.onclick=prev;
  el.cancelSubmit.onclick=closeSubmit;
  el.confirmSubmit.onclick=submit;
  window.addEventListener('beforeunload',()=>EPSTTS.cancel());
  load().catch(error=>{
    console.error(error);
    el.prompt.textContent='문항을 불러올 수 없습니다. · Unable to load this test set.';
  });
})();
