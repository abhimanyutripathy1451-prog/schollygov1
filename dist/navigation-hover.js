(() => {
 const desktop=window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 761px)');
 const items=[...document.querySelectorAll('.header .nav-dropdown')];
 let closeTimer;
 function close(item){item.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded','false');item.querySelector('.nav-dropdown-panel').hidden=true}
 function open(item){clearTimeout(closeTimer);items.forEach(other=>{if(other!==item)close(other)});item.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded','true');item.querySelector('.nav-dropdown-panel').hidden=false}
 items.forEach(item=>{
  item.addEventListener('pointerenter',()=>{if(desktop.matches)open(item)});
  item.addEventListener('pointerleave',()=>{if(desktop.matches){clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(!item.contains(document.activeElement))close(item)},160)}});
  item.querySelector('.nav-dropdown-trigger').addEventListener('click',event=>{if(desktop.matches&&event.detail>0){event.stopImmediatePropagation();open(item)}},true);
 });
 desktop.addEventListener('change',()=>{clearTimeout(closeTimer);items.forEach(close)});
})();
