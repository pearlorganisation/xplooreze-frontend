import { useEffect } from "react";

const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;

export default function GoogleLogin({ handleResponse = () => { } }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        { theme: "outline", size: "large" }
      );
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div
      id="google-login-btn"
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center"
      }}
    ></div>
  );
}