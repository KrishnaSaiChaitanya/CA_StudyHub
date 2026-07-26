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
          backgroundColor: "#ffffff",
          padding: "42px",
          boxSizing: "border-box",
        }}
      >
        <LogoElement
          topBgColor="#ffffff"
          topTextColor="#000000"
          bottomBgColor="#000000"
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
