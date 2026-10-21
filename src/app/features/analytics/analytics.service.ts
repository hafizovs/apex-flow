import { Injectable, computed, inject } from '@angular/core';
import { buildAnalyticsSummary } from '../../domain/analytics/chart-builder';
import { TaskService } from '../board/task.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly tasks = inject(TaskService);

  readonly summary = computed(() => buildAnalyticsSummary(this.tasks.tasks()));
}
