const enquiryForm=document.getElementById('contact-form');
const query=new URLSearchParams(window.location.search);
const serviceNames={applications:'Custom App Development',ai:'AI development',consulting:'BI Consulting (Oracle)',software:'Product engineering',automation:'Intelligent automation',marketing:'Digital Marketing'};
const requested=query.get('product')||serviceNames[query.get('service')];
const serviceSelect=enquiryForm.querySelector('select');
if(requested&&[...serviceSelect.options].some(o=>o.value===requested))serviceSelect.value=requested;
enquiryForm.addEventListener('submit',event=>{event.preventDefault();const values=new FormData(enquiryForm);const subject=`Nexvorx enquiry: ${values.get('service')}`;const body=`Hello Nexvorx,\n\n${values.get('message')}\n\nName: ${values.get('name')}\nEmail: ${values.get('email')}\nInterested in: ${values.get('service')}`;window.location.href=`mailto:nexvorx@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;document.getElementById('form-status').textContent='Your email draft is ready. Review and send it in your email app. If no app opened, email nexvorx@gmail.com directly.'});
