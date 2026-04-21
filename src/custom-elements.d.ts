declare namespace JSX {
  interface IntrinsicElements {
    'altcha-widget': {
      challengeurl?: string;
      name?: string;
      auto?: string;
      hidelogo?: boolean;
      hidefooter?: boolean;
      ref?: unknown;
      className?: string;
      style?: Record<string, string>;
      [key: string]: unknown;
    };
  }
}
