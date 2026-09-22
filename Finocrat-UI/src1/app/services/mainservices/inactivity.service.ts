import { Injectable, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class InactivityService {

  private timeout: any;
  private idleTime = 5 * 60 * 1000;
  private callback!: () => void;
  private events: string[] = ['click', 'mousemove', 'keypress', 'scroll', 'touchstart', 'keydown'];
  private isWatching: boolean = false;

  constructor(private ngZone: NgZone) {}

  startWatching(callback: () => void) {
    if (this.isWatching) {
      this.stopWatching();
    }
    
    this.callback = callback;
    this.isWatching = true;
    this.reset();

    this.ngZone.runOutsideAngular(() => {
      this.events.forEach(event => {
        window.addEventListener(event, this.resetHandler);
      });
    });
  }

  private resetHandler = () => {
    this.reset();
  }

  reset() {
    if (!this.isWatching) return;
    
    clearTimeout(this.timeout);
    
    this.timeout = setTimeout(() => {
      this.ngZone.run(() => {
        if (this.callback && this.isWatching) {
          this.callback();
        }
      });
    }, this.idleTime);
  }

  stopWatching() {
    this.isWatching = false;
    clearTimeout(this.timeout);
    
    this.events.forEach(event => {
      window.removeEventListener(event, this.resetHandler);
    });
  }

  updateIdleTime(minutes: number) {
    this.idleTime = minutes * 60 * 1000;
    if (this.isWatching) {
      this.reset();
    }
  }
}