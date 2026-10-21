import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

let modalSeq = 0;

@Component({
  selector: 'afx-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly closeOnBackdrop = input(true);
  readonly close = output<void>();

  readonly titleId = `afx-modal-title-${++modalSeq}`;

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly destroyRef = inject(DestroyRef);
  private previousFocus: HTMLElement | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    effect(() => {
      if (this.open()) {
        this.attachListeners();
      } else {
        this.detachListeners();
      }
    });
    this.destroyRef.onDestroy(() => this.detachListeners());
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.close.emit();
    }
  }

  onCloseClick(): void {
    this.close.emit();
  }

  private attachListeners(): void {
    this.detachListeners();
    this.previousFocus = document.activeElement as HTMLElement | null;
    this.keyHandler = (e: KeyboardEvent) => {
      if (!this.open()) {
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close.emit();
        return;
      }
      if (e.key === 'Tab') {
        this.trapFocus(e);
      }
    };
    window.addEventListener('keydown', this.keyHandler);
    queueMicrotask(() => {
      const el = this.panel()?.nativeElement;
      const focusable = el?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    });
  }

  private detachListeners(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    if (this.previousFocus) {
      this.previousFocus.focus?.();
      this.previousFocus = null;
    }
  }

  private trapFocus(e: KeyboardEvent): void {
    const el = this.panel()?.nativeElement;
    if (!el) {
      return;
    }
    const nodes = Array.from(
      el.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (nodes.length === 0) {
      e.preventDefault();
      return;
    }
    const first = nodes[0]!;
    const last = nodes[nodes.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
