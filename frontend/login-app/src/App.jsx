import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginSignup   from "./components/loginSignup/LoginSignup";
import Home          from "./Home";
import HomeMedico    from "./HomeMedico";
import Waves         from "./Waves";
import PanelClinico  from "./PanelClinico";
import Graphics      from "./Graphics";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<div className="page"><LoginSignup /></div>} />
        <Route path="/home"         element={<Home />} />
        <Route path="/doctor"       element={<HomeMedico />} />
        <Route path="/waves"        element={<Waves />} />
        <Route path="/waves/panel"  element={<PanelClinico />} />
        <Route path="/graphics"     element={<Graphics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;