const $ = (selector) => document.querySelector(selector);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let motionReduced = reduced.matches;
const details = {
  walnut: ['Warmth, at the top.', 'The upper 30 cm section in natural walnut. A warm place for your hand, with the concept light and discreet control integrated into the same uninterrupted profile.'],
  metal: ['A quiet precision.', 'The middle 30 cm section in brushed aluminum. A cooler material and a clean connection between the two ends, with exactly the same outer diameter.'],
  composite: ['A grounded finish.', 'The lower 30 cm section in dark composite, with an integrated contact surface. Its length and outer diameter match the other sections. Material and grip performance are untested.']
};
let explorerModel, heroModel, progress = 0, selected = 'walnut', diagram = false;
let hasWebGL = false;
const controls = $('#model-controls');
const slider = $('#explode');
const followScroll = $('#scroll-explode');
const explorer = $('#explorer');
const modelHost = $('#model-host');
const diagramButton = $('#show-diagram');
const motionToggle = $('#reduce-motion');
motionToggle.checked = motionReduced;
motionToggle.disabled = reduced.matches;
document.documentElement.dataset.reducedMotion = String(motionReduced);
followScroll.checked = !motionReduced && matchMedia('(min-width: 1000px)').matches;

function setProgress(value, manual = false) {
  progress = Math.max(0, Math.min(1, value));
  if (manual) followScroll.checked = false;
  slider.value = String(Math.round(progress * 100));
  $('#explode-value').value = `${Math.round(progress * 100)}%`;
  slider.setAttribute('aria-valuetext', `${Math.round(progress * 100)} percent separated`);
  $('#toggle-explode').innerHTML = progress > .5 ? 'Assemble view <span aria-hidden="true">↙</span>' : 'Explode view <span aria-hidden="true">↗</span>';
  explorer.dataset.state = progress > .4 ? 'exploded' : 'assembled';
  explorerModel?.setExplosion(progress, motionReduced);
}
function selectPart(part) {
  selected = part;
  const keys = Object.keys(details);
  $('#part-counter').textContent = `0${keys.indexOf(part)+1} / 03`;
  $('#part-title').textContent = details[part][0];
  $('#part-copy').textContent = details[part][1];
  document.querySelectorAll('[data-part]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.part === part)));
  document.querySelectorAll('[data-part-label]').forEach(label => label.classList.toggle('active', label.dataset.partLabel === part));
  explorerModel?.select(part);
}
document.querySelectorAll('[data-part]').forEach(button => button.addEventListener('click', () => { selectPart(button.dataset.part); if (hasWebGL && !diagram) setProgress(1, true); }));
slider.addEventListener('input', () => setProgress(Number(slider.value)/100, true));
$('#toggle-explode').addEventListener('click', () => setProgress(progress > .5 ? 0 : 1, true));
$('#rotate-left').addEventListener('click', () => explorerModel?.rotate(-.35));
$('#rotate-right').addEventListener('click', () => explorerModel?.rotate(.35));
$('#reset-view').addEventListener('click', () => { explorerModel?.reset(); setProgress(0, true); selectPart('walnut'); });

function setDiagram(enabled) {
  diagram = enabled;
  explorer.classList.toggle('diagram-mode', enabled);
  modelHost.setAttribute('aria-hidden', String(enabled || !hasWebGL));
  $('#model-fallback').setAttribute('aria-hidden', String(!enabled && hasWebGL));
  controls.disabled = enabled || !hasWebGL;
  explorerModel?.setActive(!enabled);
  diagramButton.setAttribute('aria-pressed', String(enabled));
  diagramButton.textContent = enabled && hasWebGL ? 'Return to interactive 3D' : 'Use illustrated view';
  $('#view-mode').textContent = enabled || !hasWebGL ? 'ILLUSTRATED VIEW' : 'INTERACTIVE 3D';
  $('#viewer-hint').textContent = enabled || !hasWebGL ? 'Illustrative components. Select a part to learn more.' : 'Drag to turn · Use the slider to look inside';
}
diagramButton.addEventListener('click', () => setDiagram(!diagram));

let scrollFrame = 0;
function syncScroll() {
  scrollFrame = 0;
  if (!hasWebGL || diagram || !followScroll.checked || motionReduced) return;
  const top = $('#viewer').getBoundingClientRect().top;
  setProgress((innerHeight * .65 - top) / (innerHeight * .55));
}
addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(syncScroll); }, { passive: true });
followScroll.addEventListener('change', syncScroll);
function applyMotionPreference() {
  motionReduced = reduced.matches || motionToggle.checked;
  motionToggle.checked = motionReduced;
  motionToggle.disabled = reduced.matches;
  document.documentElement.dataset.reducedMotion = String(motionReduced);
  if (motionReduced) followScroll.checked = false;
  explorerModel?.setReducedMotion(motionReduced);
  heroModel?.setReducedMotion(motionReduced);
}
motionToggle.addEventListener('change', applyMotionPreference);
reduced.addEventListener('change', applyMotionPreference);
selectPart('walnut');

const modules = import('./scene.js');
modules.then(({ createMotickScene }) => {
  try {
    heroModel = createMotickScene($('#hero-render'), { hero: true, reducedMotion: motionReduced });
    $('#hero-render').classList.add('ready');
    $('.hero-poster').setAttribute('aria-hidden', 'true');
  } catch { /* The vector poster stays in place when WebGL is unavailable. */ }
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    try {
      explorerModel = createMotickScene(modelHost, {
        reducedMotion: motionReduced,
        onLabels: positions => {
          for (const [id, position] of Object.entries(positions)) {
            const label = document.querySelector(`[data-part-label="${id}"]`);
            label.style.transform = `translate(${position.x}px,${position.y}px) translate(-50%,-50%)`;
          }
        },
        onContextLost: () => { hasWebGL = false; setDiagram(true); diagramButton.hidden = true; $('#viewer-hint').textContent = '3D is unavailable. Explore the illustrated components instead.'; }
      });
      hasWebGL = true;
      diagramButton.hidden = false;
      explorer.classList.add('webgl-ready');
      controls.disabled = false;
      setDiagram(diagram);
      selectPart(selected);
      setProgress(progress, false);
      syncScroll();
    } catch {
      hasWebGL = false;
      setDiagram(true);
      diagramButton.hidden = true;
      $('#viewer-hint').textContent = '3D is unavailable. Explore the illustrated components instead.';
    }
  }, { rootMargin: '350px' });
  observer.observe(explorer);
}).catch(() => { diagramButton.hidden = true; $('#viewer-hint').textContent = 'Explore the illustrated components. The 3D viewer could not load.'; });
