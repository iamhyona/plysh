/* PLYSH GUIDE 목차(색인) — 2026-11-18 */
(function(){
function build(){
document.querySelectorAll('[data-toc]').forEach(function(box,bi){
  if(box.classList.contains('has-toc'))return;
  var secs=[].slice.call(box.children).filter(function(e){return e.tagName==='SECTION'&&e.querySelector('h2')});
  if(secs.length<2)return;
  var nav=document.createElement('nav');nav.className='toc';nav.setAttribute('aria-label','목차');
  var html='<div class="tt">목차</div>';
  secs.forEach(function(s,i){
    if(!s.id)s.id='s'+(i+1);
    var h=s.querySelector('h2').cloneNode(true);var n=h.querySelector('.n');if(n)n.remove();
    html+='<a class="h2" href="#'+s.id+'">'+h.textContent.trim()+'</a><div class="grp">';
    [].slice.call(s.querySelectorAll('h3')).forEach(function(h3,j){if(!h3.id)h3.id=s.id+'-'+(j+1);html+='<a class="h3" href="#'+h3.id+'">'+h3.textContent.trim()+'</a>'});
    html+='</div>';
  });
  nav.innerHTML=html;box.insertBefore(nav,box.firstChild);box.classList.add('has-toc');
  var links=[].slice.call(nav.querySelectorAll('a.h2'));
  function spy(){
    var r=box.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
    var cur=0;secs.forEach(function(s,i){if(s.getBoundingClientRect().top<140)cur=i});
    links.forEach(function(a,i){var on=i===cur;if(on!==a.classList.contains('on')){a.classList.toggle('on',on);a.nextElementSibling.classList.toggle('open',on);if(on&&nav.scrollWidth>nav.clientWidth)nav.scrollTo({left:a.offsetLeft-16,behavior:'smooth'})}});
  }
  addEventListener('scroll',spy,{passive:true});spy();
});
if(location.hash){var t=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(t)setTimeout(function(){t.scrollIntoView()},60)}
}
window.buildToc=build;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
