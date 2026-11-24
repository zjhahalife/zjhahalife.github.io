(() => {
  'use strict';
  const archiveKey='zhou-jun-archive-position-v1';
  const restoreKey='zhou-jun-restore-archive-v1';
  const isArchive=document.body.classList.contains('works-page');
  const isWork=document.body.classList.contains('work-page');
  const normalClick=event=>event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey;
  function readStorage(key){try{return sessionStorage.getItem(key);}catch(_){return null;}}
  function writeStorage(key,value){try{sessionStorage.setItem(key,value);}catch(_){}}
  function removeStorage(key){try{sessionStorage.removeItem(key);}catch(_){}}
  function archiveState(expected){
    try{
      const saved=JSON.parse(readStorage(archiveKey));
      if(!saved||typeof saved.url!=='string'||typeof saved.search!=='string')return null;
      const url=new URL(saved.url,location.href);
      if(url.origin!==location.origin||url.protocol!==location.protocol||url.pathname!==expected.pathname||url.username||url.password)return null;
      if(!Number.isFinite(saved.scrollY)||saved.scrollY<0)return null;
      return {url:url.href,search:saved.search.slice(0,1000),scrollY:Math.min(saved.scrollY,1e7)};
    }catch(_){return null;}
  }
  const windowLoaded=document.readyState==='complete'?Promise.resolve():new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
  const fontsReady=document.fonts?.ready||Promise.resolve();

  if(isArchive){
    const search=document.querySelector('#art-search');
    document.addEventListener('click',event=>{
      if(!normalClick(event)||!(event.target instanceof Element))return;
      const link=event.target.closest('.archive-work a');
      if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
      const destination=new URL(link.href,location.href);
      if(destination.origin!==location.origin||destination.protocol!==location.protocol)return;
      writeStorage(archiveKey,JSON.stringify({url:location.href,search:search?.value||'',scrollY:window.scrollY}));
    },{capture:true});

    const requested=readStorage(restoreKey);
    removeStorage(restoreKey);
    const saved=archiveState(new URL(location.href));
    const navigation=performance.getEntriesByType('navigation')[0];
    if(requested&&saved&&requested===saved.url&&saved.url===location.href&&navigation?.type!=='back_forward'){
      if(search){search.value=saved.search;search.dispatchEvent(new Event('input',{bubbles:true}));}
      let userInteracted=false;
      const cancelRestore=()=>{userInteracted=true;};
      const cancelForKey=event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))cancelRestore();};
      window.addEventListener('wheel',cancelRestore,{passive:true});
      window.addEventListener('touchstart',cancelRestore,{passive:true});
      window.addEventListener('pointerdown',cancelRestore,{passive:true});
      window.addEventListener('keydown',cancelForKey);
      Promise.all([windowLoaded,fontsReady]).then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(!userInteracted)window.scrollTo({top:saved.scrollY,left:0,behavior:'instant'});
        window.removeEventListener('wheel',cancelRestore);
        window.removeEventListener('touchstart',cancelRestore);
        window.removeEventListener('pointerdown',cancelRestore);
        window.removeEventListener('keydown',cancelForKey);
      })));
    }
  }

  if(!isWork)return;
  const navigation=document.querySelector('.work-navigation');
  const navigationLinks=navigation?[...navigation.querySelectorAll('a')]:[];
  const index=navigationLinks.find(link=>link.textContent.trim().toLowerCase()==='index');
  if(index){
    const expected=new URL(index.href,location.href);
    const saved=archiveState(expected);
    if(saved){
      index.href=saved.url;
      index.addEventListener('click',event=>{
        if(normalClick(event))writeStorage(restoreKey,saved.url);
      });
    }
  }
  document.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.defaultPrevented||event.repeat||event.isComposing||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
    if(document.querySelector('dialog[open]')||document.fullscreenElement)return;
    const menu=document.querySelector('#site-menu');
    if(menu&&!menu.hidden)return;
    const target=event.target instanceof Element?event.target:document.activeElement;
    if(target&&(target.isContentEditable||target.closest('input,textarea,select,button,video,audio,[role="slider"],[role="textbox"],[role="combobox"]')))return;
    const label=event.key==='ArrowLeft'?'previous':'next';
    const link=navigationLinks.find(anchor=>anchor.textContent.trim().toLowerCase()===label);
    if(!link)return;
    const destination=new URL(link.href,location.href);
    if(destination.origin!==location.origin||destination.protocol!==location.protocol)return;
    event.preventDefault();location.assign(destination.href);
  });

  const progress=document.createElement('div');
  progress.className='reading-progress';progress.setAttribute('aria-hidden','true');
  document.body.append(progress);
  let progressFrame=0;
  function updateProgress(){
    progressFrame=0;
    const range=document.documentElement.scrollHeight-innerHeight;
    const amount=range>0?Math.max(0,Math.min(1,window.scrollY/range)):0;
    progress.style.transform=`scaleX(${amount})`;
  }
  function scheduleProgress(){if(!progressFrame)progressFrame=requestAnimationFrame(updateProgress);}
  window.addEventListener('scroll',scheduleProgress,{passive:true});
  window.addEventListener('resize',scheduleProgress,{passive:true});
  [...document.images].forEach(image=>image.addEventListener('load',scheduleProgress,{passive:true}));
  Promise.all([windowLoaded,fontsReady]).then(scheduleProgress);scheduleProgress();
})();
