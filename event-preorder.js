'use strict';
const $ = selector => document.querySelector(selector);
const form = $('#order-form'), quantity = $('#quantity'), dateInput = $('#requested-date'), review = $('#review');
let pendingOrder = null, sending = false;
const money = value => new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(value);
const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const prettyDate = value => new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Lagos',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(value+'T12:00:00Z'));
function update(){
 dateInput.min = today();
 const count=Number(quantity.value), valid=Number.isInteger(count)&&count>=1&&count<=1000;
 $('#total').textContent=valid?money(count*1500):'—';
 $('#quantity-summary').textContent=valid?`${count} meatpie${count===1?'':'s'}`:'Enter a quantity from 1 to 1,000';
 $('#minus').disabled=valid&&count<=1;$('#plus').disabled=valid&&count>=1000;
 $('#date-display').textContent=dateInput.value?prettyDate(dateInput.value):'Choose a date to see the day of the week.';
 const transfer=form.elements.payment.value==='Bank transfer';$('#bank-details').hidden=!transfer;$('#later-details').hidden=transfer;
}
for(const [id,delta] of [['minus',-1],['plus',1]])$('#'+id).addEventListener('click',()=>{quantity.value=Math.max(1,Math.min(1000,(Number(quantity.value)||1)+delta));update();});
form.addEventListener('input',update);form.addEventListener('change',update);
for(const input of [form.elements.name,form.elements.phone,dateInput])input.addEventListener('input',()=>input.setCustomValidity(''));
function getDetails(){return {name:form.elements.name.value.trim(),phone:form.elements.phone.value.replace(/[\s()-]/g,''),quantity:Number(quantity.value),payment:form.elements.payment.value,requestedDate:dateInput.value};}
function validate(){
 const d=getDetails();dateInput.min=today();
 form.elements.name.setCustomValidity(d.name.length>=2?'':'Please enter your full name.');
 form.elements.phone.setCustomValidity(/^(0[789]\d{9}|\+?234[789]\d{9})$/.test(d.phone)?'':'Enter a Nigerian phone number, such as 08012345678.');
 dateInput.setCustomValidity(d.requestedDate&&d.requestedDate>=today()?'':'Choose today or a future date.');
 return form.reportValidity();
}
$('#copy-account').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('8148124675');$('#status').textContent='Account number copied.';}catch{$('#status').textContent='Account number: 8148124675. Select and copy it manually.';}});
form.addEventListener('submit',event=>{
 event.preventDefault();if(!validate())return;const d=getDetails();
 $('#review-name').textContent=d.name;$('#review-phone').textContent=d.phone;$('#review-date').textContent=prettyDate(d.requestedDate);$('#review-payment').textContent=d.payment;
 $('#review-quantity').textContent=`${d.quantity} × ${money(1500)}`;$('#review-total').textContent=money(d.quantity*1500);$('#review-status').textContent='';review.showModal();$('#send-order').focus();
});
for(const id of ['close-review','edit-order'])$('#'+id).addEventListener('click',()=>{if(!sending)review.close();});
review.addEventListener('cancel',event=>{if(sending)event.preventDefault();});
$('#send-order').addEventListener('click',async()=>{
 if(sending||!validate())return;
 const details=getDetails(),signature=JSON.stringify(details);
 if(!pendingOrder||pendingOrder.signature!==signature)pendingOrder={signature,orderId:crypto.randomUUID()};
 const button=$('#send-order');sending=true;review.querySelectorAll('button').forEach(b=>b.disabled=true);button.textContent='Saving your order…';$('#review-status').textContent='';
 try{
  if(location.protocol==='file:')throw new Error('Please use the live website to submit your order.');
  const response=await fetch('/api/event-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...details,orderId:pendingOrder.orderId}),signal:AbortSignal.timeout(30000)});
  const result=await response.json();
  if(!response.ok||result.ok!==true||result.orderId!==pendingOrder.orderId||result.requestedDate!==details.requestedDate)throw new Error(result.error||'Your order has not been confirmed. Please retry.');
  $('#success-date').textContent=prettyDate(details.requestedDate);$('#success-items').textContent=`${details.quantity} meatpie${details.quantity===1?'':'s'} · ${money(details.quantity*1500)}`;
  $('#success-payment').textContent=details.payment==='Pay later'?'Pay later selected · Payment outstanding':'Bank transfer selected · Awaiting payment verification';$('#success-reference').textContent=result.orderId;
  review.close();$('#order-page').hidden=true;$('#success-page').hidden=false;document.title='Order received | ZCAS TastyBites';window.scrollTo(0,0);$('#success-title').focus({preventScroll:true});
 }catch(error){$('#review-status').textContent=error.name==='TimeoutError'?'Confirmation timed out. Retry with the same details to avoid a duplicate order.':error.message;}
 finally{sending=false;review.querySelectorAll('button').forEach(b=>b.disabled=false);button.textContent='Confirm & submit order →';}
});
$('#order-again').addEventListener('click',()=>{form.reset();pendingOrder=null;for(const input of [form.elements.name,form.elements.phone,dateInput])input.setCustomValidity('');$('#status').textContent='';$('#success-page').hidden=true;$('#order-page').hidden=false;document.title='Meat Pie Order | ZCAS TastyBites';update();window.scrollTo(0,0);form.elements.name.focus({preventScroll:true});});
update();
