import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { PRIORITY_COLORS } from '../../../core/constants/analytics.constants';
import { buildBarChartModel } from '../../../domain/analytics/chart-builder';
import type { PriorityStat } from '../../../models/app.types';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'afx-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent {
  readonly stats = input<PriorityStat[]>([]);
  protected readonly i18n = inject(I18nService);
  protected readonly colors = PRIORITY_COLORS;

  protected readonly model = computed(() => buildBarChartModel(this.stats()));

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  protected colorFor(priority: keyof typeof PRIORITY_COLORS): string {
    return this.colors[priority];
  }
}
