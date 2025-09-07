import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";

const backendUrl = "https://ble-backend-trim.onrender.com";

// Function to generate a unique color for each device
const getDeviceColor = (deviceId) => {
  let hash = 0;
  for (let i = 0; i < deviceId.length; i++) {
    hash = deviceId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

// Create custom marker icons with unique colors
const createCustomIcon = (color, isRelayed) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: ${isRelayed ? '3px solid white' : '2px solid rgba(0,0,0,0.5)'};
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${isRelayed ? '<div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div>' : ''}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

export default function App() {
  const [devices, setDevices] = useState({});
  const [stats, setStats] = useState({ total: 0, online: 0 });

  // Fetch initial devices
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
        setStats({ total: list.length, online: list.filter(d => d.lastLocation).length });
      })
      .catch((e) => console.error(e));
  }, []);

  // Socket connection
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
      setStats(prev => ({ ...prev, online: Object.keys(prev).length + 1 }));
    });
    return () => socket.disconnect();
  }, []);

  const markers = Object.entries(devices).map(([id, info]) => {
    const color = getDeviceColor(id);
    const icon = createCustomIcon(color, info.relayed);
    
    return (
      <Marker key={id} position={[info.lat, info.lon]} icon={icon}>
        <Popup className="custom-popup">
          <div className="popup-header">
            <span className="device-id">{id}</span>
            <span className={`status ${info.relayed ? 'relayed' : 'direct'}`}>
              {info.relayed ? 'Relayed' : 'Direct'}
            </span>
          </div>
          <div className="popup-content">
            <p><strong>Location:</strong> {info.lat.toFixed(6)}, {info.lon.toFixed(6)}</p>
            <p><strong>Last Update:</strong> {info.ts ? new Date(info.ts).toLocaleString() : "No time"}</p>
            {info.relayed && (
              <p><strong>Uploaded via:</strong> {info.uploaderDeviceId}</p>
            )}
          </div>
        </Popup>
      </Marker>
    );
  });

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>BLE Device Tracker</h1>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Devices</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.online}</span>
              <span className="stat-label">Online</span>
            </div>
          </div>
        </div>
        <Link to="/download" className="download-btn">
          <span>Download App</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </Link>
      </header>

      <div className="map-container">
        <MapContainer
          center={[20, 77]}
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

      <style jsx>{`
        .app-container {
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .app-header {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          z-index: 1000;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .app-header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }

        .stats {
          display: flex;
          gap: 20px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-value {
          font-size: 20px;
          font-weight: bold;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.8;
        }

        .download-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: rgba(255,255,255,0.2);
          color: white;
          padding: 8px 15px;
          border-radius: 30px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          border: 1px solid rgba(255,255,255,0.3);
        }

        .download-btn:hover {
          background-color: rgba(255,255,255,0.3);
          transform: translateY(-2px);
        }

        .map-container {
          flex: 1;
          position: relative;
        }

        .custom-popup .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }

        .device-id {
          font-weight: bold;
          color: #2a5298;
        }

        .status {
          font-size: 12px;
          padding: 3px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .status.direct {
          background-color: #d4edda;
          color: #155724;
        }

        .status.relayed {
          background-color: #fff3cd;
          color: #856404;
        }

        .popup-content p {
          margin: 5px 0;
          font-size: 14px;
        }

        .popup-content strong {
          color: #333;
        }
      `}</style>
    </div>
  );
}