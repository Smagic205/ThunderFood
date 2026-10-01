import { e as effectInit } from '../shared/effect-init.mjs';
import { e as effectTarget } from '../shared/effect-target.mjs';
import { e as effectVirtualTransitionEnd } from '../shared/effect-virtual-transition-end.mjs';
import { p as getSlideTransformEl } from '../shared/utils.mjs';

const EffectFade = ({ swiper, extendParams, on }) => {
    extendParams({
        fadeEffect: {
            crossFade: false,
            mode: 'default',
        },
    });
    // duration of the pending `out-in` transition, passed from setTransition to
    // setTranslate where the incoming slide is known
    let outInDuration = 0;
    function getParams() {
        return swiper.params.fadeEffect;
    }
    function getMode() {
        const params = getParams();
        if (params.mode === 'default' && params.crossFade)
            return 'cross-fade';
        return params.mode;
    }
    const setTranslate = () => {
        const { slides } = swiper;
        const params = getParams();
        const mode = getMode();
        const outInTransition = mode === 'out-in' && outInDuration > 0;
        const duration = outInDuration;
        outInDuration = 0;
        const targetEls = [];
        const incomingEls = [];
        let hasFadingOut = false;
        for (let i = 0; i < slides.length; i += 1) {
            const slideEl = slides[i];
            const offset = slideEl.swiperSlideOffset ?? 0;
            let tx = -offset;
            if (!swiper.params.virtualTranslate)
                tx -= swiper.translate;
            let ty = 0;
            if (!swiper.isHorizontal()) {
                ty = tx;
                tx = 0;
            }
            const slideProgress = slideEl.progress ?? 0;
            let slideOpacity;
            if (mode === 'cross-fade') {
                slideOpacity = Math.max(1 - Math.abs(slideProgress), 0);
            }
            else if (mode === 'out-in') {
                slideOpacity = Math.max(1 - 2 * Math.abs(slideProgress), 0);
            }
            else {
                slideOpacity = 1 + Math.min(Math.max(slideProgress, -1), 0);
            }
            const targetEl = effectTarget(params, slideEl);
            if (outInTransition) {
                const prevOpacity = parseFloat(targetEl.style.opacity);
                if (slideOpacity === 0 && prevOpacity > 0)
                    hasFadingOut = true;
                if (slideOpacity > 0)
                    incomingEls.push(targetEl);
                targetEls.push(targetEl);
            }
            targetEl.style.opacity = String(slideOpacity);
            targetEl.style.transform = `translate3d(${tx}px, ${ty}px, 0px)`;
        }
        if (outInTransition) {
            targetEls.forEach((el) => {
                const delayed = hasFadingOut && incomingEls.includes(el);
                el.style.transitionDuration = `${duration / 2}ms`;
                el.style.transitionDelay = delayed ? `${duration / 2}ms` : '0ms';
            });
            effectVirtualTransitionEnd({
                swiper,
                duration,
                transformElements: incomingEls,
                allSlides: true,
            });
        }
    };
    const setTransition = (duration) => {
        const mode = getMode();
        const transformElements = swiper.slides.map((slideEl) => getSlideTransformEl(slideEl));
        transformElements.forEach((el) => {
            el.style.transitionDuration = `${duration}ms`;
            if (mode === 'out-in' && duration === 0)
                el.style.transitionDelay = '';
        });
        if (mode === 'out-in' && duration > 0 && !swiper.params.cssMode) {
            // sequencing (half durations, delay on the incoming slide) and the
            // transitionend listener are set in setTranslate, which runs right after
            // with up-to-date slides progress. Attaching transitionend here to all
            // slides would end the transition when outgoing slides finish at half time
            outInDuration = duration;
            return;
        }
        effectVirtualTransitionEnd({ swiper, duration, transformElements, allSlides: true });
    };
    effectInit({
        effect: 'fade',
        swiper,
        on,
        setTranslate,
        setTransition,
        overwriteParams: () => ({
            slidesPerView: 1,
            slidesPerGroup: 1,
            watchSlidesProgress: true,
            spaceBetween: 0,
            virtualTranslate: !swiper.params.cssMode,
        }),
    });
};

export { EffectFade as default };
