import { useState } from 'react';
import { X } from 'lucide-react';
import { baseUrl } from '../api';

interface GameProps {
  images: string[];
  onSelectCharacter: (character: string) => void;
  onOwnCharacterSelect: (character: string) => void;
}

export function Game({ images, onSelectCharacter, onOwnCharacterSelect }: GameProps) {
  const [selectedIndexes, setSelectedIndexes] = useState<string[]>([]);
  const [ownImage, setOwnImage] = useState<string[]>([]);

  const handleClick = (index: number, image: string) => {
    setSelectedIndexes(prev =>
      prev.includes(index.toString())
        ? prev.filter(i => i !== index.toString())
        : [...prev, index.toString()]
    );
    onSelectCharacter(image);
  };

  const handleRightClick = (e: React.MouseEvent, image: string) => {
    e.preventDefault();
    setOwnImage([image]);
    onOwnCharacterSelect(image);
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Characters</h1>
      <div className="grid grid-cols-5 gap-4">
        {images.map((img, index) => (
          <div
            key={index}
            className={`group border p-2 cursor-pointer relative ${
              selectedIndexes.includes(index.toString())
                ? "border-red-500"
                : ""
            } ${ownImage.includes(img) ? "border-green-500 border-4" : ""}`}
            onClick={() => handleClick(index, img)}
            onContextMenu={(e) => handleRightClick(e, img)}
          >
            <img
              src={`${baseUrl}/static/images/${img}`}
              alt={`Character ${index + 1}`}
              className="w-32 h-32 object-cover mx-auto"
              style={{ maxWidth: "128px", maxHeight: "128px" }}
            />
            {selectedIndexes.includes(index.toString()) && (
              <span className="absolute top-6 right-6 bg-red-500 text-white rounded-full p-5 font-bold opacity-95 group-hover:opacity-20 transition-opacity duration-100">
                <X size={50} />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}