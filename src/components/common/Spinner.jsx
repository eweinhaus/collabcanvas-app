import './Spinner.css';

const Spinner = ({ size = 40, message = 'Loading...' }) => {
  return (
    <div className="spinner-container" role="status" aria-live="polite">
      <svg
        className="spinner"
        width={size}
        height={size}
        viewBox="0 0 50 50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="spinner__path"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="5"
        />
      </svg>
      {message && <p className="spinner__message">{message}</p>}
      <span className="sr-only">{message}</span>
    </div>
  );
};

export default Spinner;

