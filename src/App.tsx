import Logo from "./assets/logo.png";
import "./App.css";

export default function App() {
  return (
    <div className="p-10 text-center flex flex-col justify-center items-center w-screen h-screen">
      <img className="rotate-center" width={350} src={Logo} />
      <h1 className="text-7xl font-bold text-white">Fastplate</h1>
      <h2
        style={{ color: "#ed244e" }}
        className="tracking-wider text-sm font-semibold mt-5"
      >
        React / React Router / TypeScript / Tailwind / DaisyUI / Axios / Zod /
        Zustand
      </h2>
      <p className="mt-10 w-1/2 text-xl">
        This template empowers you to swiftly build responsive and dynamic web
        applications by harnessing the capabilities of the stacks named below.
      </p>
      <p className="text-2xl text-white mt-20">
        Get started by editing <span style={{ color: "#ed244e" }}>App.tsx</span>{" "}
        file
      </p>
    </div>
  );
}
