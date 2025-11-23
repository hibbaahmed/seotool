import { LoginFail } from "../../login/failed/components/LoginFail";

export default async function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  let errorMessage = "We couldn't complete your login. Please try again or email us at team@bridgely.io for assistance.";
  let technicalDetails = "";

  // Handle new error format from callback route
  if (params?.error !== undefined) {
    const errorText = params["error"] as string;
    const status = params["status"] as string;
    
    technicalDetails = `Error: ${errorText}${status ? ` (Status: ${status})` : ''}`;
    
    // Provide user-friendly messages based on common errors
    if (errorText.toLowerCase().includes('expired')) {
      errorMessage = "Your login link has expired. Please request a new one from the login page.";
    } else if (errorText.toLowerCase().includes('already been used')) {
      errorMessage = "This login link has already been used. Please request a new one from the login page.";
    } else if (errorText.toLowerCase().includes('invalid')) {
      errorMessage = "This login link is invalid. Please request a new one from the login page.";
    } else if (errorText === 'no_code') {
      errorMessage = "No authentication code was provided. Please try logging in again.";
    } else {
      errorMessage = "We couldn't complete your login. Please try again or email us at team@bridgely.io for assistance.";
    }
  }
  // Legacy error format
  else if (params?.err !== undefined) {
    const errorCode = params["err"];
    switch (errorCode) {
      case "AuthApiError":
        errorMessage = "We couldn't verify your login. Please try again or email us at team@bridgely.io for assistance.";
        break;
      case "500":
        errorMessage = "Something went wrong with the authentication process. Please try again or email us at team@bridgely.io for assistance.";
        break;
    }
  }

  return (
    <div className="flex flex-col flex-1 w-full min-h-screen">
      <LoginFail errorMessage={errorMessage} technicalDetails={technicalDetails} />
    </div>
  );
}

