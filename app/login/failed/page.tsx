
import { LoginFail } from "./components/LoginFail";

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {

    let errorMessage = "Something went wrong, please reach out to support.";

    const params = await searchParams;
    if (params?.err !== undefined) {
        const errorCode = params["err"];
        switch (errorCode) {
            case "AuthApiError":
                errorMessage = "Oops! It looks like you tried to open your magic link from another device or browser.";
                break;
            case "500":
                errorMessage = "Something went wrong, please reach out to support.";
                break;
        }
    }

    return (
        <div className="flex flex-col flex-1 w-full h-[calc(100vh-73px)]">
            <LoginFail errorMessage={errorMessage} />
        </div>
    );
}