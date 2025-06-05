/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import { usePathname, useRouter } from "next/navigation";
import { Component, useEffect, useState } from "react";
interface AuthProps {
  isLoggedIn?: boolean;
}

function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  const AuthComponent = (props: P & AuthProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
      let accessToken: string | null = null;
      try {
        accessToken = localStorage.getItem("accessToken");
      } catch (error) {}

      const isLoggedIn = !!accessToken;
      setIsLoggedIn(isLoggedIn);

      const unauthenticatedPaths = ["/sign-in", "/sign-up"];

      if (!isLoggedIn && !unauthenticatedPaths.includes(pathname)) {
        router.push("/sign-in");
      } else if (isLoggedIn && unauthenticatedPaths.includes(pathname)) {
        router.push("/u");
      } else {
        setIsLoading(false);
      }
    }, [pathname, router]);

    if (isLoading) return null;

    return <WrappedComponent {...props} isLoggedIn={isLoggedIn} />;
  };

  return AuthComponent;
}

export default withAuth;