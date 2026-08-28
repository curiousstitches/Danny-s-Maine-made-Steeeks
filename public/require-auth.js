(function(){
  // Fast, synchronous-ish check (localStorage only, no network) so the redirect
  // happens before the page paints anything — avoids a flash of the real content.
  // This is a first-pass gate; the page's own module script also verifies the
  // session with Supabase directly afterward and redirects if it's invalid/expired.
  var hasSession = false;
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') !== -1) {
        var val = localStorage.getItem(k);
        if (val && val !== 'null') { hasSession = true; break; }
      }
    }
  } catch (e) {
    // If localStorage is unavailable for some reason, don't trap the user in a
    // redirect loop — let the page's own (more thorough) check handle it.
    hasSession = true;
  }
  if (!hasSession) {
    var here = location.pathname.split('/').pop() || 'index.html';
    if (here !== 'auth.html') {
      window.location.replace('auth.html?redirect=' + encodeURIComponent(here));
    }
  }
})();
