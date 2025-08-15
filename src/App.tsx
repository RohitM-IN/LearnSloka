import { Player } from "./components/Player";

function App() {

  return (
    <Player
      audioSrc="/rudra.mp3"
      srtUrl="/rudra.srt"
      localStoragePrefix="rudraPlayer"
    />
  );
}

export default App;
