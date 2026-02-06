import toast from 'react-hot-toast'

/**
 * Display a success toast notification
 * @param message - Success message to display
 */
export const handleSuccess = (message: string): void => {
    toast.success(message)
}

/**
 * Display an error toast notification and log to console
 * @param error - Error object or message
 * @param fallbackMessage - Default message if error has no message property
 */
export const handleError = (error: unknown, fallbackMessage = 'An error occurred'): void => {
    let message = fallbackMessage

    if (error instanceof Error) {
        message = error.message
    } else if (typeof error === 'string') {
        message = error
    } else if (error && typeof error === 'object' && 'message' in error) {
        message = String(error.message)
    }

    toast.error(message)
    console.error('Error:', error)
}

/**
 * Display an info toast notification
 * @param message - Info message to display
 */
export const handleInfo = (message: string): void => {
    toast(message, {
        icon: 'ℹ️',
    })
}

/**
 * Display a loading toast notification
 * @param message - Loading message to display
 * @returns Toast ID to dismiss later
 */
export const handleLoading = (message: string): string => {
    return toast.loading(message)
}

/**
 * Dismiss a specific toast or all toasts
 * @param toastId - Optional toast ID to dismiss specific toast
 */
export const dismissToast = (toastId?: string): void => {
    toast.dismiss(toastId)
}
