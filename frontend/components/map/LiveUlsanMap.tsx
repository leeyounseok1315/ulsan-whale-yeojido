"use client";

import { useEffect, useRef } from "react";
import {
    Map as MapLibreMap,
    Marker as MapLibreMarker,
    setWorkerUrl,
} from "maplibre-gl";

import type { WhaleSpot } from "@/backend/lib/types";
function applyCuteBaseStyle(map: MapLibreMap) {
    // 전체 바탕
    if (map.getLayer("background")) {
        map.setPaintProperty(
            "background",
            "background-color",
            "#f7fbf5",
        );
    }

    // 바다 / 강
    if (map.getLayer("water")) {
        map.setPaintProperty(
            "water",
            "fill-color",
            "#79cbed",
        );
    }

    // 공원
    if (map.getLayer("park")) {
        map.setPaintProperty(
            "park",
            "fill-color",
            "#ccebd8",
        );

        map.setPaintProperty(
            "park",
            "fill-opacity",
            0.9,
        );
    }

    if (map.getLayer("park_outline")) {
        map.setPaintProperty(
            "park_outline",
            "line-color",
            "#9fd7bd",
        );
    }

    // 숲
    if (map.getLayer("landcover_wood")) {
        map.setPaintProperty(
            "landcover_wood",
            "fill-color",
            "#b9dfca",
        );

        map.setPaintProperty(
            "landcover_wood",
            "fill-opacity",
            0.75,
        );
    }

    // 초지
    if (map.getLayer("landcover_grass")) {
        map.setPaintProperty(
            "landcover_grass",
            "fill-color",
            "#d6efdc",
        );

        map.setPaintProperty(
            "landcover_grass",
            "fill-opacity",
            0.75,
        );
    }

    // 주거지역
    if (map.getLayer("landuse_residential")) {
        map.setPaintProperty(
            "landuse_residential",
            "fill-color",
            "#fffaf2",
        );
    }

    // 작은 도로
    if (map.getLayer("road_service_track")) {
        map.setPaintProperty(
            "road_service_track",
            "line-color",
            "#ffffff",
        );
    }

    if (map.getLayer("road_minor")) {
        map.setPaintProperty(
            "road_minor",
            "line-color",
            "#ffffff",
        );
    }

    // 중간 도로
    if (map.getLayer("road_secondary_tertiary")) {
        map.setPaintProperty(
            "road_secondary_tertiary",
            "line-color",
            "#fff3df",
        );
    }

    // 큰 도로
    if (map.getLayer("road_trunk_primary")) {
        map.setPaintProperty(
            "road_trunk_primary",
            "line-color",
            "#ffe3b8",
        );
    }

    // 고속도로
    if (map.getLayer("road_motorway")) {
        map.setPaintProperty(
            "road_motorway",
            "line-color",
            "#ffc98e",
        );
    }

    // 도로 외곽선도 부드럽게
    if (map.getLayer("road_trunk_primary_casing")) {
        map.setPaintProperty(
            "road_trunk_primary_casing",
            "line-color",
            "#f2dcc4",
        );
    }

    if (map.getLayer("road_motorway_casing")) {
        map.setPaintProperty(
            "road_motorway_casing",
            "line-color",
            "#edcfad",
        );
    }
}

function getSpotMarker(
    spot: WhaleSpot,
    scope: "whale" | "all",
) {
    if (scope === "whale") {
        return {
            icon: "🐋",
            color: "#6557c9",
        };
    }

    switch (spot.category) {
        case "nature":
            return {
                icon: "🌿",
                color: "#37b99a",
            };

        case "heritage":
            return {
                icon: "🏛️",
                color: "#7658b8",
            };

        case "culture":
            return {
                icon: "🎨",
                color: "#4b8bd8",
            };

        case "experience":
            return {
                icon: "🎟️",
                color: "#ff756d",
            };

        case "festival":
            return {
                icon: "🎉",
                color: "#ff9f43",
            };

        default:
            return {
                icon: "📍",
                color: "#397fd2",
            };
    }
}

export function LiveUlsanMap({
    spots,
    onSelect,
    scope,
}: {
    spots: WhaleSpot[];
    onSelect: (spot: WhaleSpot) => void;
    scope: "whale" | "all";
}) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markersRef = useRef<MapLibreMarker[]>([]);

    useEffect(() => {
        if (!mapContainer.current) return;

        setWorkerUrl(
            "/maplibre/maplibre-gl-worker.mjs",
        );

        const map = new MapLibreMap({
            container: mapContainer.current,
            style:
                "https://tiles.openfreemap.org/styles/liberty",
            center: [129.3114, 35.5384],
            zoom: 10.5,
            attributionControl: {},
        });

        map.on("style.load", () => {
            applyCuteBaseStyle(map);
            const layers = map.getStyle().layers ?? [];

            for (const layer of layers) {
                if (layer.type !== "symbol") continue;

                try {
                    map.setPaintProperty(
                        layer.id,
                        "text-color",
                        "#3f6380",
                    );

                    map.setPaintProperty(
                        layer.id,
                        "text-halo-color",
                        "#f8fff9",
                    );

                    map.setPaintProperty(
                        layer.id,
                        "text-halo-width",
                        1.4,
                    );
                } catch {
                    // 텍스트가 없는 symbol layer는 건너뜀
                }
            }
        });

        mapRef.current = map;

        return () => {
            markersRef.current.forEach((marker) =>
                marker.remove(),
            );

            markersRef.current = [];
            mapRef.current = null;

            map.remove();
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;

        if (!map) return;

        markersRef.current.forEach((marker) =>
            marker.remove(),
        );

        markersRef.current = [];

        for (const spot of spots) {
            const lon = Number(spot.lon);
            const lat = Number(spot.lat);

            if (
                !Number.isFinite(lon) ||
                !Number.isFinite(lat)
            ) {
                continue;
            }

            const markerElement =
                document.createElement("button");

            markerElement.type = "button";
            markerElement.setAttribute(
                "aria-label",
                `${spot.title} 보기`,
            );

            const markerStyle = getSpotMarker(spot, scope);

            markerElement.style.width = "40px";
            markerElement.style.height = "46px";
            markerElement.style.border = "0";
            markerElement.style.padding = "0";
            markerElement.style.background = "transparent";
            markerElement.style.cursor = "pointer";
            markerElement.style.display = "flex";
            markerElement.style.alignItems = "flex-start";
            markerElement.style.justifyContent = "center";

            const pin = document.createElement("span");

            pin.style.width = "34px";
            pin.style.height = "34px";
            pin.style.display = "flex";
            pin.style.alignItems = "center";
            pin.style.justifyContent = "center";
            pin.style.background = markerStyle.color;
            pin.style.border = "3px solid white";
            pin.style.borderRadius = "50% 50% 50% 0";
            pin.style.transform = "rotate(-45deg)";
            pin.style.boxShadow =
                "0 5px 14px rgba(18, 54, 106, 0.25)";

            const icon = document.createElement("span");

            icon.textContent = markerStyle.icon;
            icon.style.fontSize = "17px";
            icon.style.lineHeight = "1";
            icon.style.transform = "rotate(45deg)";
            icon.style.display = "block";

            pin.appendChild(icon);
            markerElement.appendChild(pin);

            markerElement.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();
                    onSelect(spot);
                },
            );

            const marker = new MapLibreMarker({
                element: markerElement,
                anchor: "bottom",
            })
                .setLngLat([lon, lat])
                .addTo(map);

            markersRef.current.push(marker);
        }

        return () => {
            markersRef.current.forEach((marker) =>
                marker.remove(),
            );

            markersRef.current = [];
        };
    }, [spots, onSelect, scope]);

    return (
        <div
            ref={mapContainer}
            className="h-full w-full"
        />
    );
}