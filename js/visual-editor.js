/* Strawberry Faerie click-to-edit mode. Activate by adding ?edit=1 to a page URL. */
(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('edit') !== '1') return;
  document.documentElement.classList.add('sf-editing');
  const style = document.createElement('style');
  style.textContent = `
    .sf-editing [data-sf-editable] {outline: 1px dashed #cc7b91; outline-offset: 3px; cursor:text!important; border-radius:2px}
    .sf-editing [data-sf-editable]:focus {outline: 3px solid #bd5279; background: #fff8fa; color:#402832}
    #sf-editor-toolbar {position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:2147483647;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;align-items:center;padding:12px 15px;border:1px solid #e3afbd;border-radius:16px;background:#fffafc;color:#513443;box-shadow:0 5px 24px #3e243544;font:14px system-ui,sans-serif;max-width:calc(100vw - 20px)}
    #sf-editor-toolbar button {background:#9d4163;color:white;border:0;border-radius:9px;padding:9px 12px;font:600 13px system-ui;cursor:pointer}
    #sf-editor-toolbar button:hover {background:#7e2d4b}
    #sf-editor-toolbar span {font-weight:700}
    @media(max-width:650px){#sf-editor-toolbar {width:calc(100vw - 24px)}body{padding-bottom:100px}}
  `;
  document.head.appendChild(style);
  const toolbar = document.createElement('div');
  toolbar.id='sf-editor-toolbar';
  toolbar.innerHTML='<span>🍓 Edit Mode</span><button type="button" id="sf-save-page">Download edited page</button><button type="button" id="sf-exit-edit">Exit editor</button>';
  document.body.appendChild(toolbar);
  // Edit visible headings and paragraphs directly. Avoid nav, buttons, links, form controls and dynamic product data.
  const selectors = 'main h1, main h2, main h3, main h4, main p, main blockquote, main li, footer p';
  const candidates = [...document.querySelectorAll(selectors)].filter(el =>
    !el.closest('a, button, form, [data-toast], script, style, [data-sf-noedit]') &&
    !el.querySelector('a, button, input, textarea, select, img, svg, [data-product]') &&
    !el.hasAttribute('data-sf-noedit') && el.textContent.trim()
  );
  candidates.forEach(el => {
    el.setAttribute('data-sf-editable','');
    el.setAttribute('contenteditable','true');
    el.setAttribute('spellcheck','true');
    el.addEventListener('click',ev=>ev.stopPropagation());
    el.addEventListener('keydown',ev=>{if(ev.key==='Enter' && !ev.shiftKey){ev.preventDefault();el.blur();}});
  });
  // Keep editor enabled while navigating among pages.
  document.querySelectorAll('a[href]').forEach(a => {
    const href=a.getAttribute('href');
    if(href && /^(?:[\w-]+\.html|\.\/|\/)$/.test(href)) a.href = href + (href.includes('?')?'&':'?')+'edit=1';
  });
  document.getElementById('sf-exit-edit').addEventListener('click',()=>{location.href=location.pathname;});
  document.getElementById('sf-save-page').addEventListener('click',()=>{
    const clone=document.documentElement.cloneNode(true);
    clone.classList.remove('sf-editing');
    clone.querySelector('#sf-editor-toolbar')?.remove();
    clone.querySelectorAll('[data-sf-editable]').forEach(el=>{
      el.removeAttribute('data-sf-editable');el.removeAttribute('contenteditable');el.removeAttribute('spellcheck');
    });
    // Restore ordinary navigation links in the saved HTML.
    clone.querySelectorAll('a[href]').forEach(a=>{
      const raw=a.getAttribute('href');
      if(raw && raw.includes('edit=1')){
        try {const u=new URL(raw,location.href);if(u.origin===location.origin){u.searchParams.delete('edit');a.setAttribute('href',u.pathname.split('/').pop()+(u.search||'')+(u.hash||''));}}catch{}
      }
    });
    clone.querySelectorAll('style').forEach(el=>{if(el.textContent.includes('#sf-editor-toolbar'))el.remove()});
    const html='<!DOCTYPE html>\n'+clone.outerHTML;
    const blob=new Blob([html],{type:'text/html;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=location.pathname.split('/').pop()||'index.html';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    alert('Downloaded '+a.download+'. Keep this file to replace the matching page when publishing.');
  });
})();
