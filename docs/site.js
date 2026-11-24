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
  let relativeLayoutFrame=0;
  function isShown(element){return !element.closest('[hidden]')&&element.getClientRects().length>0;}
  function positiveNumber(value,fallback){const number=Number(value);return Number.isFinite(number)&&number>0?number:fallback;}
  function layoutRelativePreviews(){
    const ceiling=positiveNumber(document.body.dataset.physicalCeiling,3.8);
    const maxWidth=positiveNumber(document.body.dataset.physicalMaxWidth,80);
    const maxHeight=positiveNumber(document.body.dataset.physicalMaxHeight,120);
    const mobile=innerWidth<=900;
    const contexts=[...document.querySelectorAll('[data-physical-context]')].filter(isShown);
    const physicalItems=context=>[...context.querySelectorAll('[data-physical-long-cm]')].filter(isShown);
    const archives=contexts.filter(context=>context.dataset.physicalContext==='archive');
    const archiveWidths=archives.flatMap(context=>[...context.querySelectorAll('.archive-work')].filter(isShown).map(card=>card.clientWidth)).filter(width=>width>0);
    if(mobile)archiveWidths.push(innerWidth*.78);
    const archiveUnit=Math.max(.01,Math.min(ceiling,...archiveWidths.map(width=>width/maxWidth)));
    for(const context of contexts){
      const kind=context.dataset.physicalContext;
      const items=physicalItems(context);
      let unit=ceiling;
      if(kind==='archive'){
        unit=archiveUnit;
      }else if(kind==='cover'&&!mobile){
        const css=getComputedStyle(context);
        const columns=css.gridTemplateColumns.split(/\s+/).map(parseFloat).filter(Number.isFinite);
        const gap=parseFloat(css.rowGap)||0;
        const contentHeight=context.clientHeight-(parseFloat(css.paddingTop)||0)-(parseFloat(css.paddingBottom)||0);
        const right=items.filter(item=>item.classList.contains('cover-landscape'));
        const left=items.filter(item=>item.classList.contains('cover-lead'));
        const rightHeight=right.reduce((sum,item)=>sum+positiveNumber(item.dataset.previewHeightUnits,1),0);
        const rightCaptions=right.reduce((sum,item)=>sum+(item.querySelector('.cover-caption')?.offsetHeight||0),0);
        const widthLimits=items.map(item=>{
          const column=item.classList.contains('cover-lead')?0:1;
          const available=columns[column]||item.clientWidth||context.clientWidth;
          return available/positiveNumber(item.dataset.previewWidthUnits,maxWidth);
        });
        const heightLimits=[];
        if(rightHeight)heightLimits.push((contentHeight-rightCaptions-gap*Math.max(0,right.length-1))/rightHeight);
        left.forEach(item=>heightLimits.push((contentHeight-(item.querySelector('.cover-caption')?.offsetHeight||0))/positiveNumber(item.dataset.previewHeightUnits,maxHeight)));
        unit=Math.min(ceiling,...widthLimits,...heightLimits);
      }else{
        const availableWidth=Math.min(context.clientWidth,mobile?innerWidth*.78:Infinity);
        const availableHeight=Math.max(1,innerHeight-(mobile?300:220));
        unit=Math.min(ceiling,availableWidth/maxWidth,availableHeight/maxHeight);
      }
      context.style.setProperty('--physical-unit',Math.max(.01,unit).toFixed(6)+'px');
    }
    const documentationMode=document.body.dataset.archiveMode==='documentation';
    // Equalise only media within each actual grid row. A series can start a
    // new row, and filtering can move cards, so array chunks are not rows.
    for(const context of archives){
      const cards=[...context.querySelectorAll('.archive-work')].filter(isShown);
      cards.forEach(card=>{const media=card.querySelector('.archive-media');if(media)media.style.height='auto';});
      if(documentationMode)continue;
      const rows=[];
      cards.forEach(card=>{
        const top=card.offsetTop;
        let row=rows.find(value=>Math.abs(value.top-top)<1);
        if(!row){row={top,cards:[]};rows.push(row);}
        row.cards.push(card);
      });
      rows.forEach(row=>{
        const height=Math.max(0,...row.cards.map(card=>{const image=card.querySelector('.archive-media img');return image?(parseFloat(getComputedStyle(image).height)||image.clientHeight):0;}));
        row.cards.forEach(card=>{const media=card.querySelector('.archive-media');if(media&&height)media.style.height=height.toFixed(3)+'px';});
      });
    }
    // Type follows the visible image, while a minimum reading width keeps
    // small canvases legible. The whole caption stays on the image centre.
    document.querySelectorAll('.archive-work,.cover-work,.work-frame.physical-preview').forEach(item=>{
      if(!isShown(item))return;
      const image=item.querySelector('img');if(!image)return;
      const width=parseFloat(getComputedStyle(image).width)||image.clientWidth;
      const available=Math.min(item.clientWidth,mobile?innerWidth*.78:Infinity);
      const physical=item.hasAttribute('data-physical-long-cm');
      const captionWidth=Math.min(available,physical?Math.max(160,width):width);
      const titleSize=physical?Math.max(14,Math.min(17,14+(width-160)/50)):17;
      item.style.setProperty('--caption-width',captionWidth.toFixed(2)+'px');
      item.style.setProperty('--caption-title-size',titleSize.toFixed(2)+'px');
      item.style.setProperty('--caption-meta-size',physical&&width<210?'12px':'13px');
    });
    const anyPhysical=contexts.some(context=>physicalItems(context).length>0);
    document.querySelectorAll('[data-relative-scale-note]').forEach(note=>{note.hidden=!anyPhysical;});
  }
  function scheduleRelativeLayout(){
    if(relativeLayoutFrame)return;
    relativeLayoutFrame=requestAnimationFrame(()=>{relativeLayoutFrame=0;layoutRelativePreviews();});
  }
  window.addEventListener('resize',scheduleRelativeLayout,{passive:true});
  window.addEventListener('orientationchange',scheduleRelativeLayout,{passive:true});
  document.fonts?.ready.then(scheduleRelativeLayout);
  [...document.images].forEach(image=>image.addEventListener('load',scheduleRelativeLayout,{passive:true}));
  scheduleRelativeLayout();
  function updateArchive(){
    if(!entries.length)return;
    document.body.dataset.archiveMode=['installation','video','photography','performance'].includes(category)?'documentation':'artworks';
    const query=search.value.trim().toLocaleLowerCase();const projects=new Set();
    entries.forEach(entry=>{const show=(category==='all'||entry.dataset.category.split(' ').includes(category))&&(!query||entry.dataset.search.includes(query));entry.hidden=!show;if(show)projects.add(entry.dataset.workId||entry.querySelector('a')?.getAttribute('href')||entry);});
    const count=projects.size;
    document.querySelectorAll('.year-group').forEach(group=>{const visible=[...group.querySelectorAll('.archive-work')].filter(entry=>!entry.hidden);group.hidden=visible.length===0;group.querySelector('.year-works').classList.toggle('few-works',visible.length<=3);});
    document.querySelector('#result-count').textContent=`${count} ${count===1?'work':'works'}`;
    document.querySelector('#empty-state').hidden=count!==0;
    document.querySelectorAll('.category-link,.all-works-link').forEach(link=>{if((link.dataset.category||'all')===category)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    scheduleRelativeLayout();
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
