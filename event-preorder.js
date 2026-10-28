'use strict';
let pendingOrder = null;
let sending = false;
const form = document.querySelector('#order-form');
const quantity = document.querySelector('#quantity');
const money = value => new Intl.NumberFormat('en-NG', {style:'currency',currency:'NGN',maximumFractionDigits:0}).format(value);
function updateTotal(){
 const count = Number(quantity.value);
 const valid = Number.isInteger(count) && count >= 1 && count <= 1000;
 document.querySelector('#total').textContent = valid ? money(count * 1500) : '—';
 document.querySelector('#quantity-summary').textContent = valid ? `${count} meatpie${count === 1 ? '' : 's'}` : 'Enter a quantity from 1 to 1,000';
 document.querySelector('#minus').disabled = valid && count <= 1;
 document.querySelector('#plus').disabled = valid && count >= 1000;
}
for(const [id, delta] of [['minus',-1],['plus',1]]) document.querySelector(`#${id}`).addEventListener('click',()=>{quantity.value = Math.max(1,Math.min(1000,(Number(quantity.value)||1)+delta));updateTotal();document.querySelector('#review').hidden=true;});
form.addEventListener('input',()=>{updateTotal();document.querySelector('#review').hidden=true;});
form.addEventListener('change',()=>{const transfer=form.elements.payment.value==='Bank transfer';document.querySelector('#bank-details').hidden=!transfer;document.querySelector('#later-details').hidden=transfer;});
document.querySelector('#copy-account').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('8148124675');document.querySelector('#status').textContent='Account number copied.';}catch{document.querySelector('#status').textContent='Account number: 8148124675. Select and copy it manually.';}});
form.addEventListener('submit',event=>{
 event.preventDefault();
 const name=form.elements.name.value.trim();
 const phone=form.elements.phone.value.replace(/[\s()-]/g,'');
 form.elements.name.setCustomValidity(name.length>=2?'':'Please enter your full name.');
 form.elements.phone.setCustomValidity(/^(0[789]\d{9}|\+?234[789]\d{9})$/.test(phone)?'':'Enter a Nigerian phone number, such as 08012345678 or +2348012345678.');
 if(!form.reportValidity())return;
 document.querySelector('#review-text').textContent=`${name}\n${phone}\n${quantity.value} meatpie(s) · ${money(Number(quantity.value)*1500)}\nPayment preference: ${form.elements.payment.value}\nKuje Miracle Crusade · 6 November 2026`;
 document.querySelector('#send-order').hidden=false;
 document.querySelector('#form-pending').textContent='Review your details, then submit your pre-order. Payment is verified separately.';
 document.querySelector('#review').hidden=false;
 document.querySelector('#review').scrollIntoView({behavior:'smooth',block:'nearest'});
});
for(const input of [form.elements.name,form.elements.phone])input.addEventListener('input',()=>input.setCustomValidity(''));
updateTotal();

document.querySelector('#send-order').addEventListener('click',async()=>{
 if(sending || !form.reportValidity())return;
 const details={name:form.elements.name.value.trim(),phone:form.elements.phone.value.replace(/[\s()-]/g,''),quantity:Number(quantity.value),payment:form.elements.payment.value};
 const signature=JSON.stringify(details);
 if(!pendingOrder || pendingOrder.signature!==signature)pendingOrder={signature,orderId:crypto.randomUUID()};
 const button=document.querySelector('#send-order'),status=document.querySelector('#status');
 const controls=[...form.querySelectorAll('input,button')],states=controls.map(c=>c.disabled);
 controls.forEach(c=>c.disabled=true);sending=true;button.textContent='Submitting…';status.textContent='';let saved=false;
 try{
  if(location.protocol==='file:')throw new Error('This preview cannot submit orders. Submission will be available after the website is connected and published.');
  const response=await fetch('/api/event-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...details,orderId:pendingOrder.orderId}),signal:AbortSignal.timeout(25000)});
  const result=await response.json();
  if(!response.ok || result.ok!==true || result.orderId!==pendingOrder.orderId)throw new Error(result.error || 'Your order has not been confirmed. Please retry.');
  saved=true;button.hidden=true;
  document.querySelector('#form-pending').textContent='Pre-order received! Reference: '+result.orderId+'. Payment status: '+(details.payment==='Pay later'?'Unpaid — pay later selected.':'Awaiting verification.');
  status.textContent='Your pre-order has been saved. Keep your reference for enquiries.';
 }catch(error){status.textContent=error.name==='TimeoutError'?'Confirmation timed out. Retry with the same details to avoid a duplicate order.':error.message;}
 finally{sending=false;if(!saved)controls.forEach((c,i)=>c.disabled=states[i]);button.textContent='Submit pre-order →';}
});
