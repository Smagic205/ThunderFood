import type { SwiperModule } from '../../core/core.js';
export type FadeEffectMode = 'default' | 'cross-fade' | 'out-in';
export interface FadeEffectOptions {
    /**
     * Fade transition mode:
     * - `'default'` - only the currently active slide fades out, while the new slide is fully visible beneath it
     * - `'cross-fade'` - both slides fade simultaneously
     * - `'out-in'` - the current slide fades out completely before the new slide starts fading in
     *
     * @default 'default'
     */
    mode?: FadeEffectMode;
    /**
     * Enables slides cross fade
     *
     * @deprecated Use `mode: 'cross-fade'` instead
     * @default false
     */
    crossFade?: boolean;
}
export interface FadeEffectMethods {
}
export interface FadeEffectEvents {
}
declare module '../../core/core.js' {
    interface Swiper {
        fadeEffect: FadeEffectMethods;
    }
    interface SwiperOptions {
        /**
         * Object with Fade-effect parameters
         *
         * @example
         * ```js
         * const swiper = new Swiper('.swiper', {
         *   effect: 'fade',
         *   fadeEffect: {
         *     crossFade: true
         *   },
         * });
         * ```
         */
        fadeEffect?: FadeEffectOptions;
    }
    interface SwiperParams {
        fadeEffect?: FadeEffectOptions;
    }
    interface SwiperEvents extends FadeEffectEvents {
    }
}
declare const EffectFade: SwiperModule;
export default EffectFade;
