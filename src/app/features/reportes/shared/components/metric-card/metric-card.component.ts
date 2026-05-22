import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metric-card group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
         [ngClass]="cardClass()">
      <!-- Glow de fondo -->
      <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-2xl"
           [ngClass]="glowClass()"></div>

      <!-- Skeleton loader -->
      @if (loading()) {
        <div class="animate-pulse space-y-3">
          <div class="h-3 w-20 rounded bg-white/10"></div>
          <div class="h-8 w-32 rounded bg-white/15"></div>
          <div class="h-3 w-24 rounded bg-white/10"></div>
        </div>
      } @else {
        <p class="text-xs font-semibold uppercase tracking-widest text-white/50">{{ label() }}</p>
        <p class="mt-2 text-3xl font-bold tracking-tight text-white">{{ value() }}</p>
        @if (sub()) {
          <p class="mt-1.5 flex items-center gap-1 text-xs"
             [ngClass]="subColor()">
            <span>{{ subIcon() }}</span>
            <span>{{ sub() }}</span>
          </p>
        }
      }

      <!-- Ícono decorativo -->
      @if (!loading() && icon()) {
        <div class="absolute bottom-4 right-4 text-3xl opacity-20 transition-opacity group-hover:opacity-40">
          {{ icon() }}
        </div>
      }
    </div>
  `,
})
export class MetricCardComponent {
  readonly label = input<string>('');
  readonly value = input<string>('');
  readonly sub = input<string>('');
  readonly icon = input<string>('');
  readonly loading = input<boolean>(false);
  readonly variant = input<'purple' | 'pink' | 'cyan' | 'amber' | 'green'>('purple');
  readonly trend = input<'up' | 'down' | 'neutral'>('neutral');

  cardClass() {
    const map: Record<string, string> = {
      purple: 'from-purple-900/40 to-purple-950/60 hover:border-purple-500/30',
      pink:   'from-pink-900/40 to-pink-950/60 hover:border-pink-500/30',
      cyan:   'from-cyan-900/40 to-cyan-950/60 hover:border-cyan-500/30',
      amber:  'from-amber-900/40 to-amber-950/60 hover:border-amber-500/30',
      green:  'from-emerald-900/40 to-emerald-950/60 hover:border-emerald-500/30',
    };
    return map[this.variant()] ?? map['purple'];
  }

  glowClass() {
    const map: Record<string, string> = {
      purple: 'bg-purple-400',
      pink:   'bg-pink-400',
      cyan:   'bg-cyan-400',
      amber:  'bg-amber-400',
      green:  'bg-emerald-400',
    };
    return map[this.variant()] ?? map['purple'];
  }

  subColor() {
    if (this.trend() === 'up') return 'text-emerald-400';
    if (this.trend() === 'down') return 'text-rose-400';
    return 'text-white/40';
  }

  subIcon() {
    if (this.trend() === 'up') return '↑';
    if (this.trend() === 'down') return '↓';
    return '→';
  }
}
