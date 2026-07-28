/**
 * Utility to dynamically load the Razorpay SDK checkout script.
 * Ensures the script is only injected once.
 * @returns Promise<boolean> resolving to true on successful load, or false on failure.
 */
export const loadRazorpaySDK = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if Razorpay is already available globally
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    // Check if script tag has already been injected to avoid duplicate tags
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      // Script exists but is still loading; attach listeners to resolve
      const handleLoad = () => {
        cleanup();
        resolve(true);
      };
      const handleError = () => {
        cleanup();
        resolve(false);
      };
      const cleanup = () => {
        existingScript.removeEventListener('load', handleLoad);
        existingScript.removeEventListener('error', handleError);
      };

      existingScript.addEventListener('load', handleLoad);
      existingScript.addEventListener('error', handleError);
      return;
    }

    // Inject the script tag
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  });
};
