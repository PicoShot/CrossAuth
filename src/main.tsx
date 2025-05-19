import { createRoot } from "react-dom/client";
import App from "./App";
import SplashScreen from "./SplashScreen";
import "./index.css";

const path = window.location.pathname;

createRoot(document.getElementById("root")!).render(
  path === "/splashscreen" ? <SplashScreen /> : <App />
);
