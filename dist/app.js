const services={"ai":{"label":"AI solutions","summary":"Knowledge assistants & intelligent experiences","kicker":"PUT YOUR KNOWLEDGE TO WORK","title":"Useful AI.\nBuilt for your business.","description":"Create AI assistants and intelligent applications grounded in your approved information. We start with a focused use case, assess data readiness, and design an experience that keeps people in control.","tags":["Generative AI","Knowledge retrieval","AI integrations"],"deliverables":["A use-case assessment and prototype to validate the idea.","Document retrieval, source references, and access-aware integrations.","Evaluation of answer quality, limitations, and human-review needs."],"starting":"Start with one repeatable task or a knowledge source your team relies on.","cta":"Discuss your AI use case","interest":"AI development","left":"YOUR KNOWLEDGE","right":"USEFUL ANSWERS","symbol":"✳"},"applications":{"label":"Custom app development","summary":"Applications shaped around your workflow","kicker":"SOFTWARE THAT FITS THE WAY YOU WORK","title":"Your process.\nYour application.","description":"Build web applications, internal portals, and business tools around your users and operations. We translate requirements into intuitive interfaces, connected data, and maintainable application logic.","tags":["Web applications","Business portals","API integrations"],"deliverables":["User journeys, feature priorities, and interactive prototypes.","Application development with roles, workflows, and system connections.","Testing, deployment planning, and technical handover."],"starting":"Bring a process that spreadsheets or off-the-shelf tools no longer serve well.","cta":"Plan your application","interest":"Custom App Development","left":"YOUR WORKFLOW","right":"CUSTOM SOFTWARE","symbol":"⌘"},"consulting":{"label":"BI consulting (Oracle)","summary":"Clearer reporting & better-informed decisions","kicker":"TURN BUSINESS DATA INTO DIRECTION","title":"Connected data.\nClearer decisions.","description":"Plan Oracle-focused business intelligence around the questions your teams need to answer. We review reporting needs, source systems, and existing architecture before recommending a practical way forward.","tags":["Oracle BI","Data modelling","Dashboards & reporting"],"deliverables":["A review of reporting requirements, data sources, and current gaps.","KPI definitions, data-model recommendations, and dashboard planning.","A scoped implementation or improvement roadmap for your environment."],"starting":"Start with the reports, metrics, or data bottlenecks that slow decisions.","cta":"Discuss your BI needs","interest":"BI Consulting (Oracle)","left":"BUSINESS DATA","right":"CLEAR INSIGHT","symbol":"▥"},"software":{"label":"Product engineering","summary":"From a validated idea to a usable product","kicker":"BUILD THE PRODUCT. PLAN FOR ITS FUTURE.","title":"From first concept\nto the next release.","description":"Bring product thinking, user experience, and software engineering together. We help define a useful first release, validate it with users, and develop a product that can evolve with feedback.","tags":["Product discovery","UX & engineering","Release planning"],"deliverables":["A prioritised product backlog and a clear first-release scope.","Prototypes, application architecture, and iterative development.","Quality checks, launch preparation, and an improvement plan."],"starting":"Bring a new product idea or an existing experience that needs to evolve.","cta":"Explore your product idea","interest":"Product engineering","left":"YOUR VISION","right":"WORKING PRODUCT","symbol":"◇"},"automation":{"label":"Intelligent automation","summary":"Connected systems, fewer repetitive steps","kicker":"MAKE SPACE FOR MORE MEANINGFUL WORK","title":"Less manual work.\nMore connected operations.","description":"Connect tools and automate routine steps such as capturing enquiries, routing requests, and preparing reports. We map the process first, then build around the APIs, permissions, and exceptions involved.","tags":["Workflow automation","System integrations","Human approvals"],"deliverables":["A process map identifying automation opportunities and exceptions.","Connected workflows with validation and approval steps where needed.","Error handling, monitoring requirements, and operating guidance."],"starting":"Start with a frequent, rules-based task that involves more than one system.","cta":"Map your workflow","interest":"Intelligent automation","left":"REPETITIVE TASKS","right":"CONNECTED WORK","symbol":"⇄"},"marketing":{"label":"Digital marketing","summary":"A clearer message & a measurable plan","kicker":"CONNECT YOUR OFFERING WITH YOUR AUDIENCE","title":"Get discovered.\nMake the next step clear.","description":"Align your digital presence with your business goals. We help shape a focused approach to website content, search visibility, campaign planning, and the customer journey from interest to enquiry.","tags":["Content strategy","Search visibility","Campaign planning"],"deliverables":["An audience, positioning, and digital-presence review.","Content and campaign recommendations with clear priorities.","A measurement plan for enquiries, engagement, and conversion."],"starting":"Bring a service or product that needs a stronger digital introduction.","cta":"Discuss your growth goals","interest":"Digital Marketing","left":"YOUR OFFERING","right":"RIGHT AUDIENCE","symbol":"↗"}};
// Progress reflects readiness of the document, logo, and typography.
(() => {
  const loader=document.getElementById('preloader');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const started=performance.now();
  const minimum=reduced?0:3500;
  let done=false,progress=0,ready=0;
  const fill=document.getElementById('loader-fill');
  const meter=document.getElementById('loader-progress');
  const word=document.getElementById('loader-word');
  const stage=document.getElementById('loader-stage');
  const content=[...document.querySelectorAll('body > header, body > main, body > footer, body > .skip')];
  content.forEach(el=>{el.inert=true;el.setAttribute('data-loader-inert','')});
  function dismiss(){if(done)return;done=true;clearInterval(tick);progress=100;render();word.textContent='ready';stage.textContent='LET’S BUILD WHAT’S NEXT';loader.classList.add('is-complete');document.documentElement.classList.remove('is-loading');content.forEach(el=>{el.inert=false;el.removeAttribute('data-loader-inert')});if(loader.contains(document.activeElement))document.querySelector('.header .brand').focus();setTimeout(()=>{loader.hidden=true},reduced?0:650)}
  function render(){fill.style.width=`${progress}%`;meter.setAttribute('aria-valuenow',String(progress));document.getElementById('loader-percent').textContent=`${progress}%`}
  const tick=setInterval(()=>{const elapsed=performance.now()-started;const target=Math.round(ready/3*100);progress=Math.min(target,Math.round(elapsed/Math.max(minimum,1)*100));if(progress>=45&&progress<100)word.textContent='engineering';render();if(ready===3&&elapsed>=minimum)dismiss()},40);
  const documentReady=document.readyState==='complete'?Promise.resolve():new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
  const logo=loader.querySelector('img');
  const logoReady=logo.complete?Promise.resolve():new Promise(resolve=>{logo.addEventListener('load',resolve,{once:true});logo.addEventListener('error',resolve,{once:true})});
  [documentReady,logoReady,document.fonts?document.fonts.ready:Promise.resolve()].forEach(p=>Promise.resolve(p).then(()=>ready++,()=>ready++));
  document.getElementById('loader-skip').addEventListener('click',dismiss);
  // A slow external font must never prevent access to the site.
  setTimeout(dismiss,reduced?500:5000);
})();
const tabs=[...document.querySelectorAll('[role="tab"]')];
function selectService(tab){
 tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1});
 const s=services[tab.dataset.service];
 document.getElementById('service-kicker').textContent=s.kicker;
 const title=document.getElementById('service-title');title.replaceChildren(...s.title.split('\n').flatMap((part,i)=>i?[document.createElement('br'),document.createTextNode(part)]:[document.createTextNode(part)]));
 document.getElementById('service-description').textContent=s.description;
 document.getElementById('service-tags').replaceChildren(...s.tags.map(text=>{const span=document.createElement('span');span.textContent=text;return span}));
 document.getElementById('service-deliverables').replaceChildren(...s.deliverables.map(text=>{const li=document.createElement('li');li.textContent=text;return li}));
 document.getElementById('service-starting').textContent=s.starting;
 const detailPages={applications:{url:'/services/custom-app-development.html',label:'Explore custom app development'},marketing:{url:'/services/digital-marketing.html',label:'Explore digital marketing'}};
 document.getElementById('service-cta-label').textContent=detailPages[tab.dataset.service]?.label||s.cta;
 document.getElementById('service-cta').href=detailPages[tab.dataset.service]?.url||`/contact.html?service=${tab.dataset.service}`;
 document.getElementById('service-cta').dataset.projectInterest=s.interest;
 document.querySelector('.panel-visual .tag-left').textContent=s.left;
 document.querySelector('.panel-visual .tag-right').textContent=s.right;
 document.querySelector('.panel-visual .diagram-node').textContent=s.symbol;
 document.getElementById('service-panel').setAttribute('aria-labelledby',tab.id);
}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectService(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowDown'||e.key==='ArrowRight')next=(i+1)%tabs.length;if(e.key==='ArrowUp'||e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();selectService(tabs[next]);tabs[next].focus()}})});
const menu=document.querySelector('.menu');const nav=document.getElementById('navigation');function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation')};menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation')});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu()}});
const companyTrigger=document.getElementById('company-trigger');
const companyOptions=document.getElementById('company-options');
const dropdowns=[...document.querySelectorAll('.nav-dropdown')];
function closeDropdowns(except){dropdowns.forEach(dropdown=>{if(dropdown===except)return;dropdown.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded','false');dropdown.querySelector('.nav-dropdown-panel').hidden=true})}
function closeCompanyMenu(){closeDropdowns()}
dropdowns.forEach(dropdown=>{const trigger=dropdown.querySelector('.nav-dropdown-trigger');const panel=dropdown.querySelector('.nav-dropdown-panel');const links=[...panel.querySelectorAll('a')];
  function open(){closeDropdowns(dropdown);trigger.setAttribute('aria-expanded','true');panel.hidden=false}
  trigger.addEventListener('click',()=>{if(trigger.getAttribute('aria-expanded')==='true')closeDropdowns();else open()});
  trigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();open();links[event.key==='ArrowDown'?0:links.length-1].focus()}});
  panel.addEventListener('keydown',event=>{const i=links.indexOf(document.activeElement);let next;if(event.key==='ArrowDown')next=(i+1)%links.length;if(event.key==='ArrowUp')next=(i+links.length-1)%links.length;if(event.key==='Home')next=0;if(event.key==='End')next=links.length-1;if(next!==undefined){event.preventDefault();links[next].focus()}});
  dropdown.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopImmediatePropagation();closeDropdowns();trigger.focus()}});
  dropdown.addEventListener('focusout',event=>{if(!dropdown.contains(event.relatedTarget)){trigger.setAttribute('aria-expanded','false');panel.hidden=true}});
  links.forEach(link=>link.addEventListener('click',()=>closeDropdowns()));
});
document.addEventListener('click',event=>{if(!event.target.closest('.nav-dropdown'))closeDropdowns()});
menu.addEventListener('click',()=>closeDropdowns());
document.querySelectorAll('[data-service-link]').forEach(link=>link.addEventListener('click',()=>{
  selectService(document.getElementById(`tab-${link.dataset.serviceLink}`));
  const audience=link.dataset.aiAudience;
  if(audience){document.getElementById('service-kicker').textContent=audience==='students'?'AI FOR STUDENTS':'AI FOR SCHOOLS';document.getElementById('service-description').textContent=audience==='students'?'Explore AI-powered learning experiences, study assistants, and tools designed to help students understand more and build confidence. Talk to us about developing a solution for your learners.':'Explore AI-powered tools for school teams, from knowledge assistants to connected workflows. Talk to us about building a solution around your institution’s needs.'}
  closeCompanyMenu();
}));
document.querySelectorAll('[data-project-interest]').forEach(link=>link.addEventListener('click',()=>{document.querySelector('#contact-form select').value=link.dataset.projectInterest}));
const requestedService=new URLSearchParams(window.location.search).get('service');
if(requestedService&&services[requestedService]){selectService(document.getElementById(`tab-${requestedService}`));document.querySelector('#contact-form select').value=services[requestedService].interest}
const requestedProduct=new URLSearchParams(window.location.search).get('product');
if(requestedProduct){const select=document.querySelector('#contact-form select');if([...select.options].some(option=>option.value===requestedProduct))select.value=requestedProduct}
document.getElementById('year').textContent=new Date().getFullYear();
document.getElementById('contact-form').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.currentTarget);const subject=`Project enquiry: ${data.get('service')}`;const body=`Hello Nexvorx,\n\n${data.get('message')}\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nInterested in: ${data.get('service')}`;window.location.href=`mailto:nexvorx@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;document.getElementById('form-status').textContent='Your email draft is ready in your email app. Please send it there to contact Nexvorx. If no app opened, email nexvorx@gmail.com directly.'});

companyOptions.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeCompanyMenu));
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
