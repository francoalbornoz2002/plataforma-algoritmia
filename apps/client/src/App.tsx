import { BrowserRouter } from "react-router";
import { AppRouter } from "./Router";
import Sidebar from "./common/Sidebar";

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <Sidebar></Sidebar>
    </BrowserRouter>
  );
}
