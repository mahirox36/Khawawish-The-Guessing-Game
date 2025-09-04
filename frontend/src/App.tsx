import { useState } from "react";
import { X } from "lucide-react";

export default function Home() {
  // Lobby Creation State
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000000));
  const [maxImages, setMaxImages] = useState<number>(25);
  const [page, setPage] = useState<"lobby" | "game">("lobby");
  const [images, setImages] = useState<string[]>([]);
  const [ownImage, setOwnImage] = useState<string[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<string[]>([]);
  // const [selectedCorrectIndexes, setSelectedCorrectIndexes] = useState<string[]>([]);

  async function startGame() {
    const baseUrl =
      process.env.NODE_ENV === "development"
      ? "http://localhost:8153"
      : "https://khawawish.mahirou.online/api";
    const result = await fetch(
      `${baseUrl}/images?seed=${seed}&max_images=${maxImages}`
    )
      .then((res) => res.json())
      .catch((err) => {
        console.error("Error fetching images:", err);
        return { images: [] };
      });
    setImages(result.files);
    setPage("game");
    console.log(result);
  }

  return (
    <div className="flex flex-col items-center  min-h-screen py-2">
      {page === "lobby" ? (
        <div>
          <h1 className="text-6xl font-bold">
            Welcome Khawawish: The Guessing Game
          </h1>
          <p className="mt-3 text-2xl">
            Select the seed and the max Characters as your friend to start
            playing!
          </p>
          <div className="mt-6 flex flex-col items-center">
            <div className="mb-4">
              <label className="block text-lg font-medium mb-2" htmlFor="seed">
                Seed:
              </label>
              <input
                type="number"
                id="seed"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 w-48"
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-lg font-medium mb-2"
                htmlFor="maxImages"
              >
                Max Characters:
              </label>
              <input
                type="number"
                id="maxImages"
                value={maxImages}
                onChange={(e) => setMaxImages(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 w-48"
              />
            </div>
            <button
              className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600"
              onClick={() => {
                startGame();
              }}
            >
              Start Game
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-4xl font-bold mb-6">Characters</h1>
          <div className="grid grid-cols-5 gap-4">
            {images.map((img, index) => (
              <div
                key={index}
                className={`border p-2 cursor-pointer relative ${
                  selectedIndexes.includes(index.toString())
                    ? "border-red-500"
                    : ""
                } ${ownImage.includes(img) ? "border-green-500 border-4" : ""}`} 
                onClick={() => {
                  setSelectedIndexes((prev) =>
                    prev.includes(index.toString())
                      ? prev.filter((i) => i !== index.toString())
                      : [...prev, index.toString()]
                  );
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setOwnImage([img]);
                }}
                >
                <img
                  src={`http://localhost:8153/static/images/${img}`}
                  alt={`Character ${index + 1}`}
                  className="w-32 h-32 object-cover mx-auto"
                  style={{ maxWidth: "128px", maxHeight: "128px" }}
                />
                {selectedIndexes.includes(index.toString()) && (
                  <span className="absolute top-6 right-6 bg-red-500 text-white rounded-full p-5 font-bold">
                    <X size={50}/>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
