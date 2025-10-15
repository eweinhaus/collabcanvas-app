import { flushEditBuffersBeforeUnload, registerBeforeUnloadFlush } from '../beforeUnloadFlush';

describe('beforeUnloadFlush', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  test('flushEditBuffersBeforeUnload removes edit buffers from session storage', () => {
    sessionStorage.setItem('editBuffer:shape1', JSON.stringify({ x: 10, y: 20 }));
    sessionStorage.setItem('editBuffer:shape2', JSON.stringify({ x: 30, y: 40 }));
    sessionStorage.setItem('unrelated', 'value');

    flushEditBuffersBeforeUnload();

    expect(sessionStorage.getItem('editBuffer:shape1')).toBeNull();
    expect(sessionStorage.getItem('editBuffer:shape2')).toBeNull();
    expect(sessionStorage.getItem('unrelated')).toBe('value');
  });

  test('flushEditBuffersBeforeUnload handles empty session storage', () => {
    flushEditBuffersBeforeUnload();
    // No errors should be thrown
  });

  test('flushEditBuffersBeforeUnload ignores malformed buffers', () => {
    sessionStorage.setItem('editBuffer:bad', '{invalid json');
    sessionStorage.setItem('editBuffer:good', JSON.stringify({ x: 5, y: 5 }));

    flushEditBuffersBeforeUnload();

    expect(sessionStorage.getItem('editBuffer:bad')).toBeNull();
    expect(sessionStorage.getItem('editBuffer:good')).toBeNull();
  });

  test('registerBeforeUnloadFlush attaches and detaches listener', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    const cleanup = registerBeforeUnloadFlush();
    expect(addSpy).toHaveBeenCalledWith('pagehide', expect.any(Function));

    cleanup();
    expect(removeSpy).toHaveBeenCalledWith('pagehide', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

