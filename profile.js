(() => {
  const profile = window.PORTFOLIO_PROFILE || {};
  document.querySelectorAll('[data-profile]').forEach(node => {
    const value = profile[node.dataset.profile];
    if (typeof value === 'string' && value.trim()) node.textContent = value;
  });
  if (!profile.photo) return;
  try {
    const url = new URL(profile.photo, location.href);
    if (url.origin !== location.origin || !['http:', 'https:', 'file:'].includes(url.protocol)) return;
    const image = document.querySelector('#profile-photo');
    image.alt = profile.photoAlt || 'Profile photo';
    image.addEventListener('load', () => {
      image.hidden = false;
      document.querySelector('#photo-placeholder').hidden = true;
    });
    image.addEventListener('error', () => { image.hidden = true; document.querySelector('#photo-placeholder').hidden = false; });
    image.src = url.href;
  } catch { /* Keep the visible photo placeholder for an invalid path. */ }
})();
