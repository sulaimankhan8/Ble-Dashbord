import React from "react";

export default function DownloadApp() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Download Our Flutter App</h1>
      <p>Get the latest version of the app for Android & iOS:</p>
      <a
        href="./your-flutter-app.apk"
        style={{
          display: "inline-block",
          padding: "10px 20px",
          backgroundColor: "#1e90ff",
          color: "white",
          borderRadius: "5px",
          textDecoration: "none",
          marginTop: "20px",
        }}
        download
      >
        Download APK
      </a>
      <p style={{ marginTop: "20px", color: "gray" }}>
        iOS version will be available soon on the App Store
      </p>
    </div>
  );
}
