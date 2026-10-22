/* Scene image sources and contain-fit annotation coordinates. */
(() => {
  'use strict';

  const assets = {
    q1: 'assets/scenes/q1.jpg',
    q1b: 'assets/scenes/q1b.jpg',
    q2: 'assets/scenes/q2.jpg',
    q3: 'assets/scenes/q3.jpg',
    q3b: 'assets/scenes/q3b.jpg',
    q4: 'assets/scenes/q4.jpg',
    q5a: 'assets/scenes/q5a.jpg',
    q5b: 'assets/scenes/q5b.jpg',
    q6: 'assets/scenes/q6.jpg',
    q7: 'assets/scenes/q7.jpg',
    q8: 'assets/scenes/q8.jpg',
    q9: 'assets/scenes/q9.jpg',
    q10: 'assets/scenes/q10.jpg',
    e1: 'assets/scenes/e1.jpg',
    e2: 'assets/scenes/e2.jpg',
    e2b: 'assets/scenes/e2b.jpg',
    longyuan: 'assets/scenes/longyuan.jpg',
    w1: 'assets/scenes/w1.jpg',
    w2: 'assets/scenes/w2.jpg',
    w3: 'assets/scenes/w3.jpg',
    f1: 'assets/scenes/f1.jpg',
    f2: 'assets/scenes/f2.jpg',
    f4: 'assets/scenes/f4.jpg',
    f3: 'assets/scenes/f3.jpg'
  };

  const thumbnails = Object.fromEntries(Object.keys(assets).map(id => [id, 'assets/scenes/thumbs/' + id + '.jpg']));
  const offsets = [[0,0],[-48,0],[48,0],[0,-48],[0,48],[-48,-48],[48,-48],[-48,48],[48,48]];
  const minimumGapSquared = 46 * 46;

  const api = {
    assets,
    thumbnails,
    // A separately loaded scene-annotations.js may replace this object.
    // Coordinates are percentages of the uncropped source image, in SUBS order.
    annotations: {},

    positionAnnotations(pointId, container, buttons) {
      if (!container || !container.parentElement) return false;
      const media = container.parentElement.querySelector('.dmedia');
      const picture = media?.lastElementChild;
      // The legacy mapcrop has a separate camera transform; leave it untouched.
      if (!picture?.classList.contains('scene-photo')) return false;

      const boxWidth = container.clientWidth;
      const boxHeight = container.clientHeight;
      const sourceWidth = picture.naturalWidth;
      const sourceHeight = picture.naturalHeight;
      if (!(boxWidth > 0 && boxHeight > 0 && sourceWidth > 0 && sourceHeight > 0)) return false;

      // dmedia and dsubs share the same inset:0 parent. Using layout dimensions
      // avoids reading their animated entry transforms while the image settles.
      const scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);
      const width = sourceWidth * scale;
      const height = sourceHeight * scale;
      const left = (boxWidth - width) / 2;
      const top = (boxHeight - height) / 2;
      const points = api.annotations?.[pointId];
      const elements = buttons || container.querySelectorAll('.sub');

      const placedX = [], placedY = [];
      for (const button of elements) {
        const index = Number(button.dataset.i);
        const configured = points?.[index];
        const rawX = configured?.x ?? button.dataset.x;
        const rawY = configured?.y ?? button.dataset.y;
        if (rawX === undefined || rawX === '' || rawY === undefined || rawY === '') continue;
        const x = Number(rawX);
        const y = Number(rawY);
        if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) continue;

        const anchorX = left + width * x / 100;
        const anchorY = top + height * y / 100;
        const radiusX = Math.min((button.offsetWidth || 44) / 2, width / 2);
        const radiusY = Math.min((button.offsetHeight || 44) / 2, height / 2);
        const minX = left + radiusX, maxX = left + width - radiusX;
        const minY = top + radiusY, maxY = top + height - radiusY;
        let bestX = anchorX, bestY = anchorY;
        let bestDistance = Infinity, bestSeparation = -1, foundSpace = false;
        for (const offset of offsets) {
          const candidateX = Math.max(minX, Math.min(maxX, anchorX + offset[0]));
          const candidateY = Math.max(minY, Math.min(maxY, anchorY + offset[1]));
          let separation = Infinity;
          for (let i = 0; i < placedX.length; i++) {
            const dx = candidateX - placedX[i], dy = candidateY - placedY[i];
            separation = Math.min(separation, dx * dx + dy * dy);
          }
          const dx = candidateX - anchorX, dy = candidateY - anchorY;
          const distance = dx * dx + dy * dy;
          const fits = separation >= minimumGapSquared;
          if ((fits && (!foundSpace || distance < bestDistance)) ||
              (!fits && !foundSpace && (separation > bestSeparation ||
                (separation === bestSeparation && distance < bestDistance)))) {
            bestX = candidateX; bestY = candidateY;
            bestDistance = distance; bestSeparation = separation;
            if (fits) foundSpace = true;
          }
        }
        placedX.push(bestX); placedY.push(bestY);
        button.dataset.anchorX = String(anchorX);
        button.dataset.anchorY = String(anchorY);
        button.dataset.placedX = String(bestX);
        button.dataset.placedY = String(bestY);
        button.style.left = bestX + 'px';
        button.style.top = bestY + 'px';
      }
      return true;
    }
  };

  window.TaihaoScenes = api;
})();
