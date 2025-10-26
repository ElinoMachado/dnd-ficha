/* ================================================================
   Ficha — Page Flip (Livro Mágico)
================================================================ */
import { FichaBuilder } from "./fichaBuilder_v2.js";

export const PageFlip = (() => {
  const snd = new Audio("assets/sounds/page-flip-magic.wav");
  snd.volume = 0.35;

  function init() {
    document.addEventListener("click", (e) => {
      if (e.target.closest(".turn-right")) {
        pageSound();
        FichaBuilder.nextPage();
      }
      if (e.target.closest(".turn-left")) {
        pageSound();
        FichaBuilder.prevPage();
      }
    });

    // Suporte mobile — arrastar
    let startX = 0;
    document.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });

    document.addEventListener("touchend", (e) => {
      const endX = e.changedTouches[0].clientX;
      const delta = endX - startX;
      if (delta < -80) {
        pageSound();
        FichaBuilder.nextPage();
      } else if (delta > 80) {
        pageSound();
        FichaBuilder.prevPage();
      }
    });
  }

  function pageSound() {
    snd.currentTime = 0;
    snd.play();
  }

  return { init };
})();
