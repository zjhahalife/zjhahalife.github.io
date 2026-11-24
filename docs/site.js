(() => {
  'use strict';
  const menu=document.querySelector('#site-menu');
  const toggles=[...document.querySelectorAll('.menu-toggle')];
  let menuOpener;
  function closeMenu(restoreFocus=false){menu.hidden=true;toggles.forEach(button=>button.setAttribute('aria-expanded','false'));if(restoreFocus)menuOpener?.focus();}
  toggles.forEach(button=>button.addEventListener('click',()=>{const open=menu.hidden;if(open)menuOpener=button;menu.hidden=!open;toggles.forEach(toggle=>toggle.setAttribute('aria-expanded',String(open)));}));
  document.addEventListener('click',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!toggles.some(button=>button.contains(event.target)))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden)closeMenu(true);});
  const entries=[...document.querySelectorAll('.archive-work')];
  const search=document.querySelector('#art-search');
  let category=new URLSearchParams(location.search).get('category')||'all';
  if(!['all','painting','installation','photography','books','video','performance'].includes(category))category='all';
  function updateArchive(){
    if(!entries.length)return;
    const query=search.value.trim().toLocaleLowerCase();let count=0;
    entries.forEach(entry=>{const show=(category==='all'||entry.dataset.category.split(' ').includes(category))&&(!query||entry.dataset.search.includes(query));entry.hidden=!show;if(show)count++;});
    document.querySelectorAll('.year-group').forEach(group=>{const visible=[...group.querySelectorAll('.archive-work')].filter(entry=>!entry.hidden);group.hidden=visible.length===0;group.querySelector('.year-works').classList.toggle('few-works',visible.length<=3);});
    document.querySelector('#result-count').textContent=`${count} ${count===1?'work':'works'}`;
    document.querySelector('#empty-state').hidden=count!==0;
    document.querySelectorAll('.category-link,.all-works-link').forEach(link=>{if((link.dataset.category||'all')===category)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  }
  if(entries.length){
    document.querySelectorAll('.category-link,.all-works-link').forEach(link=>link.addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;if(link.getAttribute('href').split('?')[0].endsWith('books.html'))return;event.preventDefault();category=link.dataset.category||'all';search.value='';try{history.replaceState({},'',category==='all'?location.pathname:`?category=${category}`);}catch(_){}updateArchive();closeMenu();window.scrollTo({top:0,behavior:'instant'});}));
    search.addEventListener('input',updateArchive);updateArchive();
  }
  const information=document.querySelector('.work-information');
  if(information){
    const sizeInformation=()=>information.classList.toggle('information-long',information.scrollHeight>innerHeight-125);
    sizeInformation();document.fonts?.ready.then(sizeInformation);window.addEventListener('resize',sizeInformation,{passive:true});
  }
  const dialog=document.querySelector('#lightbox');if(!dialog)return;
  const images=[...document.querySelectorAll('[data-zoom]')];let active=0,opener;
  function sizeZoom(){if(!dialog.open)return;const stage=dialog.querySelector('.lightbox-stage'),image=dialog.querySelector('img'),artwork=dialog.querySelector('.lightbox-artwork');if(!image.naturalWidth)return;const css=getComputedStyle(stage),width=stage.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight),height=stage.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom),maximum=Number(image.dataset.displayMaxWidth)||image.naturalWidth,scale=Math.min(1,maximum/image.naturalWidth,width/image.naturalWidth,height/image.naturalHeight);artwork.style.width=Math.floor(image.naturalWidth*scale)+'px';artwork.style.height=Math.floor(image.naturalHeight*scale)+'px';}
  dialog.querySelector('img').addEventListener('load',sizeZoom);window.addEventListener('resize',sizeZoom);
  function show(index){active=index;const image=dialog.querySelector('img'),source=images[index].querySelector('img');image.src=images[index].dataset.zoom;image.alt=source.alt;image.dataset.displayMaxWidth=source.dataset.displayMaxWidth||'';dialog.querySelector('[data-position]').textContent=`${index+1} / ${images.length}`;dialog.querySelector('[data-prev]').disabled=index===0;dialog.querySelector('[data-next]').disabled=index===images.length-1;requestAnimationFrame(sizeZoom);}
  images.forEach((button,index)=>button.addEventListener('click',()=>{opener=button;show(index);dialog.showModal();document.body.classList.add('locked');requestAnimationFrame(sizeZoom);}));
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{document.body.classList.remove('locked');opener?.focus();});
  dialog.querySelector('[data-prev]').addEventListener('click',()=>{if(active>0)show(active-1);});dialog.querySelector('[data-next]').addEventListener('click',()=>{if(active<images.length-1)show(active+1);});
  let touchStart;
  const stage=dialog.querySelector('.lightbox-stage');
  stage.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')touchStart={x:event.clientX,y:event.clientY};});
  stage.addEventListener('pointerup',event=>{if(!touchStart||event.pointerType!=='touch')return;const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;touchStart=undefined;if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.5)return;if(dx<0&&active<images.length-1)show(active+1);if(dx>0&&active>0)show(active-1);});
  stage.addEventListener('pointercancel',()=>{touchStart=undefined;});
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'&&active>0){event.preventDefault();show(active-1);}if(event.key==='ArrowRight'&&active<images.length-1){event.preventDefault();show(active+1);}});
})();
