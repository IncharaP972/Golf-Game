import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import StartScreen from "@/react-app/pages/StartScreen";
import Game from "@/react-app/pages/Game-Firebase";
import LevelSelectScreen from "@/react-app/pages/LevelSelectScreen";
import Login from "@/react-app/pages/Login";
import FirebaseLeaderboard from "@/react-app/components/FirebaseLeaderboard";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<StartScreen />} />
          <Route path="/login" element={<Login />} />
          <Route path="/game" element={<Game />} />
          <Route path="/levels" element={<LevelSelectScreen />} />
          <Route path="/leaderboard" element={<FirebaseLeaderboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
