import { debounce } from '../debounce';

describe('debounce utility', () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should delay function execution', () => {
    const func = jest.fn();
    const debounced = debounce(func, 500);

    debounced();
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(499);
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should reset timer on multiple calls', () => {
    const func = jest.fn();
    const debounced = debounce(func, 500);

    debounced();
    jest.advanceTimersByTime(300);
    
    debounced();
    jest.advanceTimersByTime(300);
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to debounced function', () => {
    const func = jest.fn();
    const debounced = debounce(func, 500);

    debounced('arg1', 'arg2');
    jest.advanceTimersByTime(500);

    expect(func).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should cancel pending execution', () => {
    const func = jest.fn();
    const debounced = debounce(func, 500);

    debounced();
    debounced.cancel();
    jest.advanceTimersByTime(500);

    expect(func).not.toHaveBeenCalled();
  });

  it('should preserve this context', () => {
    const func = jest.fn(function innerFunc() {
      return this;
    });
    
    const obj = { method: debounce(func, 500) };
    
    obj.method();
    jest.advanceTimersByTime(500);

    expect(func).toHaveBeenCalled();
  });

  it('should handle multiple debounced calls with different arguments', () => {
    const func = jest.fn();
    const debounced = debounce(func, 500);

    debounced('first');
    jest.advanceTimersByTime(200);
    
    debounced('second');
    jest.advanceTimersByTime(200);
    
    debounced('third');
    jest.advanceTimersByTime(500);

    // Only the last call should execute
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('third');
  });
});

