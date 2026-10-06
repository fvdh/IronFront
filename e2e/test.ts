// Shared Playwright `test`: every page plays its audio as usual, but silently (Web Audio through a zero gain,
// announcer speech at volume 0, media elements muted), so the game's sound code still runs during the tests.
import { test as base } from '@playwright/test';

export { expect, type Page } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const connect = AudioNode.prototype.connect as (...a: unknown[]) => unknown;
      const mute = new WeakMap<BaseAudioContext, GainNode>();
      AudioNode.prototype.connect = function (this: AudioNode, dest: unknown, ...rest: unknown[]) {
        if (dest instanceof AudioDestinationNode) {
          let g = mute.get(dest.context);
          if (!g) { g = dest.context.createGain(); g.gain.value = 0; connect.call(g, dest); mute.set(dest.context, g); }
          return connect.call(this, g, ...rest);
        }
        return connect.call(this, dest, ...rest);
      } as typeof AudioNode.prototype.connect;
      if (typeof speechSynthesis !== 'undefined') {
        const speak = speechSynthesis.speak.bind(speechSynthesis);
        speechSynthesis.speak = (u) => { u.volume = 0; speak(u); };
      }
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) { this.muted = true; return play.call(this); };
    });
    await use(page);
  },
});
