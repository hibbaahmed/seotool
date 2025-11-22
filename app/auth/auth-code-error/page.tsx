import { LoginFail } from "../../login/failed/components/LoginFail";

export default async function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  let errorMessage = "We couldn't complete your login. Please email us at team@bridgely.io for assistance.";

  if (params?.err !== undefined) {
    const errorCode = params["err"];
    switch (errorCode) {
      case "AuthApiError":
        errorMessage = "We couldn't verify your login. Please email us at team@bridgely.io for assistance.";
        break;
      case "500":
        errorMessage = "Something went wrong with the authentication process. Please email us at team@bridgely.io for assistance.";
        break;
    }
  }

  return (
    <div className="flex flex-col flex-1 w-full min-h-screen">
      <LoginFail errorMessage={errorMessage} />
    </div>
  );
}

