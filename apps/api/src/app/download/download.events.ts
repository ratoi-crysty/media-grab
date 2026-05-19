import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import type { DownloadModel } from '@media-grab/common';

const PROGRESS_THROTTLE_MS = 250;

@Injectable()
export class DownloadEventsService {
  private readonly subject: Subject<DownloadModel> = new Subject<DownloadModel>();
  private readonly lastEmitMs: Map<string, number> = new Map();

  readonly stream$: Observable<DownloadModel> = this.subject.asObservable();

  emitTransition(snapshot: DownloadModel): void {
    this.lastEmitMs.set(snapshot.id, Date.now());
    this.subject.next(snapshot);
  }

  emitProgress(snapshot: DownloadModel): void {
    const now: number = Date.now();
    const last: number = this.lastEmitMs.get(snapshot.id) ?? 0;
    if (now - last < PROGRESS_THROTTLE_MS) return;
    this.lastEmitMs.set(snapshot.id, now);
    this.subject.next(snapshot);
  }

  forget(id: string): void {
    this.lastEmitMs.delete(id);
  }
}
