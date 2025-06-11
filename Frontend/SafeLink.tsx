"use client";

import React from "react";

/* anchor props identical to <a …> */
type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;
export type SafeLinkProps = AnchorProps & { href: string };

const SafeLink = React.forwardRef<HTMLAnchorElement, SafeLinkProps>(
  ({ children, ...rest }, ref) => (
    // NB:  target / rel / router stuff – change as you like
    <a ref={ref} {...rest}>
      {children}
    </a>
  )
);

SafeLink.displayName = "SafeLink";
export default SafeLink;
