'use strict';
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({ok:false,error:'Use POST.'}); }
  const url = process.env.GOOGLE_ORDERS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyKF4_O26qqLHieAYphElHjeRuVWm7Pe3JQXnq7TKb2ShGnjUeQIKMWY7OsmetBSksfiw/exec';
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) return res.status(503).json({ok:false,error:'Pre-orders are not open yet. Please try again later.'});
  try {
    const order = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!order || JSON.stringify(order).length > 4096) return res.status(400).json({ok:false,error:'Invalid order.'});
    const payload = {orderId:order.orderId,name:String(order.name||'').trim(),phone:String(order.phone||'').replace(/[\s()-]/g,''),quantity:Number(order.quantity),payment:order.payment,requestedDate:String(order.requestedDate||'')};
    if (!/^[a-f0-9-]{36}$/i.test(payload.orderId||'') || payload.name.length<2 || payload.name.length>100 || !/^(0[789]\d{9}|\+?234[789]\d{9})$/.test(payload.phone) || !Number.isInteger(payload.quantity) || payload.quantity<1 || payload.quantity>1000 || !['Bank transfer','Pay later'].includes(payload.payment)) return res.status(400).json({ok:false,error:'Check your name, Nigerian phone number, quantity and payment choice.'});
    const parsedDate = new Date(payload.requestedDate+'T12:00:00Z');
    const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.requestedDate) || isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0,10)!==payload.requestedDate || payload.requestedDate<today) return res.status(400).json({ok:false,error:'Choose today or a future date for your order.'});
    // Do not send dated orders to the old receiver, which would silently discard the date.
    const healthResponse = await fetch(url,{signal:AbortSignal.timeout(8000),redirect:'follow',cache:'no-store'});
    const health = await healthResponse.json();
    if (!healthResponse.ok || health.version !== 2) return res.status(503).json({ok:false,error:'Ordering is temporarily unavailable. Please try again shortly.'});
    const response = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000),redirect:'follow'});
    const result = await response.json();
    if (!response.ok || result.ok !== true || result.orderId !== payload.orderId || result.requestedDate !== payload.requestedDate) throw new Error('Save not confirmed');
    return res.status(200).json({ok:true,orderId:result.orderId,requestedDate:result.requestedDate});
  } catch { return res.status(502).json({ok:false,error:'We could not confirm your order. Please retry without changing your details; the same order reference will prevent duplicates.'}); }
};
