(() => {
 const widget=document.querySelector('.contact-widget');
 const launcher=widget.querySelector('.contact-launcher');
 const panel=document.getElementById('contact-popover');
 const closeButton=widget.querySelector('.contact-popover-close');
 function close(restoreFocus=false){panel.hidden=true;launcher.setAttribute('aria-expanded','false');if(restoreFocus)launcher.focus()}
 launcher.addEventListener('click',()=>{if(panel.hidden){panel.hidden=false;launcher.setAttribute('aria-expanded','true');closeButton.focus()}else close(true)});
 closeButton.addEventListener('click',()=>close(true));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();close(true)}});
 document.addEventListener('click',event=>{if(!widget.contains(event.target))close()});
 panel.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>close()));
})();
