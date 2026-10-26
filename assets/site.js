// 動画の枠（data-media）の制御だけを受け持つ: 一時停止のボタン、画面に入ったときの再生、動きを減らす設定への対応。
// JavaScript が無くてもページは読める（最初の画面の動画は autoplay で動き、ほかの動画は静止画のまま）。
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
/** 枠がこの割合だけ見えたら、画面に入ったとみなす。 */
const VISIBLE_RATIO = 0.25;

function setUpMediaSlot(slot) {
  const video = slot.querySelector('video');
  const toggle = slot.querySelector('.media-slot__toggle');
  if (!video || !toggle) return;
  const isLazy = slot.dataset.media === 'lazy';
  let isPausedByUser = false;
  let isInView = !isLazy;

  const updateToggle = () => {
    const isPlaying = !video.paused;
    toggle.dataset.state = isPlaying ? 'playing' : 'paused';
    toggle.setAttribute('aria-label', isPlaying ? toggle.dataset.labelPause : toggle.dataset.labelPlay);
  };

  const playIfAllowed = () => {
    if (reducedMotionQuery.matches || isPausedByUser || !isInView) return;
    video.play().catch(updateToggle);
  };

  const applyMotionPreference = () => {
    toggle.hidden = reducedMotionQuery.matches;
    if (reducedMotionQuery.matches) {
      video.pause();
    } else {
      playIfAllowed();
    }
  };

  video.addEventListener('play', updateToggle);
  video.addEventListener('pause', updateToggle);
  toggle.addEventListener('click', () => {
    if (video.paused) {
      isPausedByUser = false;
      isInView = true;
      playIfAllowed();
    } else {
      isPausedByUser = true;
      video.pause();
    }
  });
  reducedMotionQuery.addEventListener('change', applyMotionPreference);

  if (isLazy) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        isInView = entry.isIntersecting;
        if (isInView) {
          playIfAllowed();
        } else {
          video.pause();
        }
      }
    }, { threshold: VISIBLE_RATIO });
    observer.observe(slot);
  }

  applyMotionPreference();
  updateToggle();
}

document.querySelectorAll('[data-media]').forEach(setUpMediaSlot);
