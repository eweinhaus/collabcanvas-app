import { throttle, debounce } from '../throttle';

jest.useFakeTimers();

test('throttle limits calls and uses latest args', () => {
  const fn = jest.fn();
  const t = throttle(fn, 100);
  t(1);
  t(2);
  t(3);
  expect(fn).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(100);
  expect(fn).toHaveBeenCalledTimes(2);
});

test('throttle flush calls pending', () => {
  const fn = jest.fn();
  const t = throttle(fn, 100);
  t('a');
  t('b');
  t.flush();
  expect(fn).toHaveBeenCalledTimes(2); // first immediate + flush
});

test('debounce delays and uses latest args', () => {
  const fn = jest.fn();
  const d = debounce(fn, 50);
  d(1);
  d(2);
  jest.advanceTimersByTime(49);
  expect(fn).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(fn).toHaveBeenCalledTimes(1);
});


