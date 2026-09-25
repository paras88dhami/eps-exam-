(()=>{
  const RESULT_KEY='epsTopik100ResultV2';
  const $=id=>document.getElementById(id);

  async function fetchJson(url){
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok)throw new Error(`Unable to load ${url}`);
    return response.json();
  }

  function createOption(question,option,index,userAnswer){
    const row=document.createElement('div');
    row.className='review-option';
    if(index===question.answer)row.classList.add('correct-answer');
    if(index===userAnswer&&index!==question.answer)row.classList.add('wrong-answer');

    const number=document.createElement('span');
    number.className='review-option-number';
    number.textContent=index+1;
    row.appendChild(number);

    if(typeof option==='object'&&option.image){
      const image=document.createElement('img');
      image.src=option.image;
      image.alt='';
      image.className='review-option-image';
      row.appendChild(image);
    }else{
      const text=document.createElement('span');
      text.textContent=option;
      row.appendChild(text);
    }
    return row;
  }

  function renderWrongQuestion(question,userAnswer){
    const card=document.createElement('article');
    card.className='wrong-question-card';

    const top=document.createElement('div');
    top.className='wrong-question-top';
    const number=document.createElement('strong');
    number.textContent=`${question.id}.`;
    const section=document.createElement('span');
    section.className='review-section-badge';
    section.textContent=question.section==='reading'?'읽기 · Reading':'듣기 · Listening';
    top.append(number,section);
    card.appendChild(top);

    if(question.prompt){
      const prompt=document.createElement('p');
      prompt.className='review-prompt';
      prompt.textContent=question.prompt;
      card.appendChild(prompt);
    }

    if(question.media){
      const image=document.createElement('img');
      image.src=question.media;
      image.alt='';
      image.className='review-media';
      card.appendChild(image);
    }

    if(question.section==='listening'&&question.audio){
      const audioButton=document.createElement('button');
      audioButton.type='button';
      audioButton.className='review-audio-button';
      audioButton.textContent='▶ 듣기 · Play Audio';
      audioButton.addEventListener('click',()=>{
        EPSTTS.cancel();
        EPSTTS.speak(question.audio);
      });
      card.appendChild(audioButton);
    }

    if(question.stem){
      const stem=document.createElement('div');
      stem.className='review-stem';
      stem.textContent=question.stem;
      card.appendChild(stem);
    }

    const options=document.createElement('div');
    options.className='review-options';
    question.options.forEach((option,index)=>{
      options.appendChild(createOption(question,option,index,userAnswer));
    });
    card.appendChild(options);

    const summary=document.createElement('div');
    summary.className='answer-summary';
    const userBlock=document.createElement('div');
    const userLabel=document.createElement('span');
    userLabel.textContent='내 답 · Your Answer';
    const userValue=document.createElement('strong');
    userValue.className='wrong-text';
    userValue.textContent=userAnswer===null?'답하지 않음 · Not Answered':userAnswer+1;
    userBlock.append(userLabel,userValue);
    const correctBlock=document.createElement('div');
    const correctLabel=document.createElement('span');
    correctLabel.textContent='정답 · Correct Answer';
    const correctValue=document.createElement('strong');
    correctValue.className='correct-text';
    correctValue.textContent=question.answer+1;
    correctBlock.append(correctLabel,correctValue);
    summary.append(userBlock,correctBlock);
    card.appendChild(summary);
    return card;
  }

  async function init(){
    const raw=localStorage.getItem(RESULT_KEY);
    if(!raw){
      location.href='index.html';
      return;
    }

    const result=JSON.parse(raw);
    $('resultSetTitle').textContent=`세트 ${result.setNumber} · Set ${result.setNumber}`;
    $('scoreText').textContent=`${result.correct} / ${result.total}`;
    $('percentText').textContent=`${result.percentage}%`;
    $('readingScore').textContent=`${result.readingCorrect} / 20`;
    $('listeningScore').textContent=`${result.listeningCorrect} / 20`;
    $('correctCount').textContent=result.correct;
    $('wrongCount').textContent=result.wrong;
    $('retryLink').href=`test.html?set=${encodeURIComponent(result.setId)}`;

    const wrongAnswers=result.wrongAnswers||[];
    $('wrongQuestionCount').textContent=wrongAnswers.length;
    if(wrongAnswers.length===0){
      $('wrongQuestions').innerHTML='<div class="perfect-result"><h2>모든 문제를 맞혔습니다!</h2><p>All answers are correct.</p></div>';
      return;
    }

    const sets=await fetchJson('data/sets.json');
    const selectedSet=sets.find(item=>item.id===result.setId);
    if(!selectedSet)throw new Error('Set not found');
    const [reading,listening]=await Promise.all([
      fetchJson(selectedSet.reading),
      fetchJson(selectedSet.listening)
    ]);
    const wrongMap=new Map(wrongAnswers.map(item=>[item.id,item.userAnswer]));
    [...reading,...listening].forEach(question=>{
      if(wrongMap.has(question.id)){
        $('wrongQuestions').appendChild(renderWrongQuestion(question,wrongMap.get(question.id)));
      }
    });
  }

  window.addEventListener('beforeunload',()=>EPSTTS.cancel());
  init().catch(error=>{
    console.error(error);
    $('wrongQuestions').innerHTML='<p>결과를 불러올 수 없습니다. · Unable to load result.</p>';
  });
})();
