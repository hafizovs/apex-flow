import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { buildBurndownChartModel } from '../../../../../domain/analytics/chart-builder';
import type { AnalyticsPoint } from '../../../../../core/models/app.types';
import { I18nService } from '../../../../../core/i18n.service';

@Component({
  selector: 'afx-burndown-chart',
  templateUrl: './burndown-chart.component.html',
  styleUrl: './burndown-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BurndownChartComponent {
  readonly points = input<AnalyticsPoint[]>([]);
  protected readonly i18n = inject(I18nService);

  protected readonly model = computed(() =>
    buildBurndownChartModel(this.points()),
  );

  protected t(key: string): string {
    return this.i18n.t(key);
  }
}
