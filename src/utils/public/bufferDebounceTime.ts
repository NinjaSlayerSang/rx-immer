import {
  buffer,
  debounceTime,
  Observable,
  OperatorFunction,
  SchedulerLike,
} from 'rxjs';

export function bufferDebounceTime<T>(
  dueTime: number,
  scheduler?: SchedulerLike
): OperatorFunction<T, T[]> {
  return (source: Observable<T>) =>
    source.pipe(buffer(source.pipe(debounceTime(dueTime, scheduler))));
}
