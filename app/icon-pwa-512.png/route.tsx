import { ImageResponse } from "next/og";
import { LogoElement } from "@/assets/logo";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f0f0f",
          padding: "96px",
          boxSizing: "border-box",
        }}
      >
        <LogoElement
          topBgColor="#0f0f0f"
          topTextColor="#ffffff"
          bottomBgColor="#0ea5e9"
          bottomTextColor="#ffffff"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
