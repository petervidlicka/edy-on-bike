import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Edy on Bike",
    short_name: "Edy on Bike",
    start_url: "/",
    display: "fullscreen",
    orientation: "landscape",
    background_color: "#18181b",
    theme_color: "#18181b",
  };
}
