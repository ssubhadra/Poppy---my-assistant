import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-presence',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.is-thinking]': 'thinking()' },
  template: `
    <div class="aura"></div>
    <div class="orbit orbit-one"></div>
    <div class="orbit orbit-two"></div>
    <div class="sphere">
      <div class="vapor vapor-one"></div>
      <div class="vapor vapor-two"></div>
      <div class="vapor vapor-three"></div>
      <div class="core"></div>
      <svg class="filaments" viewBox="0 0 300 300" fill="none">
        <path d="M30 170C5 35 266 3 259 151S44 280 65 146 255 50 259 151" />
        <path d="M53 216C164 278 298 109 200 63S6 151 99 234 286 139 200 63" />
        <path d="M78 41C213 2 299 224 151 254S4 118 119 80 255 215 151 254" />
      </svg>
    </div>
    <div class="equator"></div>
    <span class="spark spark-one"></span><span class="spark spark-two"></span>
  `,
  styleUrl: './presence.css',
})
export class Presence {
  readonly thinking = input(false);
}
