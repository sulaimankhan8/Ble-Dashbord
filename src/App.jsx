import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";

const backendUrl = "https://ble-backend-trim.onrender.com"; // change to ngrok/production URL

// marker icons
const normalIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const relayIcon = new L.Icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/61/61168.png", // different icon for relayed
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

export default function App() {
  const [devices, setDevices] = useState({}); // { deviceId: { lat, lon, ts, relayed, uploaderDeviceId } }

  // fetch initial devices + events
  useEffect(() => {
    fetch(`${backendUrl}/api/devices`)
      .then((res) => res.json())
      .then((list) => {
        const obj = {};
        list.forEach((d) => {
          if (d.lastLocation) {
            obj[d.deviceId] = {
              ...d.lastLocation,
              relayed: false,
              uploaderDeviceId: null,
            };
          }
        });
        setDevices(obj);
      })
      .catch((e) => console.error(e));
  }, []);

  // socket connection
  useEffect(() => {
    const socket = io(backendUrl);

    socket.on("connect", () => {
      console.log("Socket connected", socket.id);
    });

    socket.on("event:new", (ev) => {
      setDevices((prev) => ({
        ...prev,
        [ev.deviceId]: {
          lat: ev.lat,
          lon: ev.lon,
          ts: ev.ts,
          relayed: ev.relayed,
          uploaderDeviceId: ev.uploaderDeviceId,
        },
      }));
    });

    return () => socket.disconnect();
  }, []);

  const markers = Object.entries(devices).map(([id, info]) => (
    <Marker
      key={id}
      position={[info.lat, info.lon]}
      icon={info.relayed ? relayIcon : normalIcon}
    >
      <Popup>
        <b>{id}</b>
        <br />
        {info.lat}, {info.lon}
        <br />
        {info.ts ? new Date(info.ts).toLocaleString() : "No time"}
        {info.relayed && (
          <>
            <br />
            <i>Uploaded via {info.uploaderDeviceId}</i>
          </>
        )}
      </Popup>
    </Marker>
  ));

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
  <Link
    to="/download"
    style={{
      padding: "8px 15px",
      backgroundColor: "#1e90ff",
      color: "#fff",
      borderRadius: "5px",
      textDecoration: "none",
    }}
  >
    Download App
  </Link>
</div>
      <MapContainer
        center={[20, 77]} // India center
        zoom={5}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers}
      </MapContainer>
    </div>
  );
}
