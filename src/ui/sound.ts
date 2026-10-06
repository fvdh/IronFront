import { audio } from '../game/audio';

/** Menu button feedback. The first click is also the gesture that may start audio (and the menu music). */
export function uiClick() {
  audio.unlock();
  audio.play('click', 0.6);
}
