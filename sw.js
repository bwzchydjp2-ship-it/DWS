/* DWS service worker: كاش للتطبيق + إشعارات */
var CACHE='dws-shell-v1';
var SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL)}).catch(function(){}));
  self.skipWaiting();
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
/* الصفحة: الشبكة أولاً، وإذا ما في نت من الكاش. الباقي (فايربيس وغيره) ما ننتقل عليه */
self.addEventListener('fetch',function(e){
  var r=e.request;
  if(r.method!=='GET')return;
  var u=new URL(r.url);
  if(u.origin!==location.origin)return;
  e.respondWith(fetch(r).then(function(res){
    if(res&&res.ok){var cp=res.clone();caches.open(CACHE).then(function(c){c.put(r,cp)})}
    return res;
  }).catch(function(){return caches.match(r).then(function(m){return m||caches.match('./index.html')})}));
});
/* إشعار قادم من السيرفر (FCM أو أي Web Push) */
self.addEventListener('push',function(e){
  var d={};try{d=e.data?e.data.json():{}}catch(x){try{d={body:e.data.text()}}catch(y){}}
  var n=d.notification||d;
  e.waitUntil(self.registration.showNotification(n.title||'رد جديد 📮',{
    body:n.body||'وصلك رد جديد بصندوق الردود',
    icon:'icon-192.png',badge:'icon-192.png',tag:'dws-reply',renotify:true,dir:'rtl',lang:'ar',
    data:{url:(d.data&&d.data.url)||'./#replies'}
  }));
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  var url=(e.notification.data&&e.notification.data.url)||'./#replies';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    for(var i=0;i<cs.length;i++){var c=cs[i];if('focus' in c){c.focus();try{c.navigate(url)}catch(x){}return}}
    return self.clients.openWindow(url);
  }));
});
