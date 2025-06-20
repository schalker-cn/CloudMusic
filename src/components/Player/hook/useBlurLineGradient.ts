import { getPixelColor } from '@/utils/getPixelColor';
import obverser from '@/utils/obverser';
import { nextTick, type CSSProperties } from 'vue';

let lyricFooterMaskELement:HTMLElement;
let lyricTopMaskElement:HTMLElement;

export function useBlurLineGradient() {

  let footerMaskStyle:CSSProperties;
  let topMaskStyle:CSSProperties;
  const eleHeight = 35;
  const updateFooterMaskColor = async (context:CanvasRenderingContext2D) => {
    await nextTick();
    if (!lyricFooterMaskELement) {
      lyricFooterMaskELement = document.querySelector('.footer-mask') as HTMLElement;
    }
    if (!lyricTopMaskElement) {
      lyricTopMaskElement = document.querySelector('.top-mask') as HTMLElement;
    }
    let { top: footerEleTop } = lyricFooterMaskELement.getBoundingClientRect();
    let { top: topEleTop } = lyricTopMaskElement.getBoundingClientRect(); 
    if (footerEleTop <= 0) {
      footerEleTop = 0;
    }
    if (topEleTop <= 0) {
      topEleTop = 0;
    }
    const { rgb: footerRgb } = getPixelColor(
      context, 0, footerEleTop+eleHeight
    );
    const { rgb: topRgb } = getPixelColor(
      context, 0, topEleTop
    );
    if (topRgb === 'rgb(0,0,0)') {
      topMaskStyle = { background: 'transparent' };
    } else {
      topMaskStyle = { background: `linear-gradient(${topRgb} , rgba(255, 255, 255, 0)` };
    }
    if (footerRgb === 'rgb(0,0,0)') {
      footerMaskStyle = { background: 'transparent' };
    } else {
      footerMaskStyle = { background: `linear-gradient(-180deg, rgba(255, 255, 255, 0) 0%, ${footerRgb} 80%)` };

    }
    obverser.emit('updateLyricMaskStyle', { footerMaskStyle, topMaskStyle });
  };
  const resetBackground = () => {
    footerMaskStyle = { background: 'transparent' };
    topMaskStyle = { background: 'transparent' };
    obverser.emit('updateLyricMaskStyle', { footerMaskStyle, topMaskStyle });
  };

  return { updateFooterMaskColor, resetBackground };
}