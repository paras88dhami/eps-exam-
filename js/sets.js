(()=>{
  const container=document.getElementById('setsContainer');
  const count=document.getElementById('availableSetCount');
  const error=document.getElementById('setsError');

  async function loadSets(){
    try{
      const response=await fetch('data/sets.json',{cache:'no-store'});
      if(!response.ok)throw new Error('Unable to load sets');

      const sets=await response.json();
      sets.sort((a,b)=>a.number-b.number);
      count.textContent=`${sets.length} ${sets.length===1?'Set':'Sets'}`;
      container.innerHTML='';

      sets.forEach(set=>{
        const card=document.createElement('article');
        card.className='set-card';

        const top=document.createElement('div');
        top.className='set-card-top';
        const number=document.createElement('span');
        number.className='set-number';
        number.textContent=`SET ${String(set.number).padStart(2,'0')}`;
        const questionCount=document.createElement('span');
        questionCount.className='set-question-count';
        questionCount.textContent=`${set.questionCount||40} Questions`;
        top.append(number,questionCount);

        const title=document.createElement('h3');
        title.textContent=`세트 ${set.number} · Set ${set.number}`;

        const meta=document.createElement('div');
        meta.className='set-meta';
        ['읽기 20 · Reading','듣기 20 · Listening',`${set.durationMinutes||50} Minutes`].forEach(value=>{
          const item=document.createElement('span');
          item.textContent=value;
          meta.appendChild(item);
        });

        const start=document.createElement('a');
        start.className='primary-action set-start-button';
        start.href=`test.html?set=${encodeURIComponent(set.id)}`;
        start.textContent='시험 시작 · Start Test';

        card.append(top,title,meta,start);
        container.appendChild(card);
      });
    }catch(err){
      console.error(err);
      error.classList.remove('hidden');
    }
  }

  loadSets();
})();
