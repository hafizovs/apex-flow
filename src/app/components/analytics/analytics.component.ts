import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { I18nService } from '../../services/i18n.service';
import { TaskService } from '../../services/task.service';
import { BarChartComponent } from './bar-chart/bar-chart.component';
import { BurndownChartComponent } from './burndown-chart/burndown-chart.component';

@Component({
  selector: 'afx-analytics',
  imports: [BarChartComponent, BurndownChartComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);
  private readonly tasks = inject(TaskService);
  protected readonly i18n = inject(I18nService);

  protected readonly summary = this.analytics.summary;

  protected readonly priorityStats = computed(() => this.summary().priorityStats);
  protected readonly burndownPoints = computed(() => this.summary().burndownPoints);

  ngOnInit(): void {
    if (this.tasks.tasks().length === 0) {
      this.tasks.loadTasks().subscribe();
    }
  }

  protected t(key: string): string {
    return this.i18n.t(key);
  }
}
