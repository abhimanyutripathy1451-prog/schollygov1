const nav=document.getElementById('navigation'),menu=document.querySelector('.menu');
const dropdowns=[...document.querySelectorAll('.nav-dropdown')];
function closeDropdowns(except){dropdowns.forEach(d=>{if(d!==except){d.querySelector('button').setAttribute('aria-expanded','false');d.querySelector('.nav-dropdown-panel').hidden=true}})}
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');closeDropdowns()});
dropdowns.forEach(d=>{const button=d.querySelector('button'),panel=d.querySelector('.nav-dropdown-panel'),links=[...panel.querySelectorAll('a')];function open(){closeDropdowns(d);button.setAttribute('aria-expanded','true');panel.hidden=false}button.addEventListener('click',()=>button.getAttribute('aria-expanded')==='true'?closeDropdowns():open());button.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();open();links[0].focus()}});d.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeDropdowns();button.focus()}const i=links.indexOf(document.activeElement);if(i>=0&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();links[(i+(e.key==='ArrowDown'?1:links.length-1))%links.length].focus()}});d.addEventListener('focusout',e=>{if(!d.contains(e.relatedTarget))closeDropdowns()});links.forEach(a=>a.addEventListener('click',()=>closeDropdowns()))});
document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown'))closeDropdowns()});
document.getElementById('year').textContent=new Date().getFullYear();
const scrollTopButton=document.createElement('button');
scrollTopButton.type='button';
scrollTopButton.className='scroll-top-button';
scrollTopButton.setAttribute('aria-label','Scroll to top');
scrollTopButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 18V6M6 12l6-6 6 6"/></svg>';
document.body.appendChild(scrollTopButton);

const toggleScrollTopButton=()=>{
  if(window.scrollY > 260){
    scrollTopButton.classList.add('is-visible');
  } else {
    scrollTopButton.classList.remove('is-visible');
  }
};

toggleScrollTopButton();
window.addEventListener('scroll',toggleScrollTopButton,{passive:true});
scrollTopButton.addEventListener('click',()=>{window.scrollTo({top:0,behavior:'smooth'});});
