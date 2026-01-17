interface LoadingSpinnerProps {
    message?: string;
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
    return (
        <div className="loading">
            <div className="loading-spinner"></div>
            <p>{message}</p>
        </div>
    );
}
