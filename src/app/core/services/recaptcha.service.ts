import { Injectable } from '@angular/core';
import { apiConfig } from '../config/api.config';

declare var grecaptcha: any;

@Injectable({
  providedIn: 'root',
})
export class RecaptchaService {
  private siteKey = apiConfig.recaptchaSiteKey;
  private scriptLoaded: Promise<void>;

  constructor() {
    this.scriptLoaded = this.loadRecaptchaScript();
  }

  private loadRecaptchaScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="recaptcha/api.js"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () => reject('Error cargando reCAPTCHA');

      document.head.appendChild(script);
    });
  }

  async execute(action: string): Promise<string> {
    await this.scriptLoaded;

    return new Promise((resolve, reject) => {
      grecaptcha.ready(() => {
        grecaptcha
          .execute(this.siteKey, { action })
          .then((token: string) => resolve(token))
          .catch((error: any) => reject(error));
      });
    });
  }
}