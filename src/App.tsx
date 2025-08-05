import { Player } from "./components/Player";
import segments from "./data/rudra_segments.json";

function App() {
  return (
    <Player
      audioSrc="/rudra.mp3"
      segments={segments}
      localStoragePrefix="rudraPlayer"
    />
  );
}

export default App;
