import { BrowserRouter } from "react-router";
import { AppRouter } from "./Router";

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
