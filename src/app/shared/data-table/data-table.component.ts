import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import type { SortDirection } from '../../core/models/app.types';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

@Component({
  selector: 'afx-data-table',
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent {
  readonly columns = input<TableColumn[]>([]);
  readonly rows = input<Record<string, unknown>[]>([]);
  readonly sortBy = model<string>('');
  readonly sortDirection = model<SortDirection>('asc');
  readonly sortChange = output<{ sortBy: string; sortDirection: SortDirection }>();

  protected onSort(column: TableColumn): void {
    if (!column.sortable) {
      return;
    }
    let direction: SortDirection = 'asc';
    if (this.sortBy() === column.key) {
      direction = this.sortDirection() === 'asc' ? 'desc' : 'asc';
    }
    this.sortBy.set(column.key);
    this.sortDirection.set(direction);
    this.sortChange.emit({ sortBy: column.key, sortDirection: direction });
  }

  protected ariaSort(column: TableColumn): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortable) {
      return null;
    }
    if (this.sortBy() !== column.key) {
      return 'none';
    }
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  protected cellValue(row: Record<string, unknown>, key: string): unknown {
    return row[key];
  }
}
