import React from 'react';
import { render } from '@testing-library/react';

jest.mock('react-konva', () => ({
  Group: ({ children }) => <div>{children}</div>,
  Circle: ({ fill }) => <div data-testid="cursor-pointer" data-fill={fill} />,
  Rect: ({ fill }) => <div data-testid="cursor-bg" data-fill={fill} />,
  Text: ({ text }) => <div data-testid="cursor-label">{text}</div>,
}));

import RemoteCursor from '../RemoteCursor';

describe('RemoteCursor', () => {
  it('renders without crashing with valid props', () => {
    const { getByTestId } = render(
      <RemoteCursor x={100} y={200} color="#ff0000" label="JD" stageScale={1} />
    );

    expect(getByTestId('cursor-pointer')).toBeInTheDocument();
    expect(getByTestId('cursor-pointer').dataset.fill).toBe('#ff0000');
    expect(getByTestId('cursor-bg')).toBeInTheDocument();
    expect(getByTestId('cursor-bg').dataset.fill).toBe('#ff0000');
    expect(getByTestId('cursor-label')).toHaveTextContent('JD');
  });

  it('handles different scale values', () => {
    const { getByTestId } = render(
      <RemoteCursor x={0} y={0} color="#0000ff" label="AB" stageScale={2} />
    );

    expect(getByTestId('cursor-pointer')).toBeInTheDocument();
    expect(getByTestId('cursor-label')).toHaveTextContent('AB');
  });

  it('renders with different colors and labels', () => {
    const { getByTestId } = render(
      <RemoteCursor x={50} y={75} color="#00ff00" label="TC" stageScale={1.5} />
    );

    expect(getByTestId('cursor-pointer').dataset.fill).toBe('#00ff00');
    expect(getByTestId('cursor-label')).toHaveTextContent('TC');
  });
});


